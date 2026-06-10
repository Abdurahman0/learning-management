import {studentHttpClient, toListQuery, toStudentApiError} from "./httpClient";
import type {StudentListQuery, StudentPaginatedResponse} from "./types";
import type {
  StudentMarathonAttempt,
  StudentMarathonAttemptCreatePayload,
  StudentMarathonAttemptResult,
  StudentMarathonAttemptResultAnswer,
  StudentMarathonAttemptSavePayload,
  StudentMarathonAttemptSaveResponse,
  StudentMarathonAttemptSubmitPayload,
  StudentMarathonDayCompleteResponse,
  StudentMarathonDayContentItem,
  StudentMarathonDayDetail,
  StudentMarathonDayLink,
  StudentMarathonDayNote,
  StudentMarathonDaySummary,
  StudentMarathonDetail,
  StudentMarathonEnrollment,
  StudentMarathonEnrollmentBrief,
  StudentMarathonLeaderboardEntry,
  StudentMarathonListItem,
  StudentMarathonListeningDayItem
} from "./marathon.types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function toArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function toStringSafe(value: unknown, fallback = "") {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function toNumberSafe(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBooleanSafe(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeEnrollmentBrief(value: unknown): StudentMarathonEnrollmentBrief | null {
  const record = asRecord(value);
  if (!record) return null;

  return {
    id: toStringSafe(record.id),
    status: toStringSafe(record.status),
    is_finished_marathon: toBooleanSafe(record.is_finished_marathon),
    current_streak: toNumberSafe(record.current_streak),
    enrolled_at: toStringSafe(record.enrolled_at) || null
  };
}

function normalizeEnrollment(value: unknown): StudentMarathonEnrollment | null {
  const record = asRecord(value);
  const brief = normalizeEnrollmentBrief(record);
  if (!record || !brief) return null;

  return {
    ...brief,
    marathon: toStringSafe(record.marathon),
    last_activity_at: toStringSafe(record.last_activity_at) || null,
    completed_at: toStringSafe(record.completed_at) || null,
    longest_streak: toNumberSafe(record.longest_streak),
    days_missed: toNumberSafe(record.days_missed),
    total_score: toStringSafe(record.total_score, "0.00"),
    total_time_seconds: toNumberSafe(record.total_time_seconds),
    current_day_number: toNumberSafe(record.current_day_number, 1),
    days_completed: toNumberSafe(record.days_completed),
    progress_percentage: toNumberSafe(record.progress_percentage)
  };
}

function normalizeMarathonItem(value: unknown): StudentMarathonListItem {
  const record = asRecord(value);
  return {
    id: toStringSafe(record?.id),
    title: toStringSafe(record?.title, "Marathon"),
    description: toStringSafe(record?.description),
    marathon_days: toNumberSafe(record?.marathon_days),
    total_days: toNumberSafe(record?.total_days ?? record?.marathon_days),
    difficulty: toStringSafe(record?.difficulty),
    difficulty_display: toStringSafe(record?.difficulty_display, toStringSafe(record?.difficulty)),
    category: toStringSafe(record?.category),
    category_display: toStringSafe(record?.category_display, toStringSafe(record?.category)),
    target_band: toStringSafe(record?.target_band) || null,
    for_premium_users: toBooleanSafe(record?.for_premium_users),
    external_link: toStringSafe(record?.external_link) || null,
    external_link_title: toStringSafe(record?.external_link_title) || null,
    enrollment: normalizeEnrollmentBrief(record?.enrollment)
  };
}

function normalizeMarathonDetail(value: unknown): StudentMarathonDetail {
  const record = asRecord(value);
  const base = normalizeMarathonItem(record);
  return {
    ...base,
    streak_goal_days: toNumberSafe(record?.streak_goal_days, 7),
    enrollment: normalizeEnrollment(record?.enrollment)
  };
}

function normalizeDaySummary(value: unknown): StudentMarathonDaySummary {
  const record = asRecord(value);
  return {
    id: toStringSafe(record?.id),
    day_number: toNumberSafe(record?.day_number),
    title: toStringSafe(record?.title, `Day ${toNumberSafe(record?.day_number)}`),
    difficulty: toStringSafe(record?.difficulty) || null,
    estimated_minutes: record?.estimated_minutes == null ? null : toNumberSafe(record?.estimated_minutes),
    is_bonus_day: toBooleanSafe(record?.is_bonus_day),
    is_completable: toBooleanSafe(record?.is_completable),
    is_locked: toBooleanSafe(record?.is_locked),
    is_completed: toBooleanSafe(record?.is_completed),
    external_links_count: toNumberSafe(record?.external_links_count),
    reading_passages_count: toNumberSafe(record?.reading_passages_count),
    listening_parts_count: toNumberSafe(record?.listening_parts_count)
  };
}

function normalizeDayLink(value: unknown): StudentMarathonDayLink {
  const record = asRecord(value);
  return {
    id: toStringSafe(record?.id),
    title: toStringSafe(record?.title, "Resource"),
    url: toStringSafe(record?.url),
    order: toNumberSafe(record?.order)
  };
}

function normalizeDayItem(value: unknown): StudentMarathonDayContentItem {
  const record = asRecord(value);
  return {
    id: toStringSafe(record?.id),
    title: toStringSafe(record?.title, "Reading passage"),
    max_questions: toNumberSafe(record?.max_questions),
    difficulty_level: toStringSafe(record?.difficulty_level) || null,
    estimated_time_minutes: record?.estimated_time_minutes == null ? null : toNumberSafe(record?.estimated_time_minutes),
    is_available_to_be_solved: toBooleanSafe(record?.is_available_to_be_solved, true),
    attempt_id: toStringSafe(record?.attempt_id) || null,
    attempt_status: toStringSafe(record?.attempt_status) || null,
    band_score: toStringSafe(record?.band_score) || null,
    question_groups_count: toNumberSafe(record?.question_groups_count)
  };
}

function normalizeListeningDayItem(value: unknown): StudentMarathonListeningDayItem {
  const record = asRecord(value);
  return {
    ...normalizeDayItem(record),
    audio_file_url: toStringSafe(record?.audio_file_url) || null
  };
}

function normalizeDayNote(value: unknown): StudentMarathonDayNote | null {
  const record = asRecord(value);
  if (!record) return null;
  return {
    id: toStringSafe(record.id),
    note_text: typeof record.note_text === "string" ? record.note_text : null,
    updated_at: toStringSafe(record.updated_at) || null
  };
}

function normalizeDayDetail(value: unknown): StudentMarathonDayDetail {
  const record = asRecord(value);
  return {
    id: toStringSafe(record?.id),
    day_number: toNumberSafe(record?.day_number),
    title: toStringSafe(record?.title, `Day ${toNumberSafe(record?.day_number)}`),
    content: toStringSafe(record?.content),
    difficulty: toStringSafe(record?.difficulty) || null,
    estimated_minutes: record?.estimated_minutes == null ? null : toNumberSafe(record?.estimated_minutes),
    is_bonus_day: toBooleanSafe(record?.is_bonus_day),
    is_completable: toBooleanSafe(record?.is_completable),
    is_locked: toBooleanSafe(record?.is_locked),
    is_completed: toBooleanSafe(record?.is_completed),
    student_day_id: toStringSafe(record?.student_day_id) || null,
    time_spent_seconds: toNumberSafe(record?.time_spent_seconds),
    external_links: toArray(record?.external_links).map(normalizeDayLink),
    reading_passages: toArray(record?.reading_passages).map(normalizeDayItem),
    listening_parts: toArray(record?.listening_parts).map(normalizeListeningDayItem),
    note: normalizeDayNote(record?.note)
  };
}

function normalizeDayCompleteResponse(value: unknown): StudentMarathonDayCompleteResponse {
  const record = asRecord(value);
  return {
    detail: toStringSafe(record?.detail, "Updated."),
    is_completed: toBooleanSafe(record?.is_completed),
    day_band_score: toStringSafe(record?.day_band_score) || null,
    current_streak: record?.current_streak == null ? null : toNumberSafe(record?.current_streak),
    is_finished_marathon: toBooleanSafe(record?.is_finished_marathon),
    incomplete: toArray(record?.incomplete).map((item) => {
      const entry = asRecord(item);
      return {
        type: toStringSafe(entry?.type),
        id: toStringSafe(entry?.id),
        title: toStringSafe(entry?.title)
      };
    })
  };
}

function normalizeAttempt(value: unknown): StudentMarathonAttempt {
  const record = asRecord(value);
  return {
    id: toStringSafe(record?.id),
    enrollment: toStringSafe(record?.enrollment),
    day: toStringSafe(record?.day),
    reading_passage: toStringSafe(record?.reading_passage) || null,
    listening_part: toStringSafe(record?.listening_part) || null,
    status: toStringSafe(record?.status),
    score: record?.score == null ? null : toNumberSafe(record?.score),
    band_score: toStringSafe(record?.band_score) || null,
    started_at: toStringSafe(record?.started_at) || null,
    completed_at: toStringSafe(record?.completed_at) || null,
    time_used_seconds: toNumberSafe(record?.time_used_seconds),
    questions_answered: toNumberSafe(record?.questions_answered),
    total_questions: toNumberSafe(record?.total_questions),
    content: asRecord(record?.content)
  };
}

function normalizeAttemptSaveResponse(value: unknown): StudentMarathonAttemptSaveResponse {
  const record = asRecord(value);
  return {
    answered: toNumberSafe(record?.answered),
    total: toNumberSafe(record?.total),
    time_used_seconds: toNumberSafe(record?.time_used_seconds)
  };
}

function normalizeAttemptResultAnswer(value: unknown): StudentMarathonAttemptResultAnswer {
  const record = asRecord(value);
  const nestedQuestion = asRecord(record?.question);
  const questionId =
    toStringSafe(record?.question)
    || toStringSafe(record?.question_id)
    || toStringSafe(nestedQuestion?.question_id)
    || toStringSafe(nestedQuestion?.id)
    || toStringSafe(nestedQuestion?.uuid);
  const questionNumber = toNumberSafe(record?.question_number ?? nestedQuestion?.question_number);
  return {
    id: toStringSafe(record?.id),
    question: questionId,
    question_number: questionNumber,
    question_text: toStringSafe(record?.question_text ?? nestedQuestion?.question_text),
    question_type: toStringSafe(record?.question_type ?? nestedQuestion?.question_type),
    student_answer_json: record?.student_answer_json ?? record?.student_answer ?? record?.answer_json ?? record?.answer ?? null,
    correct_answer_json: record?.correct_answer_json ?? record?.correct_answer ?? nestedQuestion?.correct_answer_json ?? null,
    is_correct: toBooleanSafe(record?.is_correct),
    is_skipped: toBooleanSafe(record?.is_skipped),
    is_flagged: toBooleanSafe(record?.is_flagged),
    explanation: toStringSafe(record?.explanation ?? nestedQuestion?.explanation) || null,
    answer_evidence_json:
      record?.answer_evidence_json
      ?? record?.answer_evidence
      ?? record?.evidence_json
      ?? record?.evidence
      ?? nestedQuestion?.answer_evidence_json
      ?? nestedQuestion?.answer_evidence
      ?? null
  };
}

function normalizeAttemptResult(value: unknown): StudentMarathonAttemptResult {
  const record = asRecord(value);
  return {
    id: toStringSafe(record?.id),
    status: toStringSafe(record?.status),
    score: record?.score == null ? null : toNumberSafe(record?.score),
    band_score: toStringSafe(record?.band_score) || null,
    question_type_stats_json: asRecord(record?.question_type_stats_json),
    time_used_seconds: toNumberSafe(record?.time_used_seconds),
    started_at: toStringSafe(record?.started_at) || null,
    completed_at: toStringSafe(record?.completed_at) || null,
    correct_count: toNumberSafe(record?.correct_count),
    incorrect_count: toNumberSafe(record?.incorrect_count),
    skipped_count: toNumberSafe(record?.skipped_count),
    answers: toArray(record?.answers).map(normalizeAttemptResultAnswer)
  };
}

function normalizeLeaderboardEntry(value: unknown): StudentMarathonLeaderboardEntry {
  const record = asRecord(value);
  return {
    rank: toNumberSafe(record?.rank),
    student_full_name: toStringSafe(record?.student_full_name, "Student"),
    total_score: toStringSafe(record?.total_score, "0.00"),
    current_streak: toNumberSafe(record?.current_streak),
    is_finished_marathon: toBooleanSafe(record?.is_finished_marathon),
    days_completed: toNumberSafe(record?.days_completed),
    is_self: toBooleanSafe(record?.is_self)
  };
}

function normalizePaginatedList<T>(value: unknown, normalizeItem: (item: unknown) => T): StudentPaginatedResponse<T> {
  const record = asRecord(value);
  return {
    count: toNumberSafe(record?.count),
    next: toStringSafe(record?.next) || null,
    previous: toStringSafe(record?.previous) || null,
    results: toArray(record?.results).map(normalizeItem)
  };
}

export const studentMarathonService = {
  async list(params?: StudentListQuery) {
    try {
      const response = await studentHttpClient.get("/marathons/", {params: toListQuery(params)});
      return normalizePaginatedList(response.data, normalizeMarathonItem);
    } catch (error) {
      throw toStudentApiError(error);
    }
  },

  async getById(marathonId: string) {
    try {
      const response = await studentHttpClient.get(`/marathons/${marathonId}/`);
      return normalizeMarathonDetail(response.data);
    } catch (error) {
      throw toStudentApiError(error);
    }
  },

  async enroll(marathonId: string) {
    try {
      const response = await studentHttpClient.post(`/marathons/${marathonId}/enroll/`);
      return normalizeEnrollment(response.data);
    } catch (error) {
      throw toStudentApiError(error);
    }
  },

  async getEnrollment(marathonId: string) {
    try {
      const response = await studentHttpClient.get(`/marathons/${marathonId}/enrollment/`);
      return normalizeEnrollment(response.data);
    } catch (error) {
      throw toStudentApiError(error);
    }
  },

  async listDays(marathonId: string) {
    try {
      const response = await studentHttpClient.get(`/marathons/${marathonId}/days/`);
      return toArray(response.data).map(normalizeDaySummary);
    } catch (error) {
      throw toStudentApiError(error);
    }
  },

  async getDay(marathonId: string, dayNumber: number) {
    try {
      const response = await studentHttpClient.get(`/marathons/${marathonId}/days/${dayNumber}/`);
      return normalizeDayDetail(response.data);
    } catch (error) {
      throw toStudentApiError(error);
    }
  },

  async completeDay(marathonId: string, dayNumber: number) {
    try {
      const response = await studentHttpClient.post(`/marathons/${marathonId}/days/${dayNumber}/complete/`);
      return normalizeDayCompleteResponse(response.data);
    } catch (error) {
      throw toStudentApiError(error);
    }
  },

  async getNote(marathonId: string, dayNumber: number) {
    try {
      const response = await studentHttpClient.get(`/marathons/${marathonId}/days/${dayNumber}/note/`);
      return normalizeDayNote(response.data);
    } catch (error) {
      throw toStudentApiError(error);
    }
  },

  async updateNote(marathonId: string, dayNumber: number, noteText: string) {
    try {
      const response = await studentHttpClient.patch(`/marathons/${marathonId}/days/${dayNumber}/note/`, {
        note_text: noteText
      });
      return normalizeDayNote(response.data);
    } catch (error) {
      throw toStudentApiError(error);
    }
  },

  async startAttempt(marathonId: string, dayNumber: number, payload: StudentMarathonAttemptCreatePayload) {
    try {
      const response = await studentHttpClient.post(`/marathons/${marathonId}/days/${dayNumber}/attempts/`, payload);
      return normalizeAttempt(response.data);
    } catch (error) {
      throw toStudentApiError(error);
    }
  },

  async getAttempt(marathonId: string, dayNumber: number, attemptId: string) {
    try {
      const response = await studentHttpClient.get(`/marathons/${marathonId}/days/${dayNumber}/attempts/${attemptId}/`);
      return normalizeAttempt(response.data);
    } catch (error) {
      throw toStudentApiError(error);
    }
  },

  async saveAttempt(marathonId: string, dayNumber: number, attemptId: string, payload: StudentMarathonAttemptSavePayload) {
    try {
      const response = await studentHttpClient.patch(`/marathons/${marathonId}/days/${dayNumber}/attempts/${attemptId}/save/`, payload);
      return normalizeAttemptSaveResponse(response.data);
    } catch (error) {
      throw toStudentApiError(error);
    }
  },

  async submitAttempt(marathonId: string, dayNumber: number, attemptId: string, payload?: StudentMarathonAttemptSubmitPayload) {
    try {
      const response = await studentHttpClient.post(`/marathons/${marathonId}/days/${dayNumber}/attempts/${attemptId}/submit/`, payload ?? {});
      return normalizeAttemptResult(response.data);
    } catch (error) {
      throw toStudentApiError(error);
    }
  },

  async reviewAttempt(marathonId: string, dayNumber: number, attemptId: string) {
    try {
      const response = await studentHttpClient.get(`/marathons/${marathonId}/days/${dayNumber}/attempts/${attemptId}/review/`);
      return normalizeAttemptResult(response.data);
    } catch (error) {
      throw toStudentApiError(error);
    }
  },

  async getLeaderboard(marathonId: string) {
    try {
      const response = await studentHttpClient.get(`/marathons/${marathonId}/leaderboard/`);
      return toArray(response.data).map(normalizeLeaderboardEntry);
    } catch (error) {
      throw toStudentApiError(error);
    }
  }
};
