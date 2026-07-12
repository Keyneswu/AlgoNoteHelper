import { Chip } from "@heroui/react";
import { displayTag } from "@/lib/tags";

type NoteTagsProps = {
  tags: string[];
  emptyLabel?: string;
  size?: "sm" | "md";
  className?: string;
};

export function NoteTags({
  tags,
  emptyLabel = "",
  size = "sm",
  className = "",
}: NoteTagsProps) {
  if (!tags.length) {
    if (!emptyLabel) return null;
    return <p className={`text-sm text-muted ${className}`}>{emptyLabel}</p>;
  }

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {tags.map((tag) => (
        <Chip key={tag} size={size} variant="soft" color="accent" className="rounded-full">
          <Chip.Label>{displayTag(tag)}</Chip.Label>
        </Chip>
      ))}
    </div>
  );
}
