import type {
  StudentAttemptDetail,
  StudentAttemptQuestion,
  StudentAttemptQuestionGroup,
  StudentAttemptReadingPassage,
  StudentAttemptListeningPart,
  StudentAttemptReviewGroup,
  StudentAttemptReviewPart,
  StudentAttemptReviewPassage,
  StudentAttemptReviewQuestion,
  StudentAttemptReviewResponse,
  StudentTestRecord,
} from "./types";
import type {
  StudentMarathonAttempt,
  StudentMarathonAttemptResult,
  StudentMarathonAttemptResultAnswer,
} from "./marathon.types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function toStringSafe(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
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

function extractContentRoot(
  content: Record<string, unknown> | null,
  key: "reading" | "listening",
) {
  if (!content) return null;
  if (key === "reading") {
    return (
      asRecord(content.reading_passage)
      ?? asRecord(content.passage)
      ?? (typeof content.passage_text === "string" ? content : null)
    );
  }

  return (
    asRecord(content.listening_part)
    ?? asRecord(content.part)
    ?? (typeof content.transcript_text === "string" ? content : null)
  );
}

function normalizeAttemptQuestion(value: unknown): StudentAttemptQuestion {
  const record = asRecord(value);
  const nestedQuestion = asRecord(record?.question);
  const rawId = toStringSafe(record?.id);
  const primitiveQuestionRef =
    typeof record?.question === "string" || typeof record?.question === "number"
      ? toStringSafe(record.question)
      : "";
  const canonicalQuestionId =
    toStringSafe(record?.question_id)
    || toStringSafe(nestedQuestion?.question_id)
    || toStringSafe(nestedQuestion?.id)
    || toStringSafe(nestedQuestion?.uuid)
    || primitiveQuestionRef
    || rawId;
  const attemptQuestionId =
    toStringSafe(record?.attempt_question_id)
    || toStringSafe(record?.attempt_question)
    || toStringSafe(record?.question_answer_id)
    || toStringSafe(record?.question_answer);
  const candidateQuestionIds = [
    canonicalQuestionId,
    ...asArray<string>(record?.candidate_question_ids).map((item) => toStringSafe(item)).filter(Boolean),
    attemptQuestionId,
    rawId,
  ].filter((item, index, source) => Boolean(item) && source.indexOf(item) === index);

  return {
    id: canonicalQuestionId,
    question_id: canonicalQuestionId || null,
    // Marathon save accepts canonical question_id only; keep attempt IDs as candidates, not as the primary submit key.
    attempt_question_id: null,
    candidate_question_ids: candidateQuestionIds,
    question_number: toNumberSafe(record?.question_number),
    question_text: toStringSafe(record?.question_text) || null,
    options_json: record?.options_json ?? null,
    question_type: toStringSafe(record?.question_type),
    question_type_display: toStringSafe(record?.question_type_display) || null,
    student_answer: record?.student_answer ?? null,
    is_flagged: toBooleanSafe(record?.is_flagged),
  };
}

function normalizeAttemptGroup(value: unknown): StudentAttemptQuestionGroup {
  const record = asRecord(value);
  const questions = asArray(record?.questions)
    .map(normalizeAttemptQuestion)
    .sort((left, right) => left.question_number - right.question_number);

  return {
    id: toStringSafe(record?.id),
    question_type: toStringSafe(record?.question_type),
    question_type_display: toStringSafe(record?.question_type_display) || null,
    group_order: toNumberSafe(record?.group_order),
    instructions: toStringSafe(record?.instructions),
    question_number_start: toNumberSafe(record?.question_number_start),
    question_number_end: toNumberSafe(record?.question_number_end),
    word_limit: record?.word_limit == null ? null : toNumberSafe(record?.word_limit),
    number_allowed: record?.number_allowed == null ? null : toBooleanSafe(record?.number_allowed),
    group_content_json: record?.group_content_json ?? null,
    questions,
  };
}

function normalizeAttemptReadingPassage(value: Record<string, unknown>): StudentAttemptReadingPassage {
  const groups = asArray(value.question_groups)
    .map(normalizeAttemptGroup)
    .sort((left, right) => left.group_order - right.group_order);

  return {
    id: toStringSafe(value.id),
    passage_number: toStringSafe(value.passage_number, "PASSAGE_1"),
    title: toStringSafe(value.title, "Reading passage"),
    passage_text: toStringSafe(value.passage_text),
    max_questions: toNumberSafe(value.max_questions),
    answered_count: toNumberSafe(value.answered_count),
    question_groups: groups,
  };
}

function normalizeAttemptListeningPart(value: Record<string, unknown>): StudentAttemptListeningPart {
  const groups = asArray(value.question_groups)
    .map(normalizeAttemptGroup)
    .sort((left, right) => left.group_order - right.group_order);

  return {
    id: toStringSafe(value.id),
    part_number: toStringSafe(value.part_number, "PART_1"),
    title: toStringSafe(value.title, "Listening part"),
    transcript_text: toStringSafe(value.transcript_text),
    audio_file_url: toStringSafe(value.audio_file_url) || null,
    max_questions: toNumberSafe(value.max_questions),
    answered_count: toNumberSafe(value.answered_count),
    question_groups: groups,
  };
}

function buildSyntheticTestRecord(params: {
  id: string;
  title: string;
  testType: "READING" | "LISTENING";
  totalQuestions: number;
  timeLimitSeconds: number | null;
}): StudentTestRecord {
  return {
    id: params.id,
    title: params.title,
    description: "",
    test_type: params.testType,
    test_format: null,
    type_display: params.testType === "READING" ? "Reading" : "Listening",
    difficulty_level: "INTERMEDIATE",
    difficulty_display: "Intermediate",
    practice_source: "MARATHON",
    active_for_registered_users: true,
    display_order: null,
    group_id: null,
    group_name: null,
    total_questions: params.totalQuestions,
    time_limit_seconds: params.timeLimitSeconds,
    is_premium: false,
    reading_passages: [],
    listening_parts: [],
    user_attempt_status: null,
  };
}

export function adaptMarathonReadingAttemptToDetail(
  attempt: StudentMarathonAttempt,
  routeId: string,
): { meta: StudentTestRecord; attempt: StudentAttemptDetail } | null {
  const passageRoot = extractContentRoot(attempt.content, "reading");
  if (!passageRoot) return null;

  const passage = normalizeAttemptReadingPassage(passageRoot);
  const title = passage.title || "Marathon Reading";
  const timeLimitSeconds = toNumberSafe(passageRoot.time_limit_seconds, 0) || toNumberSafe(passageRoot.estimated_time_minutes, 20) * 60;
  const meta = buildSyntheticTestRecord({
    id: routeId,
    title,
    testType: "READING",
    totalQuestions: attempt.total_questions || passage.max_questions,
    timeLimitSeconds,
  });

  return {
    meta,
    attempt: {
      id: attempt.id,
      practice_test: routeId,
      practice_test_title: title,
      scoped_reading_passage_id: attempt.reading_passage ?? passage.id,
      scoped_listening_part_id: null,
      scoped_title: title,
      test_type: "READING",
      mode: "PRACTICE",
      status: attempt.status,
      started_at: attempt.started_at,
      completed_at: attempt.completed_at,
      time_used_seconds: attempt.time_used_seconds,
      time_limit_seconds: timeLimitSeconds,
      total_questions: attempt.total_questions || passage.max_questions,
      answered_count: attempt.questions_answered,
      reading_passages: [passage],
      listening_parts: [],
      score: attempt.score,
      band_score: attempt.band_score,
    },
  };
}

export function adaptMarathonListeningAttemptToDetail(
  attempt: StudentMarathonAttempt,
  routeId: string,
): { meta: StudentTestRecord; attempt: StudentAttemptDetail } | null {
  const partRoot = extractContentRoot(attempt.content, "listening");
  if (!partRoot) return null;

  const part = normalizeAttemptListeningPart(partRoot);
  const title = part.title || "Marathon Listening";
  const timeLimitSeconds = toNumberSafe(partRoot.time_limit_seconds, 0) || toNumberSafe(partRoot.estimated_time_minutes, 30) * 60;
  const meta = buildSyntheticTestRecord({
    id: routeId,
    title,
    testType: "LISTENING",
    totalQuestions: attempt.total_questions || part.max_questions,
    timeLimitSeconds,
  });

  return {
    meta,
    attempt: {
      id: attempt.id,
      practice_test: routeId,
      practice_test_title: title,
      scoped_reading_passage_id: null,
      scoped_listening_part_id: attempt.listening_part ?? part.id,
      scoped_title: title,
      test_type: "LISTENING",
      mode: "PRACTICE",
      status: attempt.status,
      started_at: attempt.started_at,
      completed_at: attempt.completed_at,
      time_used_seconds: attempt.time_used_seconds,
      time_limit_seconds: timeLimitSeconds,
      total_questions: attempt.total_questions || part.max_questions,
      answered_count: attempt.questions_answered,
      reading_passages: [],
      listening_parts: [part],
      score: attempt.score,
      band_score: attempt.band_score,
    },
  };
}

function buildReviewAnswerMaps(answers: StudentMarathonAttemptResultAnswer[]) {
  const byQuestionId = new Map<string, StudentMarathonAttemptResultAnswer>();
  const byNumber = new Map<number, StudentMarathonAttemptResultAnswer>();

  for (const answer of answers) {
    if (answer.question) byQuestionId.set(answer.question, answer);
    if (answer.id) byQuestionId.set(answer.id, answer);
    if (answer.question_number > 0) byNumber.set(answer.question_number, answer);
  }

  return { byQuestionId, byNumber };
}

function collectReviewQuestionIds(record: Record<string, unknown> | null) {
  const nestedQuestion = asRecord(record?.question);
  const primitiveQuestionRef =
    typeof record?.question === "string" || typeof record?.question === "number"
      ? toStringSafe(record.question)
      : "";
  return [
    toStringSafe(record?.question_id),
    toStringSafe(record?.id),
    primitiveQuestionRef,
    toStringSafe(nestedQuestion?.question_id),
    toStringSafe(nestedQuestion?.id),
    toStringSafe(nestedQuestion?.uuid),
  ].filter((item, index, source) => Boolean(item) && source.indexOf(item) === index);
}

function normalizeReviewQuestion(
  value: unknown,
  answerMaps: ReturnType<typeof buildReviewAnswerMaps>,
): StudentAttemptReviewQuestion {
  const record = asRecord(value);
  const nestedQuestion = asRecord(record?.question);
  const fallbackNumber = toNumberSafe(record?.question_number ?? nestedQuestion?.question_number);
  const candidateIds = collectReviewQuestionIds(record);
  const fallbackId = candidateIds[0] ?? "";
  const answer = candidateIds.reduce<StudentMarathonAttemptResultAnswer | null>(
    (matched, id) => matched ?? answerMaps.byQuestionId.get(id) ?? null,
    null,
  ) ?? answerMaps.byNumber.get(fallbackNumber) ?? null;

  return {
    id: fallbackId,
    question_number: fallbackNumber,
    question_text: toStringSafe(record?.question_text ?? nestedQuestion?.question_text) || null,
    question_type: toStringSafe(record?.question_type ?? nestedQuestion?.question_type),
    question_type_display: toStringSafe(record?.question_type_display ?? nestedQuestion?.question_type_display) || null,
    options_json: record?.options_json ?? nestedQuestion?.options_json ?? null,
    correct_answer_json: answer?.correct_answer_json ?? record?.correct_answer_json ?? nestedQuestion?.correct_answer_json ?? null,
    student_answer: answer?.student_answer_json ?? null,
    is_correct: answer?.is_correct ?? false,
    is_skipped: answer?.is_skipped ?? false,
    is_flagged: answer?.is_flagged ?? false,
    explanation: answer?.explanation ?? (toStringSafe(record?.explanation ?? nestedQuestion?.explanation) || null),
    answer_evidence_json:
      answer?.answer_evidence_json
      ?? record?.answer_evidence_json
      ?? record?.answer_evidence
      ?? nestedQuestion?.answer_evidence_json
      ?? nestedQuestion?.answer_evidence
      ?? null,
  };
}

function normalizeReviewGroup(
  value: unknown,
  answerMaps: ReturnType<typeof buildReviewAnswerMaps>,
): StudentAttemptReviewGroup {
  const record = asRecord(value);
  const questions = asArray(record?.questions)
    .map((question) => normalizeReviewQuestion(question, answerMaps))
    .sort((left, right) => left.question_number - right.question_number);

  return {
    id: toStringSafe(record?.id),
    question_type: toStringSafe(record?.question_type),
    question_type_display: toStringSafe(record?.question_type_display) || null,
    instructions: toStringSafe(record?.instructions) || null,
    question_number_start: record?.question_number_start == null ? null : toNumberSafe(record?.question_number_start),
    question_number_end: record?.question_number_end == null ? null : toNumberSafe(record?.question_number_end),
    group_content_json: record?.group_content_json ?? null,
    questions,
  };
}

export function adaptMarathonReadingReviewResponse(params: {
  attempt: StudentMarathonAttempt;
  result: StudentMarathonAttemptResult;
  routeId: string;
}): StudentAttemptReviewResponse | null {
  const passageRoot = extractContentRoot(params.attempt.content, "reading");
  if (!passageRoot) return null;

  const answerMaps = buildReviewAnswerMaps(params.result.answers);
  const groups = asArray(passageRoot.question_groups)
    .map((group) => ({
      order: toNumberSafe(asRecord(group)?.group_order, 0),
      value: normalizeReviewGroup(group, answerMaps),
    }))
    .sort((left, right) => left.order - right.order)
    .map((entry) => entry.value);

  const passage: StudentAttemptReviewPassage = {
    id: toStringSafe(passageRoot.id),
    passage_number: toStringSafe(passageRoot.passage_number, "PASSAGE_1"),
    title: toStringSafe(passageRoot.title, "Marathon Reading"),
    passage_text: toStringSafe(passageRoot.passage_text),
    max_questions: toNumberSafe(passageRoot.max_questions, params.attempt.total_questions),
    correct_count: params.result.correct_count,
    total_count: params.attempt.total_questions,
    performance_label: null as unknown as string,
    question_groups: groups,
  };

  return {
    attempt_id: params.result.id,
    test_title: passage.title,
    test_type: "READING",
    mode: "PRACTICE",
    status: params.result.status,
    score: params.result.score,
    band_score: params.result.band_score,
    total_questions: params.attempt.total_questions,
    correct_count: params.result.correct_count,
    incorrect_count: params.result.incorrect_count,
    unanswered_count: params.result.skipped_count,
    time_used_seconds: params.result.time_used_seconds,
    question_type_stats: params.result.question_type_stats_json,
    question_type_stats_json: params.result.question_type_stats_json,
    passage_stats_json: null,
    passages: [passage],
    parts: [],
    raw: null,
  };
}

export function adaptMarathonListeningReviewResponse(params: {
  attempt: StudentMarathonAttempt;
  result: StudentMarathonAttemptResult;
  routeId: string;
}): StudentAttemptReviewResponse | null {
  const partRoot = extractContentRoot(params.attempt.content, "listening");
  if (!partRoot) return null;

  const answerMaps = buildReviewAnswerMaps(params.result.answers);
  const groups = asArray(partRoot.question_groups)
    .map((group) => ({
      order: toNumberSafe(asRecord(group)?.group_order, 0),
      value: normalizeReviewGroup(group, answerMaps),
    }))
    .sort((left, right) => left.order - right.order)
    .map((entry) => entry.value);

  const part: StudentAttemptReviewPart = {
    id: toStringSafe(partRoot.id),
    part_number: toStringSafe(partRoot.part_number, "PART_1"),
    title: toStringSafe(partRoot.title, "Marathon Listening"),
    transcript_text: toStringSafe(partRoot.transcript_text),
    audio_file_url: toStringSafe(partRoot.audio_file_url) || null,
    max_questions: toNumberSafe(partRoot.max_questions, params.attempt.total_questions),
    correct_count: params.result.correct_count,
    total_count: params.attempt.total_questions,
    performance_label: null as unknown as string,
    question_groups: groups,
  };

  return {
    attempt_id: params.result.id,
    test_title: part.title,
    test_type: "LISTENING",
    mode: "PRACTICE",
    status: params.result.status,
    score: params.result.score,
    band_score: params.result.band_score,
    total_questions: params.attempt.total_questions,
    correct_count: params.result.correct_count,
    incorrect_count: params.result.incorrect_count,
    unanswered_count: params.result.skipped_count,
    time_used_seconds: params.result.time_used_seconds,
    question_type_stats: params.result.question_type_stats_json,
    question_type_stats_json: params.result.question_type_stats_json,
    passage_stats_json: null,
    passages: [],
    parts: [part],
    raw: null,
  };
}
