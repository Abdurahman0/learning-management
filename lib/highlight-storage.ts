export type HighlightColor = "yellow" | "green" | "blue" | "pink";

export type StoredHighlight = {
  id: string;
  start: number;
  end: number;
  color: HighlightColor;
  createdAt: number;
};

const STORAGE_PREFIX = "test-highlights:";

function getStorageKey(storageKey: string) {
  return `${STORAGE_PREFIX}${storageKey}`;
}

export function loadHighlights(storageKey: string): StoredHighlight[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.sessionStorage.getItem(getStorageKey(storageKey));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((item): StoredHighlight[] => {
      if (!item || typeof item !== "object") return [];
      const candidate = item as Partial<StoredHighlight>;
      const validColor =
        candidate.color === "yellow" ||
        candidate.color === "green" ||
        candidate.color === "blue" ||
        candidate.color === "pink";

      if (
        typeof candidate.id === "string" &&
        typeof candidate.start === "number" &&
        typeof candidate.end === "number" &&
        candidate.end > candidate.start &&
        validColor
      ) {
        const color = candidate.color as HighlightColor;
        return [
          {
            id: candidate.id,
            start: candidate.start,
            end: candidate.end,
            color,
            createdAt: typeof candidate.createdAt === "number" ? candidate.createdAt : Date.now()
          }
        ];
      }

      // Legacy quote-based highlights cannot be mapped to exact offsets reliably.
      return [];
    });
  } catch {
    return [];
  }
}

export function saveHighlights(storageKey: string, highlights: StoredHighlight[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(getStorageKey(storageKey), JSON.stringify(highlights));
  } catch {
    // Ignore storage failures.
  }
}
