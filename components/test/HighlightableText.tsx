"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Eraser, Highlighter, NotebookPen, Trash2, X } from "lucide-react";

import { buildRanges, type SourceHighlight } from "@/lib/build-ranges";
import { isRangeFullyCoveredByHighlights, mergeRanges } from "@/lib/reading-highlights";
import { cn } from "@/lib/utils";
import type { ReadingHighlightColor } from "@/lib/reading-highlights";
import {
  loadTextNotes,
  saveTextNotes,
  subscribeTextNotes,
  type StoredTextNote,
} from "@/lib/text-notes-storage";

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
  notesStorageKey?: string;
  noteScopeKey?: string;
  onToggle?: (range: { start: number; end: number; color: ReadingHighlightColor; action: "mark" | "unmark" }) => void;
};

type SelectionInfo = {
  start: number;
  end: number;
  text: string;
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

function intersects(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
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

function safeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `note-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function sameNotes(a: StoredTextNote[], b: StoredTextNote[]) {
  if (a.length !== b.length) return false;
  for (let index = 0; index < a.length; index += 1) {
    const left = a[index];
    const right = b[index];
    if (!left || !right) return false;
    if (
      left.id !== right.id ||
      left.quote !== right.quote ||
      left.note !== right.note ||
      left.start !== right.start ||
      left.end !== right.end ||
      left.scopeKey !== right.scopeKey ||
      left.createdAt !== right.createdAt ||
      left.updatedAt !== right.updatedAt
    ) {
      return false;
    }
  }
  return true;
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
  notesStorageKey,
  noteScopeKey,
  onToggle,
}: HighlightableTextProps) {
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const notesPanelRef = useRef<HTMLDivElement | null>(null);
  const selectionTimeoutRef = useRef<number | null>(null);
  const selectionFrameRef = useRef<number | null>(null);
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const [color, setColor] = useState<ReadingHighlightColor>("yellow");
  const defaultNotesKey = useMemo(
    () => notesStorageKey ?? "reading:notes",
    [notesStorageKey]
  );
  const [notes, setNotes] = useState<StoredTextNote[]>([]);
  const [notesOpen, setNotesOpen] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [hydratedNotesKey, setHydratedNotesKey] = useState<string | null>(null);

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
  const noteRanges = useMemo(
    () =>
      notes
        .filter((item) =>
          noteScopeKey ? item.scopeKey === noteScopeKey : !item.scopeKey
        )
        .filter((item) => item.end > item.start)
        .filter((item) => item.start >= 0 && item.end <= text.length)
        .filter((item) => {
          const normalizedSlice = text
            .slice(item.start, item.end)
            .replace(/\s+/g, " ")
            .trim();
          return normalizedSlice === item.quote;
        })
        .map((item) => ({ start: item.start, end: item.end })),
    [noteScopeKey, notes, text]
  );
  const renderedRanges = useMemo(() => {
    const output: Array<
      (typeof ranges)[number] & {
        hasNote: boolean;
      }
    > = [];

    for (const base of ranges) {
      const cutPoints = new Set<number>([base.start, base.end]);
      for (const note of noteRanges) {
        if (!intersects(base.start, base.end, note.start, note.end)) continue;
        if (note.start > base.start && note.start < base.end) cutPoints.add(note.start);
        if (note.end > base.start && note.end < base.end) cutPoints.add(note.end);
      }

      const sortedCuts = [...cutPoints].sort((a, b) => a - b);
      for (let index = 0; index < sortedCuts.length - 1; index += 1) {
        const segmentStart = sortedCuts[index] ?? 0;
        const segmentEnd = sortedCuts[index + 1] ?? 0;
        if (segmentEnd <= segmentStart) continue;
        const hasNote = noteRanges.some((note) =>
          intersects(segmentStart, segmentEnd, note.start, note.end)
        );
        output.push({
          ...base,
          start: segmentStart,
          end: segmentEnd,
          hasNote,
        });
      }
    }

    return output;
  }, [noteRanges, ranges]);

  useEffect(() => {
    setNotes(loadTextNotes(defaultNotesKey));
    setHydratedNotesKey(defaultNotesKey);
  }, [defaultNotesKey]);

  useEffect(() => {
    return subscribeTextNotes(defaultNotesKey, (nextNotes) => {
      setNotes((prev) => (sameNotes(prev, nextNotes) ? prev : nextNotes));
    });
  }, [defaultNotesKey]);

  useEffect(() => {
    if (hydratedNotesKey !== defaultNotesKey) return;
    saveTextNotes(defaultNotesKey, notes);
  }, [defaultNotesKey, hydratedNotesKey, notes]);

  useEffect(() => {
    if (!selection) return;
    const onDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (toolbarRef.current?.contains(target)) return;
      if (notesPanelRef.current?.contains(target)) return;
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

  useEffect(() => {
    return () => {
      if (selectionTimeoutRef.current !== null) {
        window.clearTimeout(selectionTimeoutRef.current);
      }
      if (selectionFrameRef.current !== null) {
        window.cancelAnimationFrame(selectionFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!notesOpen) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (notesPanelRef.current?.contains(target)) return;
      setNotesOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [notesOpen]);

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
    const normalizedText = selectedText.replace(/\s+/g, " ").trim();
    const isMeaningful =
      selectionLength >= MIN_SELECTION_CHARS && normalizedText.length > 0;

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
      text: normalizedText,
      isMeaningful,
      hasIntersecting,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
  };

  const queueSelectionRead = () => {
    if (selectionTimeoutRef.current !== null) {
      window.clearTimeout(selectionTimeoutRef.current);
    }
    if (selectionFrameRef.current !== null) {
      window.cancelAnimationFrame(selectionFrameRef.current);
    }

    selectionTimeoutRef.current = window.setTimeout(() => {
      selectionTimeoutRef.current = null;
      readSelection();
    }, 0);
    selectionFrameRef.current = window.requestAnimationFrame(() => {
      selectionFrameRef.current = null;
      readSelection();
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

  const openNoteComposer = () => {
    if (!selection || !selection.isMeaningful || selection.end <= selection.start) return;

    const latest = loadTextNotes(defaultNotesKey);
    const base = latest.length ? latest : notes;
    const existing = base.find(
      (item) =>
        (noteScopeKey ? item.scopeKey === noteScopeKey : !item.scopeKey) &&
        item.start === selection.start &&
        item.end === selection.end &&
        item.quote === selection.text
    );

    if (existing) {
      setNotes(base);
      setActiveNoteId(existing.id);
    } else {
      const now = Date.now();
      const next: StoredTextNote = {
        id: safeId(),
        quote: selection.text,
        note: "",
        start: selection.start,
        end: selection.end,
        scopeKey: noteScopeKey,
        createdAt: now,
        updatedAt: now,
      };
      setNotes([next, ...base]);
      setActiveNoteId(next.id);
    }

    setNotesOpen(true);
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  };

  const orderedNotes = useMemo(
    () => [...notes].sort((a, b) => b.createdAt - a.createdAt || b.updatedAt - a.updatedAt),
    [notes]
  );
  const resolvedActiveNoteId =
    activeNoteId && notes.some((item) => item.id === activeNoteId)
      ? activeNoteId
      : orderedNotes[0]?.id ?? null;

  const updateNoteText = (id: string, value: string) => {
    setNotes((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              note: value,
              updatedAt: Date.now(),
            }
          : item
      )
    );
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((item) => item.id !== id));
    if (resolvedActiveNoteId === id) {
      const fallback = orderedNotes.find((item) => item.id !== id);
      setActiveNoteId(fallback?.id ?? null);
    }
  };

  return (
    <>
      <span
        ref={containerRef}
        className={className}
        onPointerUp={queueSelectionRead}
        onMouseUp={queueSelectionRead}
        onTouchEnd={queueSelectionRead}
        onKeyUp={queueSelectionRead}
      >
        {renderedRanges.map((range) => {
          const value = text.slice(range.start, range.end);
          const hasNote = range.hasNote;
          if (range.kind === "plain") {
            return (
              <span
                key={`plain-${range.start}-${range.end}`}
                className={cn(hasNote && "note-mark")}
              >
                {value}
              </span>
            );
          }

          if (range.kind === "answer") {
            return (
              <span
                key={`answer-${range.start}-${range.end}`}
                className={cn("py-[0.5px]", answerHighlightClass(), hasNote && "note-mark")}
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
                userHighlightClass(rangeColor),
                hasNote && "note-mark"
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
              <button
                type="button"
                disabled={!selection.isMeaningful}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-background px-2.5 text-xs font-semibold text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                onClick={openNoteComposer}
              >
                <NotebookPen className="size-3.5" />
                Note
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
      {typeof document !== "undefined" && notesOpen
        ? createPortal(
            <aside
              ref={notesPanelRef}
              className="fixed inset-y-0 right-0 z-[81] w-[330px] max-w-[92vw] border-l border-border bg-background/95 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-background/90"
            >
              <div className="flex items-center justify-between border-b border-border px-3 py-3">
                <p className="inline-flex items-center gap-2 text-sm font-semibold">
                  <NotebookPen className="size-4 text-blue-600" />
                  Notes
                </p>
                <button
                  type="button"
                  aria-label="Close notes"
                  className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                  onClick={() => setNotesOpen(false)}
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="h-[calc(100%-57px)] space-y-3 overflow-y-auto p-3">
                {orderedNotes.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border bg-muted/35 px-3 py-5 text-sm text-muted-foreground">
                    Select text and click Note to create one.
                  </div>
                ) : null}
                {orderedNotes.map((item) => {
                  const isActive = item.id === resolvedActiveNoteId;
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "rounded-lg border bg-card/80 p-3 shadow-sm",
                        isActive && "border-blue-400 bg-blue-50/35 dark:bg-blue-500/10"
                      )}
                    >
                      <button
                        type="button"
                        className="w-full cursor-text text-left text-sm font-semibold text-foreground italic"
                        onClick={() => setActiveNoteId(item.id)}
                      >
                        {item.quote}
                      </button>
                      <textarea
                        value={item.note}
                        onChange={(event) => updateNoteText(item.id, event.target.value)}
                        onFocus={() => setActiveNoteId(item.id)}
                        placeholder="Type your note..."
                        className="mt-2 min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-blue-500/60"
                      />
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-destructive"
                          onClick={() => deleteNote(item.id)}
                        >
                          <Trash2 className="size-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>,
            document.body
          )
        : null}
    </>
  );
}
