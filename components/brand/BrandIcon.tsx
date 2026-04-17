import Image from "next/image";

import { cn } from "@/lib/utils";

type BrandIconProps = {
  size?: number;
  className?: string;
  imageClassName?: string;
  alt?: string;
};

export function BrandIcon({
  size = 32,
  className,
  imageClassName,
  alt = "EnglishLabs",
}: BrandIconProps) {
  return (
    <span
      className={cn(
        // Keep the mark readable on both light and dark surfaces (and at small sizes) with a crisp badge + ring.
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm",
        "ring-1 ring-black/15 dark:ring-white/15",
        className
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src="/brand/englishlabs.png"
        width={size}
        height={size}
        alt={alt}
        className={cn("h-full w-full object-contain contrast-125 saturate-150", imageClassName)}
        priority={false}
      />
    </span>
  );
}
