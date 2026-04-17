"use client";

import { Fragment, useMemo } from "react";

import { cn } from "@/lib/utils";

type BoldToken = { value: string; bold: boolean };

function tokenizeInlineBold(text: string): BoldToken[] {
  // Minimal inline markdown: supports **bold** only.
  const tokens: BoldToken[] = [];
  const re = /\*\*/g;
  let lastIndex = 0;
  let bold = false;

  for (const match of text.matchAll(re)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      const value = text.slice(lastIndex, index);
      if (value) tokens.push({ value, bold });
    }
    bold = !bold;
    lastIndex = index + 2;
  }

  if (lastIndex < text.length) {
    const value = text.slice(lastIndex);
    if (value) tokens.push({ value, bold });
  }

  return tokens;
}

export function InlineBoldText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const tokens = useMemo(() => tokenizeInlineBold(text), [text]);

  return (
    <span className={cn(className)}>
      {tokens.map((token, idx) =>
        token.bold ? (
          <strong key={`bold-${idx}`} className="font-semibold">
            {token.value}
          </strong>
        ) : (
          <Fragment key={`text-${idx}`}>{token.value}</Fragment>
        )
      )}
    </span>
  );
}

