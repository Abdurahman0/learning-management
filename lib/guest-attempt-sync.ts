import {loadAttemptResult, saveAttemptResult, type AttemptMode, type TestModule} from "@/lib/test-attempt-storage";
import {studentAttemptsService} from "@/src/services/student/attempts.service";
import type {StudentAttemptDetail, StudentAttemptQuestion, StudentAttemptQuestionGroup, StudentAttemptReadingPassage, StudentAttemptListeningPart} from "@/src/services/student/types";

export type GuestPendingAttempt = {
  module: TestModule;
  testId: string;
  localAttemptId: string;
  mode: AttemptMode;
  finishedAt: number;
  timeUsedSeconds: number;
  answers: Record<string, string | string[] | null>;
  markedQuestionIds: string[];
};

const STORAGE_KEY = "englishlabs:guest-pending-attempts:v1";

function isBrowser() {
  return typeof window !== "undefined";
}

function normalizeQueue(value: unknown): GuestPendingAttempt[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const record = item as Record<string, unknown>;
      const module = record.module === "reading" || record.module === "listening" ? record.module : null;
      const testId = typeof record.testId === "string" ? record.testId : "";
      const localAttemptId = typeof record.localAttemptId === "string" ? record.localAttemptId : "";
      const mode = record.mode === "real" || record.mode === "practice" ? record.mode : "practice";
      const finishedAt = typeof record.finishedAt === "number" ? record.finishedAt : 0;
      const timeUsedSeconds = typeof record.timeUsedSeconds === "number" ? record.timeUsedSeconds : 0;
      const answersRaw = record.answers;
      const markedRaw = record.markedQuestionIds;
      const answers: Record<string, string | string[] | null> = {};
      if (answersRaw && typeof answersRaw === "object" && !Array.isArray(answersRaw)) {
        for (const [key, val] of Object.entries(answersRaw as Record<string, unknown>)) {
          if (typeof val === "string") {
            const trimmed = val.trim();
            answers[key] = trimmed.length ? trimmed : null;
          } else if (Array.isArray(val)) {
            const cleaned = (val as unknown[])
              .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
              .filter(Boolean);
            answers[key] = cleaned.length ? cleaned : null;
          } else {
            answers[key] = null;
          }
        }
      }
      const markedQuestionIds = Array.isArray(markedRaw)
        ? (markedRaw as unknown[]).map((entry) => (typeof entry === "string" ? entry : "")).filter(Boolean)
        : [];

      if (!module || !testId || !localAttemptId || finishedAt <= 0) return null;

      return {
        module,
        testId,
        localAttemptId,
        mode,
        finishedAt,
        timeUsedSeconds: Math.max(0, Math.floor(timeUsedSeconds)),
        answers,
        markedQuestionIds
      } satisfies GuestPendingAttempt;
    })
    .filter((item): item is GuestPendingAttempt => item !== null);
}

function loadQueue(): GuestPendingAttempt[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return normalizeQueue(JSON.parse(raw));
  } catch {
    return [];
  }
}

function saveQueue(queue: GuestPendingAttempt[]) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Ignore storage errors.
  }
}

export function enqueueGuestPendingAttempt(record: GuestPendingAttempt) {
  if (!isBrowser()) return;
  const queue = loadQueue();
  const exists = queue.some(
    (item) =>
      item.module === record.module &&
      item.testId === record.testId &&
      item.localAttemptId === record.localAttemptId
  );
  if (exists) return;
  saveQueue([record, ...queue].slice(0, 30));
}

function toBackendAnswerPayload(value: string | string[] | null): {answer: string} | {answers: string[]} | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? {answer: trimmed} : null;
  }
  if (Array.isArray(value)) {
    const cleaned = value.map((entry) => entry.trim()).filter(Boolean);
    return cleaned.length ? {answers: cleaned} : null;
  }
  return null;
}

type AttemptQuestionIndex = {
  question_id: string;
  attempt_question_id: string;
};

function indexAttemptQuestions(attempt: StudentAttemptDetail) {
  const byCandidateId = new Map<string, AttemptQuestionIndex>();

  const consumeQuestion = (question: StudentAttemptQuestion) => {
    const canonical = (question.question_id ?? "").trim() || (question.id ?? "").trim();
    const attemptScoped = (question.attempt_question_id ?? "").trim() || (question.id ?? "").trim();
    if (!canonical || !attemptScoped) return;

    const candidates = [
      canonical,
      attemptScoped,
      ...((question.candidate_question_ids ?? []) as string[])
    ]
      .map((value) => String(value ?? "").trim())
      .filter(Boolean);

    const entry: AttemptQuestionIndex = {
      question_id: canonical,
      attempt_question_id: attemptScoped
    };

    candidates.forEach((candidate) => {
      if (!byCandidateId.has(candidate)) {
        byCandidateId.set(candidate, entry);
      }
    });
  };

  const readingPassages = (attempt.reading_passages ?? []) as StudentAttemptReadingPassage[];
  readingPassages.forEach((passage) => {
    (passage.question_groups ?? []).forEach((group: StudentAttemptQuestionGroup) => {
      (group.questions ?? []).forEach(consumeQuestion);
    });
  });

  const listeningParts = (attempt.listening_parts ?? []) as StudentAttemptListeningPart[];
  listeningParts.forEach((part) => {
    (part.question_groups ?? []).forEach((group: StudentAttemptQuestionGroup) => {
      (group.questions ?? []).forEach(consumeQuestion);
    });
  });

  return byCandidateId;
}

export async function syncGuestPendingAttemptsOnce() {
  if (!isBrowser()) return;
  const queue = loadQueue();
  if (!queue.length) return;

  const nextQueue: GuestPendingAttempt[] = [];

  for (const item of queue) {
    try {
      const created = await studentAttemptsService.create({
        practice_test: item.testId,
        mode: item.mode === "real" ? "REAL" : "PRACTICE"
      });

      const byCandidateId = indexAttemptQuestions(created);
      const markedSet = new Set(item.markedQuestionIds);

      const answersPayload = Object.entries(item.answers)
        .map(([candidateId, answerValue]) => {
          const index = byCandidateId.get(candidateId);
          if (!index) return null;
          const answer = toBackendAnswerPayload(answerValue);
          const is_flagged = markedSet.has(candidateId);
          if (answer === null && !is_flagged) return null;
          return {
            question_id: index.question_id,
            attempt_question_id: index.attempt_question_id,
            answer,
            is_flagged
          };
        })
        .filter(
          (
            entry
          ): entry is {
            question_id: string;
            attempt_question_id: string;
            answer: {answer: string} | {answers: string[]} | null;
            is_flagged: boolean;
          } => entry !== null
        );

      const submitted = await studentAttemptsService.submit(String(created.id), {
        time_used_seconds: item.timeUsedSeconds,
        answers: answersPayload
      });

      const existingResult = loadAttemptResult(item.module, item.testId, item.localAttemptId);
      if (existingResult) {
        saveAttemptResult({
          ...existingResult,
          backendAttemptId: String(submitted.id)
        });
      }
    } catch {
      // Keep failed items in the queue; user can retry by reloading after login.
      nextQueue.push(item);
    }
  }

  saveQueue(nextQueue);
}
