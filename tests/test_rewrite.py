from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.api import rewrite
from app.schemas.notes import GenerateApproachRequest, RewriteContext, RewriteRequest


def make_request(**overrides: object) -> RewriteRequest:
    values: dict[str, object] = {
        "field": "statement",
        "operation": "format_markdown",
        "text": "Given an array, return the largest sum.",
        "context": {
            "title": "Largest Sum",
            "statement": "irrelevant statement context",
            "approach": "irrelevant approach context",
            "tags": ["dp"],
            "code": "return 0;",
        },
    }
    values.update(overrides)
    return RewriteRequest(**values)


def test_rewrite_request_rejects_generic_code_rewrite() -> None:
    with pytest.raises(ValidationError):
        make_request(field="code", operation="custom", instruction="Refactor it")


@pytest.mark.parametrize(
    ("field", "operation"),
    [
        ("statement", "organize"),
        ("approach", "format_markdown"),
        ("pitfall", "organize"),
    ],
)
def test_rewrite_request_rejects_invalid_field_operation(
    field: str, operation: str
) -> None:
    with pytest.raises(ValidationError):
        make_request(field=field, operation=operation)


def test_custom_operation_requires_a_bounded_instruction() -> None:
    with pytest.raises(ValidationError):
        make_request(operation="custom", instruction=" ")

    with pytest.raises(ValidationError):
        make_request(operation="custom", instruction="x" * 2001)


def test_rewrite_request_rejects_whitespace_only_target() -> None:
    with pytest.raises(ValidationError):
        make_request(text="   \n ")


def test_rewrite_context_bounds_each_tag() -> None:
    with pytest.raises(ValidationError):
        make_request(context={"title": "Example", "tags": ["x" * 201]})


def test_statement_prompt_uses_only_title_context_and_non_invention_policy() -> None:
    messages = rewrite._build_rewrite_messages(make_request())

    assert "Do not add constraints" in messages[0]["content"]
    assert "preserve spacing-dependent" in messages[0]["content"]
    assert "Largest Sum" in messages[1]["content"]
    assert "irrelevant statement context" not in messages[1]["content"]
    assert "irrelevant approach context" not in messages[1]["content"]
    assert "return 0;" not in messages[1]["content"]


def test_approach_prompt_includes_grounding_context_and_custom_instruction() -> None:
    request = make_request(
        field="approach",
        operation="custom",
        text="Use dynamic programming.",
        instruction="Put complexity last.",
        context=RewriteContext(
            title="Largest Sum",
            statement="Find the largest sum.",
            approach="must not be repeated as context",
            tags=["dp", "array"],
            code="int solve() {}",
        ),
    )

    messages = rewrite._build_rewrite_messages(request)

    assert "Find the largest sum." in messages[1]["content"]
    assert "dp, array" in messages[1]["content"]
    assert "int solve() {}" in messages[1]["content"]
    assert "Put complexity last." in messages[1]["content"]
    assert "must not be repeated as context" not in messages[1]["content"]


def test_generation_prompt_keeps_a_complete_statement_authoritative() -> None:
    request = GenerateApproachRequest(
        title="Longest Subarray",
        statement=(
            "Given a binary matrix, return the side length of the largest square "
            "whose border contains only ones. The matrix has M rows and N columns."
        ),
        tags=["array"],
        code="int longestIncreasingSubarray(int[] values) { return 0; }",
    )

    messages = rewrite._build_generate_approach_messages(request)

    assert "authoritative source" in messages[0]["content"]
    assert "ignore the conflicting auxiliary context" in messages[0]["content"]
    assert "Always write an" in messages[0]["content"]
    assert "do not refuse" in messages[0]["content"]
    assert "INSUFFICIENT_STATEMENT" not in messages[0]["content"]
    assert request.statement in messages[1]["content"]


def test_pitfall_output_is_normalized_to_one_line() -> None:
    request = make_request(
        field="pitfall",
        operation="clarify",
        text="Do not overwrite the previous DP row.",
    )

    assert (
        rewrite._normalize_rewrite_output(request, "  Keep the previous\nDP row.  ")
        == "Keep the previous DP row."
    )


def test_pitfall_output_must_remain_non_empty() -> None:
    request = make_request(
        field="pitfall",
        operation="shorten",
        text="Do not overwrite the previous DP row.",
    )

    with pytest.raises(HTTPException, match="empty content"):
        rewrite._normalize_rewrite_output(request, " \n ")


@pytest.mark.asyncio
async def test_rewrite_returns_model_output_as_unsaved_candidate(monkeypatch) -> None:
    request = make_request()
    captured: dict[str, object] = {}

    async def fake_config(db: object, user_id: str):
        assert user_id == "user-1"
        return (
            SimpleNamespace(chat_base_url="https://example.test", chat_model="model"),
            "secret",
        )

    async def fake_completion(**kwargs: object) -> str:
        captured.update(kwargs)
        return "## Problem\n\nReturn the largest sum."

    monkeypatch.setattr(rewrite, "require_chat_config", fake_config)
    monkeypatch.setattr(rewrite, "chat_completion", fake_completion)

    response = await rewrite.rewrite_field(request, user_id="user-1", db=object())

    assert response.rewritten == "## Problem\n\nReturn the largest sum."
    assert captured["temperature"] == 0.1


@pytest.mark.asyncio
async def test_rewrite_stops_when_chat_credentials_are_missing(monkeypatch) -> None:
    called = False

    async def missing_config(db: object, user_id: str):
        raise HTTPException(status_code=400, detail="Chat API key required")

    async def fake_completion(**kwargs: object) -> str:
        nonlocal called
        called = True
        return "unused"

    monkeypatch.setattr(rewrite, "require_chat_config", missing_config)
    monkeypatch.setattr(rewrite, "chat_completion", fake_completion)

    with pytest.raises(HTTPException, match="Chat API key required"):
        await rewrite.rewrite_field(make_request(), user_id="user-1", db=object())

    assert called is False


@pytest.mark.asyncio
async def test_generate_approach_rejects_incomplete_statement_before_model(
    monkeypatch,
) -> None:
    called = False

    async def fake_completion(**kwargs: object) -> str:
        nonlocal called
        called = True
        return "unused"

    monkeypatch.setattr(rewrite, "chat_completion", fake_completion)

    with pytest.raises(HTTPException, match="incomplete"):
        await rewrite.generate_approach(
            GenerateApproachRequest(title="X", statement="too short"),
            user_id="user-1",
            db=object(),
        )

    assert called is False


@pytest.mark.asyncio
async def test_generate_approach_returns_model_output_for_complete_statement(
    monkeypatch,
) -> None:
    async def fake_config(db: object, user_id: str):
        return (
            SimpleNamespace(chat_base_url="https://example.test", chat_model="model"),
            "secret",
        )

    async def fake_completion(**kwargs: object) -> str:
        return "## Approach\n\n1. Scan borders\n2. Track max side length"

    monkeypatch.setattr(rewrite, "require_chat_config", fake_config)
    monkeypatch.setattr(rewrite, "chat_completion", fake_completion)

    response = await rewrite.generate_approach(
        GenerateApproachRequest(
            title="Longest Subarray",
            statement=(
                "Given a binary matrix, return the side length of the largest square "
                "whose border contains only ones."
            ),
            tags=["dp"],
            code="",
        ),
        user_id="user-1",
        db=object(),
    )

    assert "Scan borders" in response.rewritten
