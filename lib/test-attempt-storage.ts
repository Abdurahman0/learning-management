export type TestModule = "reading" | "listening";
export type AttemptMode = "real" | "practice";

export type PersistedAttempt = {
  attemptId: string;
  backendAttemptId?: string;
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

const ATTEMPT_PREFIX = "ielts-master:attempt";
const RESULT_PREFIX = "ielts-master:result";
const LATEST_PREFIX = "ielts-master:latest-attempt";

function buildKey(prefix: string, module: TestModule, testId: string, attemptId: string) {
  return `${prefix}:${module}:${testId}:${attemptId}`;
}

export function createAttemptId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
