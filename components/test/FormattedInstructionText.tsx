"use client";

import {Fragment} from "react";

import {cn} from "@/lib/utils";

type FormattedInstructionTextProps = {
  text: string;
  className?: string;
};

function splitWithBoldMarkers(text: string) {
  return text.split(/(\*\*[\s\S]+?\*\*)/g);
}

function isBoldToken(token: string) {
  return token.startsWith("**") && token.endsWith("**") && token.length >= 4;
}

function normalizeLineBullets(text: string) {
  return text.replace(/^(\s*)[-–—]\s+/gm, "$1• ");
}

export function FormattedInstructionText({text, className}: FormattedInstructionTextProps) {
  const tokens = splitWithBoldMarkers(normalizeLineBullets(text));

  return (
    <span className={cn("whitespace-pre-wrap", className)}>
      {tokens.map((token, index) => {
        if (!isBoldToken(token)) {
          return <Fragment key={`instruction-token-${index}`}>{token}</Fragment>;
        }

        const value = token.slice(2, -2);
        return <strong key={`instruction-token-${index}`}>{value}</strong>;
      })}
    </span>
  );
}
