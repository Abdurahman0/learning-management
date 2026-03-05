export type HighlightColor = "yellow" | "green" | "blue" | "pink";

export type StoredHighlight = {
  id: string;
  quote: string;
  before: string;
  after: string;
  color: HighlightColor;
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

    return parsed.filter((item): item is StoredHighlight => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Partial<StoredHighlight>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.quote === "string" &&
        typeof candidate.before === "string" &&
        typeof candidate.after === "string" &&
        (candidate.color === "yellow" ||
          candidate.color === "green" ||
          candidate.color === "blue" ||
          candidate.color === "pink")
      );
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
