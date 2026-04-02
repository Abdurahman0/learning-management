import {studentHttpClient, toStudentApiError} from "./httpClient";
import type {
  StudentAttemptCreatePayload,
  StudentAttemptDetail,
  StudentAttemptListeningPart,
  StudentAttemptQuestion,
  StudentAttemptQuestionGroup,
  StudentAttemptReadingPassage,
  StudentAttemptReviewResponse,
  StudentAttemptSavePayload,
  StudentAttemptSaveResponse
} from "./types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function toStringSafe(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function toNumberSafe(value: unknown, fallback = 0) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toNumberOrNull(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeQuestion(item: unknown): StudentAttemptQuestion {
  const record = asRecord(item);
  const nestedQuestion = asRecord(record?.question);
  const attemptQuestionId = toStringSafe(record?.attempt_question_id ?? record?.attempt_question ?? record?.id);
  const primitiveQuestionRef =
    typeof record?.question === "string" || typeof record?.question === "number" ? toStringSafe(record.question) : "";
  const nestedQuestionId = toStringSafe(nestedQuestion?.question_id ?? nestedQuestion?.id ?? nestedQuestion?.uuid);
  const directQuestionId = toStringSafe(record?.question_id ?? record?.question_uuid);
  const resolvedQuestionId = directQuestionId || nestedQuestionId || primitiveQuestionRef;
  const candidateQuestionIds = [
    directQuestionId,
    nestedQuestionId,
    primitiveQuestionRef,
    attemptQuestionId
  ].filter((value, index, source) => Boolean(value) && source.indexOf(value) === index);
  return {
    id: resolvedQuestionId || attemptQuestionId,
    question_id: resolvedQuestionId || null,
    attempt_question_id: attemptQuestionId || null,
    candidate_question_ids: candidateQuestionIds,
    question_number: toNumberSafe(record?.question_number ?? nestedQuestion?.question_number),
    question_text:
      typeof record?.question_text === "string"
        ? record.question_text
        : typeof nestedQuestion?.question_text === "string"
          ? nestedQuestion.question_text
          : null,
    options_json: record?.options_json ?? nestedQuestion?.options_json ?? null,
    question_type: toStringSafe(record?.question_type ?? nestedQuestion?.question_type),
    question_type_display:
      typeof record?.question_type_display === "string"
        ? record.question_type_display
        : typeof nestedQuestion?.question_type_display === "string"
          ? nestedQuestion.question_type_display
          : null,
    student_answer: record?.student_answer ?? record?.answer ?? record?.answer_json ?? null,
    is_flagged: Boolean(record?.is_flagged ?? nestedQuestion?.is_flagged)
  };
}

function normalizeQuestionGroup(item: unknown): StudentAttemptQuestionGroup {
  const record = asRecord(item);
  return {
    id: toStringSafe(record?.id),
    question_type: toStringSafe(record?.question_type),
    question_type_display: typeof record?.question_type_display === "string" ? record.question_type_display : null,
    group_order: toNumberSafe(record?.group_order),
    instructions: toStringSafe(record?.instructions),
    question_number_start: toNumberSafe(record?.question_number_start),
    question_number_end: toNumberSafe(record?.question_number_end),
    word_limit: typeof record?.word_limit === "number" ? record.word_limit : null,
    number_allowed: typeof record?.number_allowed === "boolean" ? record.number_allowed : null,
    group_content_json: record?.group_content_json ?? null,
    questions: toArray(record?.questions).map(normalizeQuestion)
  };
}

function normalizeReadingPassage(item: unknown): StudentAttemptReadingPassage {
  const record = asRecord(item);
  return {
    id: toStringSafe(record?.id),
    passage_number: toStringSafe(record?.passage_number),
    title: toStringSafe(record?.title),
    passage_text: toStringSafe(record?.passage_text),
    max_questions: toNumberSafe(record?.max_questions),
    answered_count: toNumberSafe(record?.answered_count),
    question_groups: toArray(record?.question_groups).map(normalizeQuestionGroup)
  };
}

function normalizeListeningPart(item: unknown): StudentAttemptListeningPart {
  const record = asRecord(item);
  return {
    id: toStringSafe(record?.id),
    part_number: toStringSafe(record?.part_number),
    title: toStringSafe(record?.title),
    transcript_text: toStringSafe(record?.transcript_text),
    audio_file_url: typeof record?.audio_file_url === "string" ? record.audio_file_url : null,
    max_questions: toNumberSafe(record?.max_questions),
    answered_count: toNumberSafe(record?.answered_count),
    question_groups: toArray(record?.question_groups).map(normalizeQuestionGroup)
  };
}

function normalizeAttemptDetail(data: unknown): StudentAttemptDetail {
  const record = asRecord(data);
  return {
    id: toStringSafe(record?.id),
    practice_test: toStringSafe(record?.practice_test),
    practice_test_title: toStringSafe(record?.practice_test_title),
    test_type: toStringSafe(record?.test_type),
    mode: toStringSafe(record?.mode),
    status: toStringSafe(record?.status),
    started_at: typeof record?.started_at === "string" ? record.started_at : null,
    completed_at: typeof record?.completed_at === "string" ? record.completed_at : null,
    time_used_seconds: toNumberSafe(record?.time_used_seconds),
    time_limit_seconds: typeof record?.time_limit_seconds === "number" ? record.time_limit_seconds : null,
    total_questions: toNumberSafe(record?.total_questions),
    answered_count: toNumberSafe(record?.answered_count),
    reading_passages: toArray(record?.reading_passages).map(normalizeReadingPassage),
    listening_parts: toArray(record?.listening_parts).map(normalizeListeningPart),
    score: typeof record?.score === "number" ? record.score : null,
    band_score: typeof record?.band_score === "string" ? record.band_score : null,
    correct_count: typeof record?.correct_count === "number" ? record.correct_count : null,
    incorrect_count: typeof record?.incorrect_count === "number" ? record.incorrect_count : null,
    unanswered_count: typeof record?.unanswered_count === "number" ? record.unanswered_count : null,
    question_type_stats_json: asRecord(record?.question_type_stats_json),
    passage_stats_json: asRecord(record?.passage_stats_json)
  };
}

function normalizeSaveResponse(data: unknown): StudentAttemptSaveResponse {
  const record = asRecord(data);
  const answered = toNumberSafe(record?.answered_count ?? record?.answered);
  const total = toNumberSafe(record?.total_questions ?? record?.total);
  return {
    answered,
    total,
    time_used_seconds: toNumberSafe(record?.time_used_seconds)
  };
}

function normalizeReviewQuestion(data: unknown) {
  const record = asRecord(data);
  return {
    id: toStringSafe(record?.id),
    question_number: toNumberSafe(record?.question_number),
    question_text: typeof record?.question_text === "string" ? record.question_text : null,
    question_type: toStringSafe(record?.question_type),
    question_type_display: typeof record?.question_type_display === "string" ? record.question_type_display : null,
    options_json: record?.options_json ?? record?.options ?? null,
    correct_answer_json: record?.correct_answer_json ?? record?.correct_answer ?? null,
    student_answer: record?.student_answer ?? record?.answer ?? null,
    is_correct: Boolean(record?.is_correct),
    is_skipped: Boolean(record?.is_skipped),
    is_flagged: Boolean(record?.is_flagged),
    explanation: typeof record?.explanation === "string" ? record.explanation : null,
    answer_evidence_json: record?.answer_evidence_json ?? record?.answer_evidence ?? null
  };
}

function normalizeReviewGroup(data: unknown) {
  const record = asRecord(data);
  return {
    id: toStringSafe(record?.id),
    question_type: toStringSafe(record?.question_type),
    question_type_display: typeof record?.question_type_display === "string" ? record.question_type_display : null,
    instructions: typeof record?.instructions === "string" ? record.instructions : null,
    question_number_start: toNumberOrNull(record?.question_number_start),
    question_number_end: toNumberOrNull(record?.question_number_end),
    questions: toArray(record?.questions).map(normalizeReviewQuestion)
  };
}

function normalizeReviewPassage(data: unknown) {
  const record = asRecord(data);
  return {
    id: toStringSafe(record?.id),
    passage_number: toStringSafe(record?.passage_number),
    title: toStringSafe(record?.title),
    passage_text: toStringSafe(record?.passage_text),
    max_questions: toNumberSafe(record?.max_questions),
    correct_count: toNumberOrNull(record?.correct_count),
    total_count: toNumberOrNull(record?.total_count),
    performance_label: toStringSafe(record?.performance_label) || undefined,
    question_groups: toArray(record?.question_groups).map(normalizeReviewGroup)
  };
}

function normalizeReviewPart(data: unknown) {
  const record = asRecord(data);
  return {
    id: toStringSafe(record?.id),
    part_number: toStringSafe(record?.part_number),
    title: toStringSafe(record?.title),
    transcript_text: toStringSafe(record?.transcript_text),
    audio_file_url: typeof record?.audio_file_url === "string" ? record.audio_file_url : null,
    max_questions: toNumberSafe(record?.max_questions),
    correct_count: toNumberOrNull(record?.correct_count),
    total_count: toNumberOrNull(record?.total_count),
    performance_label: toStringSafe(record?.performance_label) || undefined,
    question_groups: toArray(record?.question_groups).map(normalizeReviewGroup)
  };
}

function normalizeReviewResponse(data: unknown): StudentAttemptReviewResponse {
  const record = asRecord(data) ?? asRecord(asRecord(data)?.results);
  return {
    attempt_id: toStringSafe(record?.attempt_id ?? record?.id),
    test_title: toStringSafe(record?.test_title ?? record?.practice_test_title),
    test_type: toStringSafe(record?.test_type),
    mode: typeof record?.mode === "string" ? record.mode : null,
    status: typeof record?.status === "string" ? record.status : null,
    score: toNumberOrNull(record?.score),
    band_score: typeof record?.band_score === "string" ? record.band_score : null,
    total_questions: toNumberOrNull(record?.total_questions),
    correct_count: toNumberOrNull(record?.correct_count),
    incorrect_count: toNumberOrNull(record?.incorrect_count),
    unanswered_count: toNumberOrNull(record?.unanswered_count),
    time_used_seconds: toNumberOrNull(record?.time_used_seconds),
    question_type_stats: asRecord(record?.question_type_stats) ?? asRecord(record?.question_type_stats_json),
    question_type_stats_json: asRecord(record?.question_type_stats_json),
    passage_stats_json: asRecord(record?.passage_stats_json),
    passages: toArray(record?.passages ?? record?.reading_passages).map(normalizeReviewPassage),
    parts: toArray(record?.parts ?? record?.listening_parts).map(normalizeReviewPart),
    raw: record
  };
}

export const studentAttemptsService = {
  async create(payload: StudentAttemptCreatePayload) {
    try {
      const response = await studentHttpClient.post("/attempts/", payload);
      return normalizeAttemptDetail(response.data);
    } catch (error) {
      throw toStudentApiError(error);
    }
  },

  async getById(attemptId: string) {
    try {
      const response = await studentHttpClient.get(`/attempts/${attemptId}/`);
      return normalizeAttemptDetail(response.data);
    } catch (error) {
      throw toStudentApiError(error);
    }
  },

  async save(attemptId: string, payload: StudentAttemptSavePayload) {
    try {
      const response = await studentHttpClient.patch(`/attempts/${attemptId}/save/`, payload);
      return normalizeSaveResponse(response.data);
    } catch (error) {
      throw toStudentApiError(error);
    }
  },

  async submit(attemptId: string, payload: StudentAttemptSavePayload) {
    try {
      const response = await studentHttpClient.post(`/attempts/${attemptId}/submit/`, payload);
      return normalizeAttemptDetail(response.data);
    } catch (error) {
      throw toStudentApiError(error);
    }
  },

  async review(attemptId: string) {
    try {
      const response = await studentHttpClient.get(`/attempts/${attemptId}/review/`);
      return normalizeReviewResponse(response.data);
    } catch (error) {
      throw toStudentApiError(error);
    }
  }
};
