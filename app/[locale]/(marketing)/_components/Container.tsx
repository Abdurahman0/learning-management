import type { ElementType, HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ContainerProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "children">;

export function Container<T extends ElementType = "div">({
  as,
  children,
  className,
  ...props
}: ContainerProps<T>) {
  const Comp = (as ?? "div") as ElementType;

  return (
    <Comp className={cn("mx-auto w-full max-w-400 px-4 sm:px-5 lg:px-5", className)} {...props}>
      {children}
    </Comp>
  );
}
