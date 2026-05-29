export type TestModule = "reading" | "listening";
export type AttemptMode = "real" | "practice";

export type PersistedAttempt = {
  attemptId: string;
  backendAttemptId?: string;
  ownerKey?: string;
  contentSignature?: string;
  tabId?: string;
  module: TestModule;
  testId: string;
  mode?: AttemptMode;
  answers: Record<string, string | string[] | null>;
  markedQuestionIds: string[];
  startedAt: number;
  finishedAt?: number;
  timeRemainingSec: number;
  timerUsed: boolean;
};

const ATTEMPT_PREFIX = "englishlabs:attempt";
const RESULT_PREFIX = "englishlabs:result";
const LATEST_PREFIX = "englishlabs:latest-attempt";
const TAB_PREFIX = "englishlabs:active-attempt-tab";
const TAB_STORAGE_KEY = "englishlabs:tab-id";

function buildKey(prefix: string, module: TestModule, testId: string, attemptId: string) {
  return `${prefix}:${module}:${testId}:${attemptId}`;
}

export function createAttemptId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createAttemptTabId() {
  if (typeof window === "undefined") {
    return createAttemptId();
  }

  try {
    const existing = window.sessionStorage.getItem(TAB_STORAGE_KEY)?.trim();
    if (existing) {
      return existing;
    }

    const tabId = `tab-${createAttemptId()}`;
    window.sessionStorage.setItem(TAB_STORAGE_KEY, tabId);
    return tabId;
  } catch {
    return `tab-${createAttemptId()}`;
  }
}

function buildTabKey(module: TestModule, testId: string) {
  return `${TAB_PREFIX}:${module}:${testId}`;
}

export function claimAttemptTab(module: TestModule, testId: string, attemptId: string, tabId = createAttemptTabId()) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    buildTabKey(module, testId),
    JSON.stringify({
      attemptId,
      tabId,
      updatedAt: Date.now()
    })
  );
}

export function isAttemptTabOwner(module: TestModule, testId: string, attemptId: string, tabId = createAttemptTabId()) {
  if (typeof window === "undefined") return true;

  try {
    const raw = window.localStorage.getItem(buildTabKey(module, testId));
    if (!raw) {
      return true;
    }

    const parsed = JSON.parse(raw) as {attemptId?: string; tabId?: string} | null;
    return parsed?.attemptId === attemptId && parsed?.tabId === tabId;
  } catch {
    return false;
  }
}

export function releaseAttemptTab(module: TestModule, testId: string, attemptId: string, tabId = createAttemptTabId()) {
  if (typeof window === "undefined") return;

  try {
    const key = buildTabKey(module, testId);
    const raw = window.localStorage.getItem(key);
    if (!raw) return;

    const parsed = JSON.parse(raw) as {attemptId?: string; tabId?: string} | null;
    if (parsed?.attemptId === attemptId && parsed?.tabId === tabId) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage corruption.
  }
}

export function saveAttemptProgress(payload: PersistedAttempt) {
  if (typeof window === "undefined") return;
  const key = buildKey(ATTEMPT_PREFIX, payload.module, payload.testId, payload.attemptId);
  window.localStorage.setItem(key, JSON.stringify(payload));
  window.localStorage.setItem(`${LATEST_PREFIX}:${payload.module}:${payload.testId}`, payload.attemptId);
}

export function loadAttemptProgress(module: TestModule, testId: string, attemptId: string) {
  if (typeof window === "undefined") return null;
  const key = buildKey(ATTEMPT_PREFIX, module, testId, attemptId);
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as PersistedAttempt;
  } catch {
    return null;
  }
}

export function clearLatestAttemptProgress(module: TestModule, testId: string) {
  if (typeof window === "undefined") return;
  const latestKey = `${LATEST_PREFIX}:${module}:${testId}`;
  const latestId = window.localStorage.getItem(latestKey);
  if (latestId) {
    window.localStorage.removeItem(buildKey(ATTEMPT_PREFIX, module, testId, latestId));
  }
  window.localStorage.removeItem(latestKey);
}

export function saveAttemptResult(payload: PersistedAttempt) {
  if (typeof window === "undefined") return;
  const key = buildKey(RESULT_PREFIX, payload.module, payload.testId, payload.attemptId);
  window.localStorage.setItem(key, JSON.stringify(payload));
}

export function loadAttemptResult(module: TestModule, testId: string, attemptId: string) {
  if (typeof window === "undefined") return null;
  const key = buildKey(RESULT_PREFIX, module, testId, attemptId);
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as PersistedAttempt;
  } catch {
    return null;
  }
}

export function loadLatestAttemptId(module: TestModule, testId: string) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(`${LATEST_PREFIX}:${module}:${testId}`);
}

export function loadLatestAttemptResult(module: TestModule, testId: string) {
  if (typeof window === "undefined") return null;

  const prefix = `${RESULT_PREFIX}:${module}:${testId}:`;
  let latest: PersistedAttempt | null = null;

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || !key.startsWith(prefix)) continue;
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw) as PersistedAttempt;
      if (!latest) {
        latest = parsed;
        continue;
      }
      const parsedTime = parsed.finishedAt ?? parsed.startedAt;
      const latestTime = latest.finishedAt ?? latest.startedAt;
      if (parsedTime > latestTime) {
        latest = parsed;
      }
    } catch {
      // Ignore invalid records.
    }
  }

  return latest;
}
