"use client";

import * as React from "react";

import {cn} from "@/lib/utils";

type ProgressProps = React.ComponentProps<"div"> & {
  value?: number;
};

export function Progress({className, value = 0, ...props}: ProgressProps) {
  const safe = Math.max(0, Math.min(100, value));

  return (
    <div
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(safe)}
      {...props}
    >
      <div className="h-full rounded-full bg-primary transition-all" style={{width: `${safe}%`}} />
    </div>
  );
}
