export type ReadingHighlightColor = "yellow" | "green" | "blue" | "pink";
export type UserRange = { start: number; end: number; id: string };
export type IndexRange = { start: number; end: number };

export type ReadingHighlight = {
  id: string;
  scope: "passage" | "question";
  passageId?: string;
  questionId?: string;
  start: number;
  end: number;
  color: ReadingHighlightColor;
  createdAt: number;
};

export function clampSplitPct(value: number) {
  return Math.min(70, Math.max(30, value));
}

export function isValidReadingHighlight(value: unknown): value is ReadingHighlight {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ReadingHighlight>;
  const validScope = candidate.scope === "passage" || candidate.scope === "question";
  const validColor =
    candidate.color === "yellow" ||
    candidate.color === "green" ||
    candidate.color === "blue" ||
    candidate.color === "pink";
  const validBounds =
    typeof candidate.start === "number" &&
    typeof candidate.end === "number" &&
    candidate.start >= 0 &&
    candidate.end > candidate.start;
  return typeof candidate.id === "string" && validScope && validColor && validBounds && typeof candidate.createdAt === "number";
}

export function loadReadingHighlights(testId: string): ReadingHighlight[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(`readingHighlights:${testId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidReadingHighlight);
  } catch {
    return [];
  }
}

export function saveReadingHighlights(testId: string, highlights: ReadingHighlight[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`readingHighlights:${testId}`, JSON.stringify(highlights));
  } catch {
    // Ignore storage failures.
  }
}

function overlapsOrTouches(a: { start: number; end: number }, b: { start: number; end: number }) {
  return a.start <= b.end + 1 && a.end >= b.start - 1;
}

export function mergeRanges(ranges: IndexRange[]): IndexRange[] {
  const sanitized = ranges
    .map((item) => ({
      start: Math.max(0, Math.min(item.start, item.end)),
      end: Math.max(item.start, item.end),
    }))
    .filter((item) => item.end > item.start)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const merged: IndexRange[] = [];
  for (const item of sanitized) {
    const prev = merged[merged.length - 1];
    if (!prev) {
      merged.push(item);
      continue;
    }
    // [start, end) exclusive-end ranges: touching when prev.end >= item.start
    if (prev.end >= item.start) {
      prev.end = Math.max(prev.end, item.end);
      continue;
    }
    merged.push(item);
  }

  return merged;
}

export function isRangeFullyCoveredByHighlights(
  s: number,
  e: number,
  mergedRanges: IndexRange[]
) {
  if (e <= s) return false;
  let cursor = s;
  for (const range of mergedRanges) {
    if (range.end <= cursor) continue;
    if (range.start > cursor) return false;
    cursor = Math.max(cursor, range.end);
    if (cursor >= e) return true;
  }
  return false;
}

export function subtractRangeFromRanges(
  ranges: IndexRange[],
  selectionStart: number,
  selectionEnd: number
) {
  const s = Math.max(0, Math.min(selectionStart, selectionEnd));
  const e = Math.max(selectionStart, selectionEnd);
  if (e <= s) return mergeRanges(ranges);

  const output: IndexRange[] = [];
  for (const range of mergeRanges(ranges)) {
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

  return mergeRanges(output);
}

export function normalizeUserRanges(ranges: UserRange[]): UserRange[] {
  const sanitized = ranges
    .map((item) => ({
      ...item,
      start: Math.max(0, Math.min(item.start, item.end)),
      end: Math.max(item.start, item.end),
    }))
    .filter((item) => item.end > item.start)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const merged: UserRange[] = [];
  for (const item of sanitized) {
    const prev = merged[merged.length - 1];
    if (!prev) {
      merged.push(item);
      continue;
    }

    if (overlapsOrTouches(prev, item)) {
      prev.end = Math.max(prev.end, item.end);
      continue;
    }

    merged.push(item);
  }

  return merged;
}

export function addUserHighlight(ranges: UserRange[], start: number, end: number): UserRange[] {
  const next: UserRange = {
    id: `user-${start}-${end}-${Date.now()}`,
    start: Math.max(0, Math.min(start, end)),
    end: Math.max(start, end),
  };
  return normalizeUserRanges([...ranges, next]);
}

function intersects(a: { start: number; end: number }, b: { start: number; end: number }) {
  return a.start < b.end && a.end > b.start;
}

export function removeUserHighlight(ranges: UserRange[], selectionStart: number, selectionEnd: number): UserRange[] {
  const normalized = normalizeUserRanges(ranges);
  if (normalized.length === 0) return normalized;

  const selection = {
    start: Math.max(0, Math.min(selectionStart, selectionEnd)),
    end: Math.max(selectionStart, selectionEnd),
  };

  const hitIndices = new Set<number>();
  normalized.forEach((range, index) => {
    if (intersects(range, selection)) {
      hitIndices.add(index);
    }
  });
  if (hitIndices.size === 0) return normalized;

  // Option A: remove the full connected merged group with one unmark action.
  let changed = true;
  while (changed) {
    changed = false;
    normalized.forEach((range, index) => {
      if (hitIndices.has(index)) return;
      for (const hitIndex of hitIndices) {
        if (overlapsOrTouches(range, normalized[hitIndex])) {
          hitIndices.add(index);
          changed = true;
          break;
        }
      }
    });
  }

  return normalized.filter((_, index) => !hitIndices.has(index));
}
