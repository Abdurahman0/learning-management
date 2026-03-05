export type HighlightKind = "user" | "answer";

export type SourceHighlight = {
  id: string;
  start: number;
  end: number;
  kind: HighlightKind;
  questionNumber?: number;
};

export type TextRange = {
  start: number;
  end: number;
  kind: "plain" | HighlightKind;
  highlightId?: string;
  answerQuestionNumbers?: number[];
};

const KIND_PRIORITY: Record<HighlightKind, number> = {
  answer: 2,
  user: 1,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function uniqueSorted(numbers: number[]) {
  return [...new Set(numbers)].sort((a, b) => a - b);
}

export function buildRanges(text: string, highlights: SourceHighlight[]): TextRange[] {
  const length = text.length;
  const normalized = highlights
    .map((item) => ({
      ...item,
      start: clamp(item.start, 0, length),
      end: clamp(item.end, 0, length),
    }))
    .filter((item) => item.end > item.start);

  const boundaries = new Set<number>([0, length]);
  normalized.forEach((item) => {
    boundaries.add(item.start);
    boundaries.add(item.end);
  });

  const points = [...boundaries].sort((a, b) => a - b);
  const ranges: TextRange[] = [];

  for (let i = 0; i < points.length - 1; i += 1) {
    const start = points[i];
    const end = points[i + 1];
    if (end <= start) continue;

    const active = normalized.filter((item) => item.start < end && item.end > start);
    if (active.length === 0) {
      ranges.push({ start, end, kind: "plain" });
      continue;
    }

    active.sort((a, b) => {
      const diff = KIND_PRIORITY[b.kind] - KIND_PRIORITY[a.kind];
      if (diff !== 0) return diff;
      return a.start - b.start || a.end - b.end;
    });

    const picked = active[0];
    const answerQuestionNumbers =
      picked.kind === "answer"
        ? uniqueSorted(
            active
              .filter((item) => item.kind === "answer" && item.start === start)
              .map((item) => item.questionNumber)
              .filter((num): num is number => typeof num === "number")
          )
        : undefined;

    const nextRange: TextRange = {
      start,
      end,
      kind: picked.kind,
      highlightId: picked.id,
      answerQuestionNumbers,
    };

    const prev = ranges[ranges.length - 1];
    const canMerge =
      prev &&
      prev.end === nextRange.start &&
      prev.kind === nextRange.kind &&
      (prev.kind !== "user" || prev.highlightId === nextRange.highlightId) &&
      !prev.answerQuestionNumbers?.length &&
      !nextRange.answerQuestionNumbers?.length;

    if (canMerge) {
      prev.end = nextRange.end;
    } else {
      ranges.push(nextRange);
    }
  }

  return ranges;
}
