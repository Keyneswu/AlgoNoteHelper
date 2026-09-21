import Image from "next/image";

type BrandLockupProps = {
  label: string;
  className?: string;
  markClassName?: string;
  textClassName?: string;
  preload?: boolean;
};

export function BrandLockup({
  label,
  className = "",
  markClassName = "size-7",
  textClassName = "",
  preload = false,
}: BrandLockupProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src="/brand/algonote-icon.svg"
        alt=""
        width={64}
        height={64}
        preload={preload}
        className={`shrink-0 ${markClassName}`}
      />
      <span className={textClassName}>{label}</span>
    </span>
  );
}
