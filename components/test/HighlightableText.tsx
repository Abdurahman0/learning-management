"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Eraser, Highlighter } from "lucide-react";

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

const MIN_SELECTION_CHARS = 1;
const COLORS: ReadingHighlightColor[] = ["yellow", "green", "blue", "pink"];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function answerHighlightClass() {
  return "rounded-sm px-0.5 bg-emerald-500/22 ring-1 ring-emerald-600/20 dark:bg-emerald-300/12 dark:ring-emerald-300/35 dark:shadow-[0_0_0_1px_rgba(110,231,183,.35),0_0_18px_rgba(110,231,183,.20)]";
}

function userHighlightClass(color: ReadingHighlightColor) {
  if (color === "green") return "hl-green";
  if (color === "blue") return "hl-blue";
  if (color === "pink") return "hl-pink";
  return "hl-yellow";
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
  const userColorsById = useMemo(
    () => new Map(userHighlights.map((item) => [item.id, item.color])),
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
                className={cn("py-[0.5px]", answerHighlightClass())}
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

          const rangeColor =
            (range.highlightId ? userColorsById.get(range.highlightId) : undefined) ?? "yellow";
          return (
            <span
              key={`user-${range.start}-${range.end}`}
              className={cn(
                "rounded-[2px] px-[1px] py-[0.5px] highlight-mark",
                userHighlightClass(rangeColor)
              )}
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
                  "inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60",
                  selection.isMeaningful && selection.hasIntersecting
                    ? "border border-border bg-accent text-accent-foreground hover:bg-accent/80"
                    : "bg-blue-600 text-white hover:bg-blue-600/90"
                )}
                onClick={applyToggle}
              >
                {selection.isMeaningful && selection.hasIntersecting ? (
                  <Eraser className="size-3.5" />
                ) : (
                  <Highlighter className="size-3.5" />
                )}
                {selection.isMeaningful && selection.hasIntersecting ? unmarkLabel : markLabel}
              </button>
              {selection.isMeaningful && selection.hasIntersecting ? null : (
                <div className="flex items-center gap-1">
                  {COLORS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      aria-label={`Mark ${item}`}
                      className={cn(
                        "size-6 rounded-full border border-border transition-transform",
                        item === "yellow" && "bg-yellow-300",
                        item === "green" && "bg-green-400",
                        item === "blue" && "bg-blue-400",
                        item === "pink" && "bg-pink-400",
                        color === item && "scale-110 ring-2 ring-blue-500 ring-offset-1"
                      )}
                      onClick={() => setColor(item)}
                    />
                  ))}
                </div>
              )}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
