export type GettingStartedState = {
  version: 1;
  updatedAt: string;
  dismissed?: boolean;
  progressChecked?: boolean;
};

const STORAGE_KEY = "englishlabs:getting-started:v1";
export const GETTING_STARTED_CHANGE_EVENT = "englishlabs:getting-started:changed";

function safeParse(raw: string): GettingStartedState | null {
  try {
    const parsed = JSON.parse(raw) as Partial<GettingStartedState> | null;
    if (!parsed || parsed.version !== 1) return null;
    return {
      version: 1,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
      dismissed: typeof parsed.dismissed === "boolean" ? parsed.dismissed : undefined,
      progressChecked: typeof parsed.progressChecked === "boolean" ? parsed.progressChecked : undefined
    };
  } catch {
    return null;
  }
}

export function readGettingStartedState(): GettingStartedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return safeParse(raw);
  } catch {
    return null;
  }
}

export function writeGettingStartedState(state: GettingStartedState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function emitChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(GETTING_STARTED_CHANGE_EVENT));
}

export function setGettingStartedProgressChecked() {
  const base = readGettingStartedState() ?? {version: 1 as const, updatedAt: new Date().toISOString()};
  writeGettingStartedState({
    ...base,
    version: 1,
    updatedAt: new Date().toISOString(),
    progressChecked: true
  });
  emitChanged();
}

export function setGettingStartedDismissed(dismissed: boolean) {
  const base = readGettingStartedState() ?? {version: 1 as const, updatedAt: new Date().toISOString()};
  writeGettingStartedState({
    ...base,
    version: 1,
    updatedAt: new Date().toISOString(),
    dismissed
  });
  emitChanged();
}

