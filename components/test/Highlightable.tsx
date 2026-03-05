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
  quote: string;
  before: string;
  after: string;
  x: number;
  y: number;
  intersectingIds: string[];
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

function overlaps(range: { start: number; end: number }, used: Array<{ start: number; end: number }>) {
  return used.some((item) => range.start < item.end && item.start < range.end);
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

function findAllOccurrences(text: string, query: string) {
  const result: number[] = [];
  if (!query) return result;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let cursor = 0;

  while (cursor < lowerText.length) {
    const found = lowerText.indexOf(lowerQuery, cursor);
    if (found < 0) break;
    result.push(found);
    cursor = found + lowerQuery.length;
  }

  return result;
}

function selectBestMatch(
  fullText: string,
  highlight: StoredHighlight,
  used: Array<{ start: number; end: number }>
) {
  const quote = highlight.quote.trim();
  if (!quote) return null;

  const candidates = findAllOccurrences(fullText, quote);
  if (!candidates.length) return null;

  const before = highlight.before.toLowerCase();
  const after = highlight.after.toLowerCase();
  const lowerText = fullText.toLowerCase();
  let best: { start: number; end: number; score: number } | null = null;

  for (const start of candidates) {
    const end = start + quote.length;
    const candidate = { start, end };
    if (overlaps(candidate, used)) continue;

    let score = 0;
    if (before) {
      const left = lowerText.slice(clamp(start - before.length, 0, lowerText.length), start);
      if (left === before) score += 2;
    }
    if (after) {
      const right = lowerText.slice(end, clamp(end + after.length, 0, lowerText.length));
      if (right === after) score += 2;
    }

    if (!best || score > best.score) {
      best = { start, end, score };
    }
  }

  return best ? { start: best.start, end: best.end } : null;
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
    if (!startNode && startOffset <= nextCursor) {
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

function intersects(rangeA: Range, rangeB: Range) {
  return !(rangeA.compareBoundaryPoints(Range.END_TO_START, rangeB) <= 0 || rangeA.compareBoundaryPoints(Range.START_TO_END, rangeB) >= 0);
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
    const text = root.textContent ?? "";
    const used: Array<{ start: number; end: number }> = [];

    highlights.forEach((item) => {
      const match = selectBestMatch(text, item, used);
      if (!match || match.start >= match.end) return;
      const range = createRangeFromOffsets(root, match.start, match.end);
      if (!range) return;

      const mark = document.createElement("mark");
      mark.setAttribute("data-hl-id", item.id);
      mark.className = cn("rounded-[2px] px-[1px] py-[0.5px] highlight-mark", COLOR_CLASS[item.color]);
      const fragment = range.extractContents();
      mark.appendChild(fragment);
      range.insertNode(mark);
      used.push(match);
    });
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
    const selectedText = range.toString().trim();
    if (!selectedText) {
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

    const fullText = root.textContent ?? "";
    const before = fullText.slice(Math.max(0, start - 24), start);
    const after = fullText.slice(end, Math.min(fullText.length, end + 24));

    const intersectingIds: string[] = [];
    root.querySelectorAll("mark[data-hl-id]").forEach((mark) => {
      const markerRange = document.createRange();
      markerRange.selectNodeContents(mark);
      if (intersects(range, markerRange)) {
        const id = mark.getAttribute("data-hl-id");
        if (id) intersectingIds.push(id);
      }
    });

    setSelection({
      quote: selectedText,
      before,
      after,
      intersectingIds,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
  };

  const queueSelectionRead = () => {
    window.setTimeout(readSelection, 0);
  };

  const applyHighlight = () => {
    if (!selection) return;
    setHighlights((prev) => [
      ...prev,
      {
        id: safeId(),
        quote: selection.quote,
        before: selection.before,
        after: selection.after,
        color,
      },
    ]);
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  };

  const removeHighlights = () => {
    if (!selection || selection.intersectingIds.length === 0) return;
    const ids = new Set(selection.intersectingIds);
    setHighlights((prev) => prev.filter((item) => !ids.has(item.id)));
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
                className="inline-flex h-8 items-center gap-1 rounded-md bg-blue-600 px-2.5 text-xs font-semibold text-white hover:bg-blue-600/90"
                onClick={applyHighlight}
              >
                <Highlighter className="size-3.5" />
                Highlight
              </button>
              <div className="flex items-center gap-1">
                {COLORS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-label={`Highlight ${item}`}
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
              {selection.intersectingIds.length > 0 ? (
                <button
                  type="button"
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-xs font-medium text-foreground hover:bg-accent"
                  onClick={removeHighlights}
                >
                  <Eraser className="size-3.5" />
                  Remove
                </button>
              ) : null}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
