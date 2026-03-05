"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { buildRanges, type SourceHighlight } from "@/lib/build-ranges";
import { isRangeFullyCoveredByHighlights, mergeRanges } from "@/lib/reading-highlights";
import { cn } from "@/lib/utils";
import type { ReadingHighlightColor } from "@/lib/reading-highlights";

type LocalHighlight = {
  id: string;
  start: number;
  end: number;
  color: ReadingHighlightColor;
};

type LocalAnswerHighlight = {
  id: string;
  start: number;
  end: number;
  questionNumber: number;
};

type HighlightableTextProps = {
  text: string;
  userHighlights: LocalHighlight[];
  answerHighlights?: LocalAnswerHighlight[];
  className?: string;
  interactive?: boolean;
  showAnswerBadges?: boolean;
  markLabel?: string;
  unmarkLabel?: string;
  onToggle?: (range: { start: number; end: number; color: ReadingHighlightColor; action: "mark" | "unmark" }) => void;
};

type SelectionInfo = {
  start: number;
  end: number;
  x: number;
  y: number;
  isMeaningful: boolean;
  hasIntersecting: boolean;
};

const MIN_SELECTION_CHARS = 2;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function highlightClass(kind: "user" | "answer") {
  if (kind === "user") {
    return "rounded-sm px-0.5 bg-amber-500/30 ring-1 ring-amber-600/25 dark:bg-amber-300/14 dark:ring-amber-300/35 dark:shadow-[0_0_0_1px_rgba(252,211,77,.35),0_0_18px_rgba(252,211,77,.22)]";
  }
  return "rounded-sm px-0.5 bg-emerald-500/22 ring-1 ring-emerald-600/20 dark:bg-emerald-300/12 dark:ring-emerald-300/35 dark:shadow-[0_0_0_1px_rgba(110,231,183,.35),0_0_18px_rgba(110,231,183,.20)]";
}

export function HighlightableText({
  text,
  userHighlights,
  answerHighlights = [],
  className,
  interactive = true,
  showAnswerBadges = false,
  markLabel = "Mark",
  unmarkLabel = "Unmark",
  onToggle,
}: HighlightableTextProps) {
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const [color, setColor] = useState<ReadingHighlightColor>("yellow");

  const mergedUserRanges = useMemo(
    () => mergeRanges(userHighlights.map((item) => ({ start: item.start, end: item.end }))),
    [userHighlights]
  );

  const sourceHighlights = useMemo<SourceHighlight[]>(() => {
    const user = userHighlights.map((item) => ({
      id: item.id,
      start: clamp(item.start, 0, text.length),
      end: clamp(item.end, 0, text.length),
      kind: "user" as const,
    }));
    const answer = answerHighlights.map((item) => ({
      id: item.id,
      start: clamp(item.start, 0, text.length),
      end: clamp(item.end, 0, text.length),
      questionNumber: item.questionNumber,
      kind: "answer" as const,
    }));
    return [...user, ...answer];
  }, [answerHighlights, text.length, userHighlights]);

  const ranges = useMemo(() => buildRanges(text, sourceHighlights), [sourceHighlights, text]);

  useEffect(() => {
    if (!selection) return;
    const onDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (toolbarRef.current?.contains(target)) return;
      if (containerRef.current?.contains(target)) return;
      setSelection(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [selection]);

  const readSelection = () => {
    if (!interactive || !onToggle) return;
    const container = containerRef.current;
    const sel = window.getSelection();
    if (!container || !sel || sel.rangeCount === 0) {
      setSelection(null);
      return;
    }

    const range = sel.getRangeAt(0);
    const anchor = sel.anchorNode;
    const focus = sel.focusNode;
    if (!anchor || !focus || !container.contains(anchor) || !container.contains(focus)) {
      setSelection(null);
      return;
    }

    const preStart = document.createRange();
    preStart.selectNodeContents(container);
    preStart.setEnd(range.startContainer, range.startOffset);

    const preEnd = document.createRange();
    preEnd.selectNodeContents(container);
    preEnd.setEnd(range.endContainer, range.endOffset);

    const start = preStart.toString().length;
    const end = preEnd.toString().length;
    const selectionLength = Math.max(0, end - start);
    const selectedText = range.toString();
    const isMeaningful =
      selectionLength >= MIN_SELECTION_CHARS && selectedText.trim().length > 0;

    const rect = range.getBoundingClientRect();
    if (!rect.width && !rect.height) {
      setSelection(null);
      return;
    }

    const hasIntersecting =
      isMeaningful &&
      isRangeFullyCoveredByHighlights(start, end, mergedUserRanges);
    setSelection({
      start,
      end,
      isMeaningful,
      hasIntersecting,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
  };

  const applyToggle = () => {
    if (!selection || !onToggle) return;
    if (!selection.isMeaningful || selection.end <= selection.start) return;
    onToggle({
      start: selection.start,
      end: selection.end,
      color,
      action: selection.hasIntersecting ? "unmark" : "mark",
    });
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  };

  return (
    <>
      <span
        ref={containerRef}
        className={className}
        onMouseUp={() => window.setTimeout(readSelection, 0)}
        onTouchEnd={() => window.setTimeout(readSelection, 0)}
      >
        {ranges.map((range) => {
          const value = text.slice(range.start, range.end);
          if (range.kind === "plain") {
            return <span key={`plain-${range.start}-${range.end}`}>{value}</span>;
          }

          if (range.kind === "answer") {
            return (
              <span
                key={`answer-${range.start}-${range.end}`}
                className={cn("py-[0.5px]", highlightClass("answer"))}
              >
                {showAnswerBadges && range.answerQuestionNumbers?.length
                  ? range.answerQuestionNumbers.map((questionNumber) => (
                      <span
                        key={`${range.start}-${questionNumber}`}
                        className="mr-1 inline-flex select-none rounded-md bg-blue-600 px-1.5 py-0.5 align-middle text-[11px] font-semibold text-white"
                      >
                        {questionNumber}
                      </span>
                    ))
                  : null}
                {value}
              </span>
            );
          }

          return (
            <span
              key={`user-${range.start}-${range.end}`}
              className={cn("py-[0.5px]", highlightClass("user"))}
            >
              {value}
            </span>
          );
        })}
      </span>
      {interactive && onToggle && selection && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={toolbarRef}
              className="z-[80] flex items-center gap-1.5 rounded-lg border border-border bg-popover/95 p-1.5 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-popover/85"
              style={{
                position: "fixed",
                left: selection.x,
                top: selection.y,
                transform: "translate(-50%, -100%)",
              }}
              onMouseDown={(event) => event.preventDefault()}
            >
              <button
                type="button"
                disabled={!selection.isMeaningful}
                className={cn(
                  "h-8 rounded-md px-2.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60",
                  selection.isMeaningful && selection.hasIntersecting
                    ? "border border-border bg-accent text-accent-foreground hover:bg-accent/80"
                    : "bg-blue-600 text-white hover:bg-blue-600/90"
                )}
                onClick={applyToggle}
              >
                {selection.isMeaningful && selection.hasIntersecting ? unmarkLabel : markLabel}
              </button>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Amber highlight"
                  className={cn(
                    "size-5 rounded-full border border-border bg-amber-500",
                    color === "yellow" && "ring-2 ring-blue-500 ring-offset-1"
                  )}
                  onClick={() => setColor("yellow")}
                />
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
