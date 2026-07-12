/** Preset topic tags for practice notes.

Derived from folder names in the user's AlgorithmNotes repo
(`org/example/firstround|secondround/...`), normalized to stable labels.
*/

export type PresetTag = {
  /** Stored value (lowercase, spaces ok) */
  id: string;
  /** Short display label */
  label: string;
};

export const PRESET_TAGS: PresetTag[] = [
  { id: "array", label: "Array" },
  { id: "string", label: "String" },
  { id: "linked list", label: "Linked List" },
  { id: "binary tree", label: "Binary Tree" },
  { id: "tree", label: "Tree" },
  { id: "graph", label: "Graph" },
  { id: "dfs", label: "DFS" },
  { id: "bfs", label: "BFS" },
  { id: "dp", label: "DP" },
  { id: "hash map", label: "Hash Map" },
  { id: "heap", label: "Heap" },
  { id: "top k", label: "Top K" },
  { id: "sorting", label: "Sorting" },
  { id: "binary search", label: "Binary Search" },
  { id: "stack", label: "Stack" },
  { id: "queue", label: "Queue" },
  { id: "deque", label: "Deque" },
  { id: "recursion", label: "Recursion" },
  { id: "backtracking", label: "Backtracking" },
  { id: "two pointers", label: "Two Pointers" },
  { id: "sliding window", label: "Sliding Window" },
  { id: "n-sum", label: "n-Sum" },
  { id: "k-way merge", label: "k-Way Merge" },
  { id: "lca", label: "LCA" },
  { id: "bit manipulation", label: "Bit Manipulation" },
  { id: "greedy", label: "Greedy" },
  { id: "math", label: "Math" },
];

export function normalizeTag(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

export function displayTag(tag: string): string {
  const preset = PRESET_TAGS.find((item) => item.id === normalizeTag(tag));
  if (preset) return preset.label;
  if (!tag) return tag;
  return tag
    .split(" ")
    .map((part) => (part ? part[0]!.toUpperCase() + part.slice(1) : part))
    .join(" ");
}
