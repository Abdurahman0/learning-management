import type {ListeningAnswerMeta} from "@/data/listening-answer-keys";
import type {StudentAttemptReviewResponse} from "@/src/services/student/types";
import type {FlattenedListeningQuestion} from "@/lib/listening-questions";
import type {ListeningTypePerformance} from "@/lib/listening-review-insights";
import type {ListeningSectionPerformanceItem} from "./ListeningSectionPerformance";
import type {ListeningReviewSection} from "./ListeningTranscriptReviewPanel";
import type {ListeningSectionId} from "@/data/listening-tests-full";

type ListeningAnswerValue = string | string[] | null;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function toStringSafe(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function toNumberSafe(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseAnswerValue(value: unknown): ListeningAnswerValue {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map((item) => toStringSafe(item).trim()).filter(Boolean);
  }
  const record = asRecord(value);
  if (!record) return null;
  if (typeof record.answer === "string") return record.answer;
  if (Array.isArray(record.answers)) {
    return record.answers.map((item) => toStringSafe(item).trim()).filter(Boolean);
  }
  return null;
}

function normalizeQuestionType(value: string): FlattenedListeningQuestion["type"] {
  const normalized = value.toLowerCase();
  if (normalized.includes("mcq") || normalized.includes("multiple")) return "mcq";
  if (normalized.includes("match") || normalized.includes("diagram")) return "matching";
  return "text";
}

function toTimeRange(value: unknown): [number, number] | undefined {
  if (Array.isArray(value) && value.length >= 2) {
    const start = toNumberSafe(value[0], 0);
    const end = toNumberSafe(value[1], start);
    return [start, end];
  }
  const record = asRecord(value);
  if (!record) return undefined;
  const start = toNumberSafe(record.start ?? record.from, 0);
  const end = toNumberSafe(record.end ?? record.to, start);
  return [start, end];
}

function toTimestampSeconds(value: unknown) {
  const raw = toStringSafe(value, "").trim();
  if (!raw) return null;

  const parts = raw.split(":").map((item) => Number(item));
  if (parts.some((item) => !Number.isFinite(item))) return null;

  if (parts.length === 2) {
    return Math.max(0, parts[0] * 60 + parts[1]);
  }

  if (parts.length === 3) {
    return Math.max(0, parts[0] * 3600 + parts[1] * 60 + parts[2]);
  }

  return null;
}

function serializeUnknown(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value) || (value && typeof value === "object")) {
    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }
  return "";
}

function toSectionId(index: number): ListeningSectionId {
  if (index <= 0) return "s1";
  if (index === 1) return "s2";
  if (index === 2) return "s3";
  return "s4";
}

export type AdaptedListeningBackendReview = {
  questions: FlattenedListeningQuestion[];
  answers: Record<string, ListeningAnswerValue>;
  answerMeta: ListeningAnswerMeta[];
  reviewSections: ListeningReviewSection[];
  sectionPerformance: ListeningSectionPerformanceItem[];
  typePerformance: ListeningTypePerformance[];
  stats: {
    correct: number;
    incorrect: number;
    unanswered: number;
    total: number;
    scorePercent: number;
    estimatedBand: string;
  };
};

function estimateListeningBand(correct: number) {
  if (correct >= 39) return "9.0";
  if (correct >= 37) return "8.5";
  if (correct >= 35) return "8.0";
  if (correct >= 32) return "7.5";
  if (correct >= 30) return "7.0";
  if (correct >= 26) return "6.5";
  if (correct >= 23) return "6.0";
  if (correct >= 18) return "5.5";
  if (correct >= 16) return "5.0";
  if (correct >= 13) return "4.5";
  if (correct >= 10) return "4.0";
  if (correct >= 8) return "3.5";
  if (correct >= 6) return "3.0";
  if (correct >= 4) return "2.5";
  if (correct >= 2) return "2.0";
  return "1.0";
}

export function adaptListeningBackendReview(review: StudentAttemptReviewResponse): AdaptedListeningBackendReview {
  const answers: Record<string, ListeningAnswerValue> = {};
  const answerMeta: ListeningAnswerMeta[] = [];
  const questions: FlattenedListeningQuestion[] = [];

  const rawQuestionsByPart = (review.parts ?? []).map((part, partIndex) => {
    const sectionId = toSectionId(partIndex);
    const sectionQuestions = [...part.question_groups]
      .flatMap((group) => group.questions.map((question) => ({group, question})))
      .sort((a, b) => a.question.question_number - b.question.question_number);

    sectionQuestions.forEach(({question}) => {
      const questionType = normalizeQuestionType(toStringSafe(question.question_type, "text"));
      const prompt = toStringSafe(question.question_text, `Question ${question.question_number}`);
      questions.push({
        id: question.id,
        number: question.question_number,
        sectionId,
        sectionTitle: part.title || `Part ${partIndex + 1}`,
        prompt,
        type: questionType
      });

      answers[question.id] = parseAnswerValue(question.student_answer);
      answerMeta.push({
        questionId: question.id,
        questionNumber: question.question_number,
        type: questionType,
        correctAnswer: parseAnswerValue(question.correct_answer_json) ?? serializeUnknown(question.correct_answer_json),
        acceptableAnswers: undefined,
        explanation: toStringSafe(question.explanation, "No explanation provided by backend."),
        evidence: {
          sectionId,
          transcriptQuote:
            toStringSafe(
              asRecord(question.answer_evidence_json)?.quote ?? asRecord(question.answer_evidence_json)?.text_snippet,
              prompt
            ) || prompt,
          timeRange:
            toTimeRange(asRecord(question.answer_evidence_json)?.time_range ?? asRecord(question.answer_evidence_json)?.timeRange) ??
            (() => {
              const second = toTimestampSeconds(asRecord(question.answer_evidence_json)?.timestamp);
              return second == null ? undefined : ([second, second] as [number, number]);
            })()
        }
      });
    });

    return {part, sectionId, sectionQuestions};
  });

  const sectionPerformance: ListeningSectionPerformanceItem[] = rawQuestionsByPart.map(({part, sectionId, sectionQuestions}, index) => {
    const total = part.total_count ?? sectionQuestions.length;
    const correct = part.correct_count ?? sectionQuestions.filter(({question}) => question.is_correct).length;
    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
    return {
      sectionId,
      label: `Part ${index + 1}`,
      correct,
      total,
      percent
    };
  });

  const reviewSections: ListeningReviewSection[] = rawQuestionsByPart.map(({part, sectionId, sectionQuestions}, index) => ({
    sectionId,
    label: `Part ${index + 1}`,
    title: part.title || `Part ${index + 1}`,
    instructions: part.question_groups[0]?.instructions || "",
    nowPlayingLabel: `Part ${index + 1} of ${Math.max(1, rawQuestionsByPart.length)}`,
    audioTitle: part.title || `Part ${index + 1}`,
    evidenceItems: sectionQuestions.map(({question}) => {
      const evidence = asRecord(question.answer_evidence_json);
      return {
        questionId: question.id,
        questionNumber: question.question_number,
        prompt: toStringSafe(question.question_text, `Question ${question.question_number}`),
        quote: toStringSafe(evidence?.quote ?? evidence?.text_snippet, toStringSafe(question.question_text, "")),
        timeRange:
          toTimeRange(evidence?.time_range ?? evidence?.timeRange) ??
          (() => {
            const second = toTimestampSeconds(evidence?.timestamp);
            return second == null ? undefined : ([second, second] as [number, number]);
          })(),
        status: question.is_skipped ? "skipped" : question.is_correct ? "correct" : "incorrect"
      };
    })
  }));

  const typeBuckets = new Map<FlattenedListeningQuestion["type"], {correct: number; total: number}>();
  questions.forEach((question) => {
    const source = rawQuestionsByPart
      .flatMap((entry) => entry.sectionQuestions)
      .find((entry) => entry.question.id === question.id)?.question;
    const bucket = typeBuckets.get(question.type) ?? {correct: 0, total: 0};
    bucket.total += 1;
    if (source?.is_correct) bucket.correct += 1;
    typeBuckets.set(question.type, bucket);
  });
  const typePerformance: ListeningTypePerformance[] = [...typeBuckets.entries()].map(([type, stats]) => ({
    type,
    correct: stats.correct,
    total: stats.total,
    percent: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
  }));

  const total = review.total_questions ?? questions.length;
  const correct = review.correct_count ?? questions.filter((question) => {
    const source = rawQuestionsByPart
      .flatMap((entry) => entry.sectionQuestions)
      .find((entry) => entry.question.id === question.id)?.question;
    return source?.is_correct;
  }).length;
  const unanswered = review.unanswered_count ?? questions.filter((question) => !answers[question.id]).length;
  const incorrect = review.incorrect_count ?? Math.max(0, total - correct - unanswered);
  const scorePercent = total > 0 ? Math.round((correct / total) * 100) : 0;

  return {
    questions: questions.sort((a, b) => a.number - b.number),
    answers,
    answerMeta,
    reviewSections,
    sectionPerformance,
    typePerformance,
    stats: {
      correct,
      incorrect,
      unanswered,
      total,
      scorePercent,
      estimatedBand: review.band_score || estimateListeningBand(correct)
    }
  };
}
