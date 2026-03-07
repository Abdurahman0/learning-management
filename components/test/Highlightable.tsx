"use client";

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Eraser, Highlighter } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  loadHighlights,
  saveHighlights,
  type HighlightColor,
  type StoredHighlight,
} from "@/lib/highlight-storage";

type HighlightableProps = {
  storageKey: string;
  className?: string;
  contentVersion?: string | number;
  children: ReactNode;
};

type SelectionState = {
  start: number;
  end: number;
  x: number;
  y: number;
  isFullyMarked: boolean;
};

const COLORS: HighlightColor[] = ["yellow", "green", "blue", "pink"];

const COLOR_CLASS: Record<HighlightColor, string> = {
  yellow: "hl-yellow",
  green: "hl-green",
  blue: "hl-blue",
  pink: "hl-pink",
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeRanges(ranges: Array<{ start: number; end: number }>) {
  const sanitized = ranges
    .map((item) => ({
      start: Math.max(0, Math.min(item.start, item.end)),
      end: Math.max(item.start, item.end),
    }))
    .filter((item) => item.end > item.start)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const merged: Array<{ start: number; end: number }> = [];

  for (const range of sanitized) {
    const prev = merged[merged.length - 1];
    if (!prev || prev.end < range.start) {
      merged.push({ ...range });
      continue;
    }

    prev.end = Math.max(prev.end, range.end);
  }

  return merged;
}

function isRangeFullyCovered(
  selectionStart: number,
  selectionEnd: number,
  mergedRanges: Array<{ start: number; end: number }>
) {
  if (selectionEnd <= selectionStart) return false;

  let cursor = selectionStart;
  for (const range of mergedRanges) {
    if (range.end <= cursor) continue;
    if (range.start > cursor) return false;

    cursor = Math.max(cursor, range.end);
    if (cursor >= selectionEnd) return true;
  }

  return false;
}

function subtractRangeFromMerged(
  mergedRanges: Array<{ start: number; end: number }>,
  selectionStart: number,
  selectionEnd: number
) {
  const s = Math.max(0, Math.min(selectionStart, selectionEnd));
  const e = Math.max(selectionStart, selectionEnd);
  if (e <= s) return mergedRanges;

  const output: Array<{ start: number; end: number }> = [];
  for (const range of mergedRanges) {
    if (range.end <= s || range.start >= e) {
      output.push(range);
      continue;
    }

    if (range.start < s) {
      output.push({ start: range.start, end: s });
    }

    if (range.end > e) {
      output.push({ start: e, end: range.end });
    }
  }

  return normalizeRanges(output);
}

function unwrapAllHighlights(root: HTMLElement) {
  const marks = root.querySelectorAll("mark[data-hl-id]");
  marks.forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    while (mark.firstChild) {
      parent.insertBefore(mark.firstChild, mark);
    }
    parent.removeChild(mark);
    parent.normalize();
  });
}

function createRangeFromOffsets(root: HTMLElement, startOffset: number, endOffset: number) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null = walker.nextNode();
  let cursor = 0;

  let startNode: Node | null = null;
  let endNode: Node | null = null;
  let startNodeOffset = 0;
  let endNodeOffset = 0;

  while (node) {
    const value = node.textContent ?? "";
    const nextCursor = cursor + value.length;

    // At text-node boundaries, start should map to the next node start (not previous node end).
    if (!startNode && startOffset < nextCursor) {
      startNode = node;
      startNodeOffset = clamp(startOffset - cursor, 0, value.length);
    }

    if (!endNode && endOffset <= nextCursor) {
      endNode = node;
      endNodeOffset = clamp(endOffset - cursor, 0, value.length);
      break;
    }

    cursor = nextCursor;
    node = walker.nextNode();
  }

  if (!startNode || !endNode) return null;
  const range = document.createRange();
  range.setStart(startNode, startNodeOffset);
  range.setEnd(endNode, endNodeOffset);
  return range;
}

function rangeToOffsets(root: HTMLElement, range: Range) {
  const startRange = document.createRange();
  startRange.selectNodeContents(root);
  startRange.setEnd(range.startContainer, range.startOffset);

  const endRange = document.createRange();
  endRange.selectNodeContents(root);
  endRange.setEnd(range.endContainer, range.endOffset);

  return {
    start: startRange.toString().length,
    end: endRange.toString().length,
  };
}

function safeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `hl-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export function Highlightable({ storageKey, className, contentVersion, children }: HighlightableProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const [highlights, setHighlights] = useState<StoredHighlight[]>(() => loadHighlights(storageKey));
  const [color, setColor] = useState<HighlightColor>("yellow");
  const [selection, setSelection] = useState<SelectionState | null>(null);

  const contentToken = useMemo(() => String(contentVersion ?? "default"), [contentVersion]);

  useEffect(() => {
    saveHighlights(storageKey, highlights);
  }, [highlights, storageKey]);

  useEffect(() => {
    if (!rootRef.current) return;
    const root = rootRef.current;

    unwrapAllHighlights(root);

    for (const item of highlights) {
      if (item.end <= item.start) continue;
      const range = createRangeFromOffsets(root, item.start, item.end);
      if (!range) continue;

      const mark = document.createElement("mark");
      mark.setAttribute("data-hl-id", item.id);
      mark.className = cn("rounded-[2px] px-[1px] py-[0.5px] highlight-mark", COLOR_CLASS[item.color]);
      const fragment = range.extractContents();
      mark.appendChild(fragment);
      range.insertNode(mark);
    }
  }, [contentToken, highlights]);

  useEffect(() => {
    if (!selection) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (toolbarRef.current?.contains(target)) return;
      if (rootRef.current?.contains(target)) return;
      setSelection(null);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [selection]);

  const readSelection = () => {
    const root = rootRef.current;
    const sel = window.getSelection();

    if (!root || !sel || sel.rangeCount === 0 || sel.isCollapsed) {
      setSelection(null);
      return;
    }

    const anchorNode = sel.anchorNode;
    const focusNode = sel.focusNode;
    if (!anchorNode || !focusNode || !root.contains(anchorNode) || !root.contains(focusNode)) {
      setSelection(null);
      return;
    }

    const element = (anchorNode.nodeType === Node.ELEMENT_NODE ? anchorNode : anchorNode.parentElement) as HTMLElement | null;
    if (element?.closest("input, textarea, select, [contenteditable='true']")) {
      setSelection(null);
      return;
    }

    const range = sel.getRangeAt(0).cloneRange();
    const rawText = range.toString();
    if (!rawText.trim()) {
      setSelection(null);
      return;
    }

    const rect = range.getBoundingClientRect();
    if (!rect.width && !rect.height) {
      setSelection(null);
      return;
    }

    const { start, end } = rangeToOffsets(root, range);
    if (end <= start) {
      setSelection(null);
      return;
    }

    const leadingWhitespace = rawText.match(/^\s*/)?.[0].length ?? 0;
    const trailingWhitespace = rawText.match(/\s*$/)?.[0].length ?? 0;
    const normalizedStart = start + leadingWhitespace;
    const normalizedEnd = end - trailingWhitespace;

    if (normalizedEnd <= normalizedStart) {
      setSelection(null);
      return;
    }

    const mergedRanges = normalizeRanges(highlights.map((item) => ({ start: item.start, end: item.end })));
    const isFullyMarked = isRangeFullyCovered(normalizedStart, normalizedEnd, mergedRanges);

    setSelection({
      start: normalizedStart,
      end: normalizedEnd,
      isFullyMarked,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
  };

  const queueSelectionRead = () => {
    window.setTimeout(readSelection, 0);
  };

  const toggleSelection = () => {
    if (!selection) return;

    setHighlights((prev) => {
      const merged = normalizeRanges(prev.map((item) => ({ start: item.start, end: item.end })));
      const nextRanges = selection.isFullyMarked
        ? subtractRangeFromMerged(merged, selection.start, selection.end)
        : normalizeRanges([...merged, { start: selection.start, end: selection.end }]);

      return nextRanges.map((range) => {
        const existing = prev.find((item) => item.start === range.start && item.end === range.end);
        return {
          id: existing?.id ?? safeId(),
          start: range.start,
          end: range.end,
          color: existing?.color ?? color,
          createdAt: existing?.createdAt ?? Date.now(),
        };
      });
    });

    window.getSelection()?.removeAllRanges();
    setSelection(null);
  };

  return (
    <>
      <div
        ref={rootRef}
        className={className}
        onMouseUp={queueSelectionRead}
        onKeyUp={queueSelectionRead}
        onTouchEnd={queueSelectionRead}
      >
        {children}
      </div>
      {typeof document !== "undefined" && selection
        ? createPortal(
            <div
              ref={toolbarRef}
              className="z-[70] flex items-center gap-1.5 rounded-lg border border-border bg-popover/95 p-1.5 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-popover/85"
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
                className={cn(
                  "inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-xs font-semibold",
                  selection.isFullyMarked
                    ? "border border-border bg-accent text-accent-foreground hover:bg-accent/85"
                    : "bg-blue-600 text-white hover:bg-blue-600/90"
                )}
                onClick={toggleSelection}
              >
                {selection.isFullyMarked ? <Eraser className="size-3.5" /> : <Highlighter className="size-3.5" />}
                {selection.isFullyMarked ? "Unmark" : "Mark"}
              </button>
              {selection.isFullyMarked ? null : (
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
