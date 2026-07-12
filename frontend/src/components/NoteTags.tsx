import { Chip } from "@heroui/react";

type NoteTagsProps = {
  tags: string[];
  emptyLabel?: string;
  size?: "sm" | "md";
  className?: string;
};

export function NoteTags({
  tags,
  emptyLabel = "No tags",
  size = "sm",
  className = "",
}: NoteTagsProps) {
  if (!tags.length) {
    return <p className={`text-sm text-slate-400 ${className}`}>{emptyLabel}</p>;
  }

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {tags.map((tag) => (
        <Chip
          key={tag}
          size={size}
          variant="soft"
          color="accent"
          className="rounded-full"
        >
          <Chip.Label>{tag}</Chip.Label>
        </Chip>
      ))}
    </div>
  );
}
