from __future__ import annotations


def vector_literal(query_vec: list[float]) -> str:
    """Format a float vector as a pgvector literal: ``[0.1,0.2,...]``."""
    return "[" + ",".join(str(float(x)) for x in query_vec) + "]"


def embedding_distance_sql(vec_literal: str) -> str:
    """Cosine distance expression: ``embedding <=> '[...]'::vector``."""
    return f"embedding <=> '{vec_literal}'::vector"


def embedding_score_sql(vec_literal: str) -> str:
    """Similarity score: ``1 - (embedding <=> '[...]'::vector)``."""
    return f"1 - ({embedding_distance_sql(vec_literal)})"


def embedding_within_distance_sql(vec_literal: str, max_distance: float) -> str:
    """Distance threshold filter: ``(embedding <=> ...) <= max_distance``."""
    return f"({embedding_distance_sql(vec_literal)}) <= {max_distance}"
