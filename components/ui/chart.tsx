import type {ReactNode} from "react";

import {cn} from "@/lib/utils";

type ChartContainerProps = {
  children: ReactNode;
  className?: string;
};

export function ChartContainer({children, className}: ChartContainerProps) {
  return <div className={cn("w-full overflow-x-auto", className)}>{children}</div>;
}
