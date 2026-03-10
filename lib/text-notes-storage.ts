export type StoredTextNote = {
  id: string;
  quote: string;
  note: string;
  start: number;
  end: number;
  scopeKey?: string;
  createdAt: number;
  updatedAt: number;
};

const STORAGE_PREFIX = "test-notes:";
const NOTES_UPDATED_EVENT = "test-notes:updated";

type NotesUpdatedDetail = {
  key: string;
  notes: StoredTextNote[];
};

function isValidStoredTextNote(value: unknown): value is StoredTextNote {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<StoredTextNote>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.quote === "string" &&
    typeof candidate.note === "string" &&
    typeof candidate.start === "number" &&
    typeof candidate.end === "number" &&
    candidate.end > candidate.start &&
    (candidate.scopeKey === undefined || typeof candidate.scopeKey === "string") &&
    typeof candidate.createdAt === "number" &&
    typeof candidate.updatedAt === "number"
  );
}

function toStorageKey(key: string) {
  return `${STORAGE_PREFIX}${key}`;
}

export function loadTextNotes(key: string): StoredTextNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(toStorageKey(key));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidStoredTextNote);
  } catch {
    return [];
  }
}

export function saveTextNotes(key: string, notes: StoredTextNote[]) {
  if (typeof window === "undefined") return;
  try {
    const storageKey = toStorageKey(key);
    const serialized = JSON.stringify(notes);
    const existing = window.localStorage.getItem(storageKey);
    if (existing === serialized) return;

    window.localStorage.setItem(storageKey, serialized);
    const detail: NotesUpdatedDetail = { key, notes };
    window.dispatchEvent(new CustomEvent<NotesUpdatedDetail>(NOTES_UPDATED_EVENT, { detail }));
  } catch {
    // Ignore storage failures.
  }
}

export function subscribeTextNotes(
  key: string,
  onUpdate: (notes: StoredTextNote[]) => void
) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = (event: Event) => {
    const custom = event as CustomEvent<NotesUpdatedDetail>;
    const detail = custom.detail;
    if (!detail || detail.key !== key || !Array.isArray(detail.notes)) return;
    onUpdate(detail.notes.filter(isValidStoredTextNote));
  };

  window.addEventListener(NOTES_UPDATED_EVENT, handler as EventListener);
  return () => {
    window.removeEventListener(NOTES_UPDATED_EVENT, handler as EventListener);
  };
}
