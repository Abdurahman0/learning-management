import {AdminApiError} from "./types";
import type {QuestionBulkItemPayload} from "./types";

const TFNG_ANSWERS = new Set(["TRUE", "FALSE", "NOT GIVEN", "NOT_GIVEN"]);
const YNNG_ANSWERS = new Set(["YES", "NO", "NOT GIVEN", "NOT_GIVEN"]);

const COMPLETION_TYPES = new Set([
  "sentence_completion",
  "summary_completion",
  "table_completion",
  "flow_chart",
  "form_completion",
  "note_completion",
  "short_answer",
  "diagram_labeling"
]);

const MATCHING_TYPES = new Set([
  "matching_headings",
  "matching_information",
  "match_para_info",
  "matching_paragraph_info",
  "match_sent_endings",
  "matching_sentence_endings",
  "matching_features",
  "classification",
  "selecting_from_a_list",
  "list_selection",
  "choosing_title",
  "map"
]);

function normalizeQuestionType(value: string) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^\w]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function isNonEmptyArray(value: unknown) {
  return Array.isArray(value) && value.length > 0;
}

function isNonEmptyObject(value: unknown) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) && Object.keys(value as Record<string, unknown>).length > 0);
}

function hasTextAtPath(value: unknown, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return hasText(record[key]);
}

function hasValidMcqOptions(value: unknown) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  const options = record.options;
  if (!Array.isArray(options) || options.length === 0) {
    return false;
  }

  return options.some((item) => {
    if (typeof item === "string") {
      return hasText(item);
    }
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return false;
    }
    const optionRecord = item as Record<string, unknown>;
    return hasText(optionRecord.text);
  });
}

function hasValidMcqCorrectAnswer(value: unknown) {
  if (hasText(value)) return true;
  if (isNonEmptyArray(value)) return true;
  if (hasTextAtPath(value, "answer")) return true;
  return false;
}

function hasValidCompletionAnswer(value: unknown) {
  if (hasText(value)) return true;
  if (isNonEmptyArray(value)) return true;
  if (hasTextAtPath(value, "answer")) return true;

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  const answers = record.answers;
  if (!Array.isArray(answers)) return false;
  return answers.some((item) => hasText(item));
}

function resolveAnswerValue(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "";
  }
  const record = value as Record<string, unknown>;
  return String(record.answer ?? "").trim();
}

function validateOne(questionType: string, item: QuestionBulkItemPayload, index: number) {
  const label = `Question #${index + 1}`;
  const normalizedType = normalizeQuestionType(questionType);
  const prompt = item.question_text ?? item.prompt ?? "";

  if (!hasText(prompt)) {
    throw new AdminApiError(`${label}: question text is required.`, 400);
  }

  if (
    normalizedType === "multiple_choice" ||
    normalizedType === "mcq_single" ||
    normalizedType === "mcq_multiple" ||
    normalizedType === "multiple_choice_single" ||
    normalizedType === "multiple_choice_multiple"
  ) {
    if (!hasValidMcqOptions(item.options_json)) {
      throw new AdminApiError(`${label}: options_json is required for multiple choice.`, 400);
    }
    if (!hasValidMcqCorrectAnswer(item.correct_answer_json)) {
      throw new AdminApiError(`${label}: correct_answer_json is required for multiple choice.`, 400);
    }
    return;
  }

  if (normalizedType === "tfng" || normalizedType === "true_false_not_given" || normalizedType === "true_false_ng") {
    const answer = resolveAnswerValue(item.correct_answer_json).toUpperCase();
    if (!TFNG_ANSWERS.has(answer)) {
      throw new AdminApiError(`${label}: tfng answer must be TRUE/FALSE/NOT GIVEN.`, 400);
    }
    return;
  }

  if (normalizedType === "yes_no_not_given" || normalizedType === "ynng" || normalizedType === "yes_no_ng") {
    const answer = resolveAnswerValue(item.correct_answer_json).toUpperCase();
    if (!YNNG_ANSWERS.has(answer)) {
      throw new AdminApiError(`${label}: yes/no/not-given answer must be YES/NO/NOT GIVEN.`, 400);
    }
    return;
  }

  if (MATCHING_TYPES.has(normalizedType)) {
    if (normalizedType !== "matching_headings" && !isNonEmptyArray(item.options_json) && !isNonEmptyObject(item.options_json)) {
      throw new AdminApiError(`${label}: options_json is required for matching question types.`, 400);
    }
    if (!isNonEmptyObject(item.correct_answer_json) && !isNonEmptyArray(item.correct_answer_json) && !hasText(item.correct_answer_json)) {
      throw new AdminApiError(`${label}: correct_answer_json mapping is required for matching question types.`, 400);
    }
    return;
  }

  if (COMPLETION_TYPES.has(normalizedType)) {
    if (!hasValidCompletionAnswer(item.correct_answer_json)) {
      throw new AdminApiError(`${label}: completion question must include at least one correct answer.`, 400);
    }
  }
}

export function validateBulkQuestions(questionType: string, items: QuestionBulkItemPayload[]) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AdminApiError("At least one question is required.", 400);
  }

  items.forEach((item, index) => validateOne(questionType, item, index));
}
