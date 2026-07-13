"""Preset topic tag order for learning-path catalog sort.

MUST stay aligned with frontend/src/lib/tags.ts `PRESET_TAGS` id order.
"""

from __future__ import annotations

# Keep in sync with frontend PRESET_TAGS ids (learning curriculum order).
PRESET_TAG_ORDER: list[str] = [
    "array",
    "string",
    "linked list",
    "binary tree",
    "tree",
    "graph",
    "dfs",
    "bfs",
    "dp",
    "hash map",
    "heap",
    "top k",
    "sorting",
    "binary search",
    "stack",
    "queue",
    "deque",
    "recursion",
    "backtracking",
    "two pointers",
    "sliding window",
    "n-sum",
    "k-way merge",
    "lca",
    "bit manipulation",
    "greedy",
    "math",
]

NOTES_PAGE_SIZE = 8
