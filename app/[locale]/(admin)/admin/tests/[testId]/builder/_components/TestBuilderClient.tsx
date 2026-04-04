"use client";

import {useEffect, useMemo, useState} from "react";
import {useTranslations} from "next-intl";

import type {AdminBuilderTest, BuilderQuestion, BuilderStructureItem, QuestionGroup, QuestionType} from "@/data/admin-test-builder";
import {
  createDefaultQuestion,
  getInitialBuilderTest,
  getStructureRange,
  hasQuestionContent,
  type BuilderMode
} from "@/data/admin-test-builder";
import {
  generateQuestionGroupsFromVariant,
  getAllowedQuestionCount,
  type ContentBankPassage,
  type ContentBankVariantSet
} from "@/data/admin/selectors";
import {AdminApiError} from "@/src/services/admin/types";
import {adminContentBankService} from "@/src/services/admin/contentBank.service";
import {listeningPartsService} from "@/src/services/admin/listeningParts.service";
import {practiceTestsService} from "@/src/services/admin/practiceTests.service";
import {questionGroupsService} from "@/src/services/admin/questionGroups.service";
import {questionsService} from "@/src/services/admin/questions.service";
import {readingPassagesService} from "@/src/services/admin/readingPassages.service";
import {variantSetsService} from "@/src/services/admin/variantSets.service";
import type {
  ListeningPartRecord,
  PracticeTestDetailRecord,
  QuestionBulkItemPayload,
  QuestionGroupPayload,
  QuestionGroupRecord,
  QuestionRecord,
  ReadingPassageRecord
} from "@/src/services/admin/types";

import {AdminSidebar, AdminSidebarMobileNav} from "../../../../_components/AdminSidebar";
import {BuilderTopbar} from "./BuilderTopbar";
import {PassageEditor} from "./PassageEditor";
import {QuestionEditorModal} from "./QuestionEditorModal";
import {QuestionGroupsPanel} from "./QuestionGroupsPanel";
import {TestStructurePanel} from "./TestStructurePanel";

type TestBuilderClientProps = {
  testId: string;
  initialStructureId?: string;
  initialMode?: string;
};

type SelectedQuestionRef = {
  groupId: string;
  questionId: string;
};

type SlotRange = {
  from: number;
  to: number;
};

function makeCopyId(value: string) {
  return `${value}-copy-${Math.random().toString(36).slice(2, 8)}`;
}

function buildGroupTitle(from: number, to: number) {
  return `Questions ${from}-${to}`;
}

function uniqueSortedNumbers(values: number[]) {
  return [...new Set(values)].sort((left, right) => left - right);
}

function getOccupiedNumbers(groups: QuestionGroup[], excludeGroupId?: string) {
  const occupied = new Set<number>();
  for (const group of groups) {
    if (excludeGroupId && group.id === excludeGroupId) continue;
    for (const question of group.questions) {
      occupied.add(question.number);
    }
  }
  return occupied;
}

function isRangeWithin(range: SlotRange, from: number, to: number) {
  return from >= range.from && to <= range.to && from <= to;
}

function isRangeFree(occupied: Set<number>, from: number, to: number) {
  for (let number = from; number <= to; number += 1) {
    if (occupied.has(number)) {
      return false;
    }
  }
  return true;
}

function normalizeGroup(group: QuestionGroup): QuestionGroup {
  const uniqueNumbers = uniqueSortedNumbers(group.questions.map((question) => question.number));
  if (!uniqueNumbers.length) {
    return group;
  }

  const questions = [...group.questions].sort((left, right) => left.number - right.number);
  const from = uniqueNumbers[0];
  const to = uniqueNumbers[uniqueNumbers.length - 1];
  return {
    ...group,
    from,
    to,
    title: buildGroupTitle(from, to),
    questions
  };
}

function findContiguousFreeRange(range: SlotRange, occupied: Set<number>, length: number) {
  if (length <= 0) return null;

  for (let start = range.from; start + length - 1 <= range.to; start += 1) {
    let hasCollision = false;
    for (let number = start; number < start + length; number += 1) {
      if (occupied.has(number)) {
        hasCollision = true;
        break;
      }
    }
    if (!hasCollision) {
      return {from: start, to: start + length - 1};
    }
  }

  return null;
}

function getBoundaryInsertNumber(group: QuestionGroup, range: SlotRange, occupiedByOthers: Set<number>) {
  const appendNumber = group.to + 1;
  if (appendNumber <= range.to && !occupiedByOthers.has(appendNumber)) {
    return appendNumber;
  }

  const prependNumber = group.from - 1;
  if (prependNumber >= range.from && !occupiedByOthers.has(prependNumber)) {
    return prependNumber;
  }

  return null;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function toStringSafe(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function toNumberSafe(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const DEFAULT_READING_SLOT_QUESTION_COUNTS = [13, 13, 14] as const;
const DEFAULT_LISTENING_SLOT_QUESTION_COUNTS = [10, 10, 10, 10] as const;

function parseStructureIndex(label: string, fallback: number) {
  const match = String(label ?? "").match(/\d+/);
  const parsed = match ? Number(match[0]) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function mapApiQuestionTypeToBuilder(value: string): QuestionType {
  const normalized = String(value ?? "").trim().toUpperCase();

  if (normalized === "TFNG") return "tfng";
  if (normalized === "YNNG") return "yes_no_not_given";
  if (normalized === "MCQ_SINGLE" || normalized === "MCQ_MULTIPLE") return "multiple_choice";
  if (normalized === "MATCHING_HEADINGS") return "matching_headings";
  if (normalized === "MATCH_PARA_INFO" || normalized === "MATCHING_INFORMATION") return "matching_information";
  if (normalized === "CLASSIFICATION" || normalized === "MATCHING_FEATURES") return "matching_features";
  if (normalized === "LIST_SELECTION" || normalized === "SELECTING_FROM_A_LIST") return "selecting_from_a_list";
  if (normalized === "PLAN_MAP_DIAGRAM") return "map";
  if (normalized === "SENTENCE_COMPLETION") return "sentence_completion";
  if (normalized === "SUMMARY_COMPLETION") return "summary_completion";
  if (normalized === "TABLE_COMPLETION") return "table_completion";
  if (normalized === "FLOW_CHART_COMPLETION" || normalized === "FLOW_CHART") return "flow_chart";
  if (normalized === "DIAGRAM_COMPLETION" || normalized === "DIAGRAM_LABELING") return "diagram_labeling";
  if (normalized === "FORM_COMPLETION") return "form_completion";
  if (normalized === "NOTE_COMPLETION") return "note_completion";
  if (normalized === "SHORT_ANSWER") return "short_answer";
  return "multiple_choice";
}

function extractVariantSetIdFromOwnerRecord(record: unknown) {
  if (!record || typeof record !== "object") {
    return "";
  }

  const root = record as Record<string, unknown>;
  const directCandidates = [root.variant_set, root.variant_set_id, root.default_variant_set, root.default_variant_set_id];

  for (const candidate of directCandidates) {
    if (candidate && typeof candidate === "object") {
      const nestedId = toStringSafe((candidate as Record<string, unknown>).id).trim();
      if (nestedId) return nestedId;
    }
    const directId = toStringSafe(candidate).trim();
    if (directId) return directId;
  }

  const variantSets = Array.isArray(root.variant_sets) ? root.variant_sets : [];
  for (const item of variantSets) {
    if (item && typeof item === "object") {
      const nestedId = toStringSafe((item as Record<string, unknown>).id).trim();
      if (nestedId) return nestedId;
      const fallback = toStringSafe((item as Record<string, unknown>).variant_set).trim();
      if (fallback) return fallback;
    }
    const directId = toStringSafe(item).trim();
    if (directId) return directId;
  }

  const groupRows = Array.isArray(root.question_groups) ? root.question_groups : [];
  for (const group of groupRows) {
    if (!group || typeof group !== "object") continue;
    const groupVariant = toStringSafe((group as Record<string, unknown>).variant_set).trim();
    if (groupVariant) return groupVariant;
  }

  return "";
}

function getDefaultInstructionsForQuestionType(type: QuestionType) {
  switch (type) {
    case "tfng":
      return "Do the following statements agree with the information given in the reading passage? Choose TRUE, FALSE or NOT GIVEN.";
    case "yes_no_not_given":
      return "Do the following statements agree with the views of the writer? Choose YES, NO or NOT GIVEN.";
    case "multiple_choice":
      return "Choose the correct letter, A, B or C.";
    case "selecting_from_a_list":
      return "Choose the correct answers from the list below.";
    case "matching_headings":
      return "Choose the correct heading for each section from the list of headings below.";
    case "matching_information":
      return "Which paragraph contains the following information?";
    case "matching_features":
      return "Match each statement with the correct option.";
    case "sentence_completion":
      return "Complete the sentences below.";
    case "summary_completion":
      return "Complete the summary below.";
    case "table_completion":
      return "Complete the table below.";
    case "flow_chart":
      return "Complete the flow chart below.";
    case "map":
      return "Label the map below.";
    case "form_completion":
      return "Complete the form below.";
    case "note_completion":
      return "Complete the notes below.";
    case "short_answer":
      return "Answer the questions below.";
    default:
      return "Follow the instructions and answer all questions.";
  }
}

function resolveInstructionsForSubmit(type: QuestionType, instructions: string) {
  return instructions.length > 0 ? instructions : getDefaultInstructionsForQuestionType(type);
}

function toRoman(index: number) {
  const romans = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];
  return romans[index] ?? `h${index + 1}`;
}

function toOptionKey(index: number) {
  return String.fromCharCode("A".charCodeAt(0) + index);
}

function buildTemplateText(from: number, to: number) {
  const lines: string[] = [];
  for (let number = from; number <= to; number += 1) {
    lines.push(`Item ${number}: {${number}}`);
  }
  return lines.join("\n");
}

function buildDefaultGroupContentJson(type: QuestionType, from: number, to: number): unknown {
  switch (type) {
    case "form_completion":
    case "note_completion":
      return {template_text: buildTemplateText(from, to)};
    case "summary_completion": {
      const blanks = Array.from({length: Math.max(1, to - from + 1)}, (_, index) => `{${from + index}}`).join(" ");
      return {summary_text: `Summary: ${blanks}`.trim(), word_bank: null};
    }
    case "table_completion":
      return {
        columns: ["Field", "Value"],
        rows: Array.from({length: Math.max(1, to - from + 1)}, (_, index) => [`Item ${from + index}`, `{${from + index}}`])
      };
    case "flow_chart":
      return {
        steps: Array.from({length: Math.max(1, to - from + 1)}, (_, index) => ({
          order: index + 1,
          text: `Step ${index + 1}: {${from + index}}`
        }))
      };
    case "map":
      return {
        image: "/media/diagrams/placeholder-map.png",
        labels: Array.from({length: Math.max(1, Math.min(6, to - from + 1))}, (_, index) => ({
          key: toOptionKey(index),
          text: `Label ${toOptionKey(index)}`
        }))
      };
    case "matching_headings":
      return {
        headings: Array.from({length: 5}, (_, index) => ({
          key: toRoman(index),
          text: `Heading ${index + 1}`
        }))
      };
    case "matching_features":
      return {
        categories: [
          {key: "A", label: "Category A"},
          {key: "B", label: "Category B"},
          {key: "C", label: "Category C"}
        ]
      };
    case "selecting_from_a_list":
      return {
        options: Array.from({length: 5}, (_, index) => ({
          key: toOptionKey(index),
          text: `Option ${toOptionKey(index)}`
        }))
      };
    default:
      return null;
  }
}

function resolveGroupContentForSync(group: QuestionGroup): unknown {
  const current = group.groupContentJson;
  if (current && typeof current === "object" && !Array.isArray(current) && Object.keys(current as Record<string, unknown>).length > 0) {
    return current;
  }

  const fallback = buildDefaultGroupContentJson(group.type, group.from, group.to);
  return fallback ?? null;
}

function mapBuilderQuestionTypeToApi(value: QuestionType, questionCount: number) {
  if (value === "multiple_choice") {
    return questionCount > 1 ? "MCQ_MULTIPLE" : "MCQ_SINGLE";
  }

  const mapping: Record<QuestionType, string> = {
    tfng: "TFNG",
    yes_no_not_given: "YNNG",
    multiple_choice: "MCQ_SINGLE",
    selecting_from_a_list: "LIST_SELECTION",
    matching_headings: "MATCHING_HEADINGS",
    matching_features: "CLASSIFICATION",
    sentence_completion: "SENTENCE_COMPLETION",
    summary_completion: "SUMMARY_COMPLETION",
    table_completion: "TABLE_COMPLETION",
    flow_chart: "FLOW_CHART_COMPLETION",
    map: "PLAN_MAP_DIAGRAM",
    diagram_labeling: "DIAGRAM_COMPLETION",
    form_completion: "FORM_COMPLETION",
    note_completion: "NOTE_COMPLETION",
    matching_information: "MATCH_PARA_INFO",
    short_answer: "SHORT_ANSWER"
  };

  return mapping[value] ?? String(value).toUpperCase();
}

function normalizeChoiceToken(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "_");
}

function toTextAnswers(question: BuilderQuestion) {
  const answerCandidates: string[] = [];

  if (Array.isArray((question as {correctAnswer?: unknown}).correctAnswer)) {
    const values = (question as {correctAnswer: unknown[]}).correctAnswer;
    for (const value of values) {
      const normalized = toStringSafe(value).trim();
      if (normalized) {
        answerCandidates.push(normalized);
      }
    }
  } else {
    const normalized = toStringSafe((question as {correctAnswer?: unknown}).correctAnswer).trim();
    if (normalized) {
      answerCandidates.push(normalized);
    }
  }

  const extras = Array.isArray((question as {acceptableAnswers?: unknown}).acceptableAnswers)
    ? ((question as {acceptableAnswers: unknown[]}).acceptableAnswers ?? [])
    : [];

  for (const value of extras) {
    const normalized = toStringSafe(value).trim();
    if (normalized) {
      answerCandidates.push(normalized);
    }
  }

  const unique = [...new Set(answerCandidates)];
  return {
    answer: unique[0] ?? "",
    alternatives: unique.slice(1)
  };
}

function ensureAlternativeAnswers(answer: string, alternatives: string[]) {
  const cleaned = [...new Set(alternatives.map((item) => item.trim()).filter(Boolean))];
  if (cleaned.length > 0) {
    return cleaned;
  }

  const normalizedAnswer = answer.trim();
  return normalizedAnswer ? [normalizedAnswer] : [];
}

function isQuestionReadyForSync(question: BuilderQuestion) {
  const prompt = question.prompt.trim();

  if (question.type === "tfng" || question.type === "yes_no_not_given") {
    return Boolean(prompt) && Boolean((question.correctAnswer ?? "").trim());
  }

  if (question.type === "multiple_choice") {
    return Boolean(prompt) && question.options.some((option) => option.trim().length > 0) && Boolean(question.correctAnswer.trim());
  }

  if (question.type === "matching_headings") {
    return Boolean(prompt) && Boolean(question.correctAnswer.trim());
  }

  if (
    question.type === "matching_information" ||
    question.type === "matching_features" ||
    question.type === "selecting_from_a_list" ||
    question.type === "map"
  ) {
    const mapped = Object.values(question.correctAnswer).find((value) => String(value ?? "").trim().length > 0);
    return Boolean(prompt) && Boolean(mapped);
  }

  if (
    question.type === "sentence_completion" ||
    question.type === "summary_completion" ||
    question.type === "table_completion" ||
    question.type === "flow_chart" ||
    question.type === "diagram_labeling" ||
    question.type === "form_completion" ||
    question.type === "note_completion" ||
    question.type === "short_answer"
  ) {
    const answers = toTextAnswers(question);
    return Boolean(prompt) && Boolean(answers.answer);
  }

  return false;
}

function mapBuilderQuestionToBulkPayload(question: BuilderQuestion, apiType: string, order: number): QuestionBulkItemPayload {
  const prompt = question.prompt.trim() || `Question ${question.number}`;
  const explanation = (question.explanation ?? "").trim();
  const evidence = (question.evidence ?? question.evidenceText ?? "").trim();

  const base: QuestionBulkItemPayload = {
    question_number: question.number,
    question_order: order,
    question_text: prompt,
    prompt,
    explanation: explanation || undefined,
    evidence_text: evidence || undefined,
    answer_evidence_json: evidence ? {text_snippet: evidence} : undefined,
    is_active: true
  };

  if (question.type === "tfng") {
    return {
      ...base,
      options_json: {statement: prompt},
      correct_answer_json: {answer: normalizeChoiceToken(question.correctAnswer)}
    };
  }

  if (question.type === "yes_no_not_given") {
    return {
      ...base,
      options_json: {statement: prompt},
      correct_answer_json: {answer: normalizeChoiceToken(question.correctAnswer)}
    };
  }

  if (question.type === "multiple_choice") {
    const optionRows = question.options
      .map((text, index) => ({key: toOptionKey(index), text: text.trim()}))
      .filter((item) => item.text.length > 0);
    const normalizedAnswer = question.correctAnswer.trim().toUpperCase();
    return {
      ...base,
      options_json: {options: optionRows},
      correct_answer_json: apiType === "MCQ_MULTIPLE" ? {answers: normalizedAnswer ? [normalizedAnswer] : []} : {answer: normalizedAnswer}
    };
  }

  if (question.type === "matching_headings") {
    return {
      ...base,
      options_json: null,
      correct_answer_json: {answer: question.correctAnswer.trim()}
    };
  }

  if (
    question.type === "matching_information" ||
    question.type === "matching_features" ||
    question.type === "selecting_from_a_list" ||
    question.type === "map"
  ) {
    const mappedAnswer =
      question.correctAnswer[prompt]
      ?? Object.values(question.correctAnswer).find((value) => String(value ?? "").trim().length > 0)
      ?? "";

    return {
      ...base,
      options_json: {statement: prompt},
      correct_answer_json: {answer: String(mappedAnswer).trim()}
    };
  }

  if (question.type === "sentence_completion") {
    const answers = toTextAnswers(question);
    return {
      ...base,
      options_json: {sentence_stem: prompt},
      correct_answer_json: {
        answer: answers.answer,
        alternative_answers: ensureAlternativeAnswers(answers.answer, answers.alternatives)
      }
    };
  }

  if (
    question.type === "summary_completion" ||
    question.type === "table_completion" ||
    question.type === "flow_chart" ||
    question.type === "diagram_labeling" ||
    question.type === "form_completion" ||
    question.type === "note_completion" ||
    question.type === "short_answer"
  ) {
    const answers = toTextAnswers(question);
    return {
      ...base,
      options_json: null,
      correct_answer_json: {
        answer: answers.answer,
        alternative_answers: ensureAlternativeAnswers(answers.answer, answers.alternatives)
      }
    };
  }

  return {
    ...base,
    options_json: null,
    correct_answer_json: null
  };
}

function toVariantStatus(value: unknown): ContentBankVariantSet["status"] {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized === "PUBLISHED") return "published";
  if (normalized === "USED") return "used";
  return "draft";
}

function buildVariantSummary(groups: Array<{type: QuestionType; count: number}>) {
  return groups.map((group) => `${group.type} x${group.count}`).join(" • ");
}

function isVariantCompatibleWithSlot(variant: ContentBankVariantSet, module: "reading" | "listening", slotIndex: number) {
  if (variant.module !== module) {
    return false;
  }
  const total = variant.groups.reduce((sum, group) => sum + Math.max(0, Number(group.count) || 0), 0);
  return total === getAllowedQuestionCount(module, slotIndex);
}

function extractOptions(raw: unknown): string[] {
  const record = asRecord(raw);
  const options = Array.isArray(record.options) ? record.options : [];
  const mapped = options
    .map((item) => {
      if (typeof item === "string") return item;
      const optionRecord = asRecord(item);
      return toStringSafe(optionRecord.text ?? optionRecord.label ?? optionRecord.value);
    })
    .map((item) => item.trim())
    .filter(Boolean);

  if (mapped.length) {
    return mapped.slice(0, 4);
  }

  const direct = toStringSafe(record.statement).trim();
  return direct ? [direct] : [];
}

function extractAnswerValue(raw: unknown) {
  const record = asRecord(raw);
  const answer = record.answer;
  const answers = Array.isArray(record.answers) ? record.answers : [];
  const alternatives = Array.isArray(record.alternative_answers) ? record.alternative_answers : [];

  return {
    answer: toStringSafe(answer),
    answers: answers.map((item) => toStringSafe(item)).filter(Boolean),
    alternatives: alternatives.map((item) => toStringSafe(item)).filter(Boolean)
  };
}

function mapApiQuestionToBuilderQuestion(
  type: QuestionType,
  question: QuestionRecord,
  group: QuestionGroupRecord,
  fallbackNumber: number
): BuilderQuestion {
  const questionNumber = toNumberSafe(question.question_number, fallbackNumber);
  const basePrompt =
    toStringSafe(question.prompt).trim()
    || toStringSafe(question.question_text).trim()
    || toStringSafe(asRecord(question.options_json).statement).trim();
  const evidenceFromJson = toStringSafe(asRecord(question.answer_evidence_json).text_snippet).trim();
  const evidence = toStringSafe(question.evidence_text).trim() || evidenceFromJson;
  const answer = extractAnswerValue(question.correct_answer_json);

  const builderQuestion = createDefaultQuestion(type, questionNumber);
  builderQuestion.prompt = basePrompt;
  builderQuestion.explanation = toStringSafe(question.explanation).trim();
  builderQuestion.evidence = evidence;
  builderQuestion.evidenceText = evidence;

  if (builderQuestion.type === "tfng") {
    const normalized = answer.answer.toUpperCase().replace(/_/g, " ");
    builderQuestion.correctAnswer = normalized === "TRUE" || normalized === "FALSE" || normalized === "NOT GIVEN" ? normalized : "";
    return builderQuestion;
  }

  if (builderQuestion.type === "yes_no_not_given") {
    const normalized = answer.answer.toUpperCase().replace(/_/g, " ");
    builderQuestion.correctAnswer = normalized === "YES" || normalized === "NO" || normalized === "NOT GIVEN" ? normalized : "";
    return builderQuestion;
  }

  if (builderQuestion.type === "multiple_choice") {
    const options = extractOptions(question.options_json);
    if (options.length) {
      builderQuestion.options = [...options, ...Array.from({length: Math.max(0, 4 - options.length)}, () => "")].slice(0, 4);
    }
    const normalizedAnswer = answer.answer.toUpperCase();
    builderQuestion.correctAnswer = normalizedAnswer === "A" || normalizedAnswer === "B" || normalizedAnswer === "C" || normalizedAnswer === "D" ? normalizedAnswer : "";
    return builderQuestion;
  }

  if (builderQuestion.type === "matching_headings") {
    const groupContent = asRecord(group.group_content_json);
    const headings = Array.isArray(groupContent.headings) ? groupContent.headings : [];
    builderQuestion.headings = headings
      .map((item) => {
        if (typeof item === "string") return item;
        return toStringSafe(asRecord(item).text ?? asRecord(item).label);
      })
      .map((item) => item.trim())
      .filter(Boolean);
    builderQuestion.correctAnswer = answer.answer;
    return builderQuestion;
  }

  if (
    builderQuestion.type === "matching_information"
    || builderQuestion.type === "matching_features"
    || builderQuestion.type === "selecting_from_a_list"
    || builderQuestion.type === "map"
  ) {
    const prompt = basePrompt || `Item ${questionNumber}`;
    builderQuestion.items = [prompt];
    const groupContent = asRecord(group.group_content_json);
    const optionRows = Array.isArray(groupContent.options)
      ? groupContent.options
      : Array.isArray(groupContent.labels)
        ? groupContent.labels
        : Array.isArray(groupContent.categories)
          ? groupContent.categories
          : [];
    builderQuestion.choices = optionRows
      .map((item) => {
        if (typeof item === "string") return item;
        const itemRecord = asRecord(item);
        return toStringSafe(itemRecord.key ?? itemRecord.label ?? itemRecord.text);
      })
      .map((item) => item.trim())
      .filter(Boolean);

    const initialChoice = answer.answer.trim();
    builderQuestion.correctAnswer = {[prompt]: initialChoice};
    return builderQuestion;
  }

  if (
    builderQuestion.type === "sentence_completion"
    || builderQuestion.type === "summary_completion"
    || builderQuestion.type === "table_completion"
    || builderQuestion.type === "flow_chart"
    || builderQuestion.type === "diagram_labeling"
    || builderQuestion.type === "form_completion"
    || builderQuestion.type === "note_completion"
    || builderQuestion.type === "short_answer"
  ) {
    const values = [answer.answer, ...answer.answers, ...answer.alternatives].filter(Boolean);
    builderQuestion.correctAnswer = values.length > 1 ? values : values[0] ?? "";
    builderQuestion.acceptableAnswers = answer.alternatives;
    return builderQuestion;
  }

  return builderQuestion;
}

function mapApiQuestionGroupToBuilderGroup(group: QuestionGroupRecord, fallbackIndex: number): QuestionGroup {
  const from = toNumberSafe(group.question_number_start, fallbackIndex);
  const to = toNumberSafe(group.question_number_end, from);
  const type = mapApiQuestionTypeToBuilder(toStringSafe(group.question_type));
  const sourceQuestions = Array.isArray(group.questions) ? group.questions : [];

  const questions = sourceQuestions.length
    ? sourceQuestions.map((question, index) => mapApiQuestionToBuilderQuestion(type, question, group, from + index))
    : Array.from({length: Math.max(0, to - from + 1)}, (_, index) => createDefaultQuestion(type, from + index));

  return normalizeGroup({
    id: toStringSafe(group.id, `${type}-${from}-${to}`),
    title: buildGroupTitle(from, to),
    type,
    from,
    to,
    questions,
    variantSetId: toStringSafe(group.variant_set ?? ""),
    instructions: toStringSafe(group.instructions ?? ""),
    groupContentJson: group.group_content_json ?? null
  });
}

async function ensureBackendStructuresForTest(testId: string, detail: PracticeTestDetailRecord) {
  const moduleType: "reading" | "listening" = String(detail.test_type ?? "").toUpperCase().includes("LISTENING") ? "listening" : "reading";
  const expectedCounts = moduleType === "reading" ? [...DEFAULT_READING_SLOT_QUESTION_COUNTS] : [...DEFAULT_LISTENING_SLOT_QUESTION_COUNTS];
  const existingRows = moduleType === "reading" ? [...(detail.reading_passages ?? [])] : [...(detail.listening_parts ?? [])];

  const usedSlots = new Set<number>();
  for (const row of existingRows) {
      const index = parseStructureIndex(
      moduleType === "reading" ? toStringSafe((row as ReadingPassageRecord).passage_number) : toStringSafe((row as ListeningPartRecord).part_number),
      0
    );
    if (index >= 1 && index <= expectedCounts.length) {
      usedSlots.add(index);
    }
  }

  let createdAny = false;
  for (let slot = 1; slot <= expectedCounts.length; slot += 1) {
    if (usedSlots.has(slot)) {
      continue;
    }

    if (moduleType === "reading") {
      await readingPassagesService.create(testId, {
        passage_number: `PASSAGE_${slot}`,
        title: `Passage ${slot}`,
        passage_text: " ",
        max_questions: expectedCounts[slot - 1] ?? 13,
        time_limit_seconds: 1200,
        is_active: true
      });
    } else {
      await listeningPartsService.create(testId, {
        part_number: `PART_${slot}`,
        title: `Section ${slot}`,
        transcript_text: " ",
        max_questions: expectedCounts[slot - 1] ?? 10,
        time_limit_seconds: 600,
        is_active: true,
        audio_file: null
      });
    }
    createdAny = true;
  }

  if (!createdAny) {
    return detail;
  }

  return practiceTestsService.getById(testId);
}

function mapPracticeTestDetailToBuilder(testId: string, detail: PracticeTestDetailRecord): AdminBuilderTest {
  const moduleType: "reading" | "listening" = String(detail.test_type ?? "").toUpperCase().includes("LISTENING") ? "listening" : "reading";

  const structures: BuilderStructureItem[] = [];
  const questionGroupsByStructure: Record<string, QuestionGroup[]> = {};

  let cursor = 1;

  if (moduleType === "reading") {
    const passages = [...(detail.reading_passages ?? [])].sort(
      (left, right) => parseStructureIndex(String(left.passage_number ?? ""), 0) - parseStructureIndex(String(right.passage_number ?? ""), 0)
    );

    passages.forEach((passage, index) => {
      const count = Math.max(1, toNumberSafe(passage.max_questions, 13));
      const from = cursor;
      const to = cursor + count - 1;
      cursor = to + 1;

      const structureId = toStringSafe(passage.id, `passage-${index + 1}`);
      const linkedVariantSetId = extractVariantSetIdFromOwnerRecord(passage);
      structures.push({
        id: structureId,
        index: index + 1,
        kind: "passage",
        title: toStringSafe(passage.title, `Passage ${index + 1}`),
        questionRangeLabel: `Q${from}-${to}`,
        content: [toStringSafe(passage.passage_text).trim() || " "],
        linkedPassageId: undefined,
        linkedVariantSetId: linkedVariantSetId || undefined
      });

      const groups = Array.isArray(passage.question_groups)
        ? passage.question_groups.map((group, groupIndex) => mapApiQuestionGroupToBuilderGroup(group, from + groupIndex))
        : [];
      questionGroupsByStructure[structureId] = groups;
    });
  } else {
    const parts = [...(detail.listening_parts ?? [])].sort(
      (left, right) => parseStructureIndex(String(left.part_number ?? ""), 0) - parseStructureIndex(String(right.part_number ?? ""), 0)
    );

    parts.forEach((part, index) => {
      const count = Math.max(1, toNumberSafe(part.max_questions, 10));
      const from = cursor;
      const to = cursor + count - 1;
      cursor = to + 1;

      const structureId = toStringSafe(part.id, `part-${index + 1}`);
      const linkedVariantSetId = extractVariantSetIdFromOwnerRecord(part);
      structures.push({
        id: structureId,
        index: index + 1,
        kind: "section",
        title: toStringSafe(part.title, `Section ${index + 1}`),
        questionRangeLabel: `Q${from}-${to}`,
        content: [toStringSafe(part.transcript_text).trim() || " "],
        audioLabel: toStringSafe(part.audio_url ?? part.audio_file ?? ""),
        linkedPassageId: undefined,
        linkedVariantSetId: linkedVariantSetId || undefined
      });

      const groups = Array.isArray(part.question_groups)
        ? part.question_groups.map((group, groupIndex) => mapApiQuestionGroupToBuilderGroup(group, from + groupIndex))
        : [];
      questionGroupsByStructure[structureId] = groups;
    });
  }

  if (!structures.length) {
    return getInitialBuilderTest(testId);
  }

  return {
    id: toStringSafe(detail.id, testId),
    name: toStringSafe(detail.title, "Practice Test"),
    book: toStringSafe(detail.title, "Practice Test"),
    module: moduleType,
    status: detail.is_active ? "published" : "draft",
    structures,
    questionGroupsByStructure
  };
}

export function TestBuilderClient({testId, initialStructureId, initialMode}: TestBuilderClientProps) {
  const t = useTranslations("adminTestBuilder");
  const [test, setTest] = useState(() => getInitialBuilderTest(testId));
  const [mode, setMode] = useState<BuilderMode>(() => (initialMode === "preview" ? "preview" : "editor"));
  const [activeStructureId, setActiveStructureId] = useState(() => {
    const initialTest = getInitialBuilderTest(testId);
    if (initialStructureId && initialTest.structures.some((item) => item.id === initialStructureId)) {
      return initialStructureId;
    }
    return initialTest.structures[0]?.id ?? "";
  });
  const [selectedQuestion, setSelectedQuestion] = useState<SelectedQuestionRef | null>(null);
  const [questionEditorOpen, setQuestionEditorOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [contentBankPassages, setContentBankPassages] = useState<ContentBankPassage[]>([]);
  const [contentBankVariants, setContentBankVariants] = useState<ContentBankVariantSet[]>([]);
  const [isPersisting, setIsPersisting] = useState(false);
  const [apiNotice, setApiNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadTest = async () => {
      try {
        const response = await ensureBackendStructuresForTest(testId, await practiceTestsService.getById(testId));
        if (!active) return;

        const mapped = mapPracticeTestDetailToBuilder(testId, response);
        setTest(mapped);
        setActiveStructureId(() => {
          if (initialStructureId && mapped.structures.some((item) => item.id === initialStructureId)) {
            return initialStructureId;
          }
          return mapped.structures[0]?.id ?? "";
        });

        try {
          const [passageRows, variantRows] = await Promise.all([
            adminContentBankService.listPassages(),
            variantSetsService.listAll({
              module: mapped.module === "listening" ? "LISTENING" : "READING",
              is_active: true,
              ordering: "-created_at"
            })
          ]);
          if (!active) return;

          const passages: ContentBankPassage[] = passageRows
            .filter((row) => row.module === mapped.module)
            .map((row) => ({
              id: row.id,
              title: row.title,
              module: row.module,
              wordCount: row.wordCount,
              durationMinutes: row.durationMinutes,
              difficulty: row.difficulty,
              topic: row.topic,
              source: row.source,
              previewText: row.previewText,
              fullText: row.fullText,
              estimatedTimeLabel: row.estimatedTimeLabel,
              createdAt: row.createdAt,
              linkedStructureIds: [...(row.linkedStructureIds ?? [])],
              linkedTestIds: [...(row.linkedTestIds ?? [])],
              usedInTestIds: [...(row.usedInTestIds ?? [])],
              variantIds: [...(row.variantIds ?? [])],
              variantCount: row.variantCount ?? 0,
              usageAttempts: row.usageAttempts ?? 0,
              difficultyAccuracy: row.difficultyAccuracy,
              averageBandScore: row.averageBandScore
            }));

          const passagesById = new Map(passages.map((row) => [row.id, row]));

          const variantsResolved = await Promise.all(
            variantRows.map(async (row) => {
              const variantId = toStringSafe(row.id);
              const ownerId = toStringSafe(row.reading_passage ?? row.listening_part);
              if (!variantId || !ownerId) {
                return null;
              }

              const passage = passagesById.get(ownerId);
              if (!passage) {
                return null;
              }

              let groupRows: QuestionGroupRecord[] = [];
              try {
                const listed = await questionGroupsService.list({
                  variant_set: row.id,
                  page: 1,
                  pageSize: 200,
                  ordering: "group_order"
                });
                groupRows = listed.results;
              } catch {
                groupRows = [];
              }

              const groups = groupRows.map((group, index) => ({
                id: `${variantId}-group-${index + 1}`,
                type: mapApiQuestionTypeToBuilder(toStringSafe(group.question_type)),
                count: Math.max(1, toNumberSafe(group.question_number_end) - toNumberSafe(group.question_number_start) + 1)
              }));

              const questionTypeKeys = [...new Set(groups.map((group) => group.type))];
              const usedInTestIds = Array.isArray(row.used_in_tests)
                ? row.used_in_tests.map((item) => toStringSafe(item)).filter(Boolean)
                : [];

              return {
                id: variantId,
                passageId: ownerId,
                passageTitle: passage.title,
                module: passage.module,
                name: toStringSafe(row.name, "Variant Set A"),
                status: toVariantStatus(row.status),
                maxQuestionTypes: 6,
                groups,
                questionTypesSummary: groups.length ? buildVariantSummary(groups) : "",
                questionTypeKeys,
                questionSignature: groups.map((group) => `${group.type}:${group.count}`).join("|"),
                usedInTestIds,
                usedInTests: [],
                createdAt: toStringSafe(row.created_at, new Date().toISOString())
              } satisfies ContentBankVariantSet;
            })
          );
          if (!active) return;

          const normalizedVariants: ContentBankVariantSet[] = [];
          for (const row of variantsResolved) {
            if (row) {
              normalizedVariants.push(row);
            }
          }

          setContentBankPassages(passages);
          setContentBankVariants(normalizedVariants);
        } catch {
          if (!active) return;
          setContentBankPassages([]);
          setContentBankVariants([]);
        }

        setApiNotice(null);
      } catch (error) {
        if (!active) return;
        const message = error instanceof AdminApiError ? error.message : t("validation.genericError");
        setApiNotice(message);
        setContentBankPassages([]);
        setContentBankVariants([]);
      }
    };

    void loadTest();

    return () => {
      active = false;
    };
  }, [initialStructureId, t, testId]);

  const activeStructure = useMemo(() => {
    return test.structures.find((item) => item.id === activeStructureId) ?? test.structures[0];
  }, [activeStructureId, test.structures]);

  const activeGroups = useMemo(() => {
    if (!activeStructure) {
      return [];
    }
    return test.questionGroupsByStructure[activeStructure.id] ?? [];
  }, [activeStructure, test.questionGroupsByStructure]);

  const selectedQuestionData = useMemo(() => {
    if (!selectedQuestion) {
      return null;
    }
    const group = activeGroups.find((item) => item.id === selectedQuestion.groupId);
    const question = group?.questions.find((item) => item.id === selectedQuestion.questionId);
    if (!group || !question) {
      return null;
    }
    return {group, question};
  }, [activeGroups, selectedQuestion]);

  const availableContentBankPassages = useMemo<ContentBankPassage[]>(() => {
    if (!activeStructure) return [];
    const assignedInOtherSlots = new Set(
      test.structures
        .filter((structure) => structure.id !== activeStructure.id)
        .map((structure) => structure.linkedPassageId)
        .filter((passageId): passageId is string => Boolean(passageId))
    );

    return contentBankPassages
      .filter((passage) => passage.module === test.module)
      .filter((passage) => {
        if (passage.id === activeStructure.linkedPassageId) {
          return true;
        }
        return !assignedInOtherSlots.has(passage.id);
      });
  }, [activeStructure, contentBankPassages, test.module, test.structures]);

  const passageVariantSets = useMemo<ContentBankVariantSet[]>(() => {
    if (!activeStructure?.linkedPassageId) return [];
    return contentBankVariants.filter(
      (variant) => variant.passageId === activeStructure.linkedPassageId && variant.module === test.module
    );
  }, [activeStructure, contentBankVariants, test.module]);

  const availableVariantSets = useMemo<ContentBankVariantSet[]>(() => {
    if (!activeStructure?.linkedPassageId) return [];
    return contentBankVariants.filter(
      (variant) =>
        variant.passageId === activeStructure.linkedPassageId
        && isVariantCompatibleWithSlot(variant, test.module, activeStructure.index)
    );
  }, [activeStructure, contentBankVariants, test.module]);

  const selectedVariantSet = useMemo(() => {
    if (!activeStructure?.linkedVariantSetId) return null;
    return availableVariantSets.find((variant) => variant.id === activeStructure.linkedVariantSetId) ?? null;
  }, [activeStructure, availableVariantSets]);

  const slotRequiredQuestions = useMemo(() => {
    if (!activeStructure) return 0;
    return getAllowedQuestionCount(test.module, activeStructure.index);
  }, [activeStructure, test.module]);

  const structureQuestionProgress = useMemo(() => {
    return test.structures.map((structure) => {
      const range = getStructureRange(structure);
      const required = range.to - range.from + 1;
      const groups = test.questionGroupsByStructure[structure.id] ?? [];
      const assignedSet = new Set<number>();
      let inRangeEntries = 0;
      let outOfRangeEntries = 0;

      for (const group of groups) {
        for (const question of group.questions) {
          if (question.number >= range.from && question.number <= range.to) {
            inRangeEntries += 1;
            assignedSet.add(question.number);
          } else {
            outOfRangeEntries += 1;
          }
        }
      }

      const assigned = assignedSet.size;
      const hasOverlap = inRangeEntries !== assigned;
      return {
        structureId: structure.id,
        structureIndex: structure.index,
        structureKind: structure.kind,
        assigned,
        required,
        entryCount: inRangeEntries,
        hasOverlap,
        outOfRangeEntries,
        complete: assigned === required && !hasOverlap && outOfRangeEntries === 0
      };
    });
  }, [test.questionGroupsByStructure, test.structures]);

  const questionProgressByStructureId = useMemo(() => {
    return structureQuestionProgress.reduce<Record<string, {assigned: number; required: number; complete: boolean}>>((accumulator, item) => {
      accumulator[item.structureId] = {
        assigned: item.assigned,
        required: item.required,
        complete: item.complete
      };
      return accumulator;
    }, {});
  }, [structureQuestionProgress]);

  const totalAssignedQuestions = useMemo(
    () => structureQuestionProgress.reduce((sum, item) => sum + item.assigned, 0),
    [structureQuestionProgress]
  );

  const totalRequiredQuestions = useMemo(
    () => structureQuestionProgress.reduce((sum, item) => sum + item.required, 0),
    [structureQuestionProgress]
  );

  const canPublishByQuestionCount = useMemo(() => {
    return totalAssignedQuestions === totalRequiredQuestions && structureQuestionProgress.every((item) => item.complete);
  }, [structureQuestionProgress, totalAssignedQuestions, totalRequiredQuestions]);

  const selectedQuestionLabel = selectedQuestionData ? t("questions.questionNumber", {number: selectedQuestionData.question.number}) : null;

  const updateGroupsForActiveStructure = (updater: (groups: QuestionGroup[]) => QuestionGroup[]) => {
    if (!activeStructure) {
      return;
    }

    setTest((current) => {
      const currentGroups = current.questionGroupsByStructure[activeStructure.id] ?? [];
      const nextGroups = updater(currentGroups);

      return {
        ...current,
        questionGroupsByStructure: {
          ...current.questionGroupsByStructure,
          [activeStructure.id]: nextGroups
        }
      };
    });
  };

  const updateQuestion = (groupId: string, questionId: string, updater: (question: BuilderQuestion) => BuilderQuestion) => {
    updateGroupsForActiveStructure((groups) =>
      groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              questions: group.questions.map((question) => (question.id === questionId ? updater(question) : question))
            }
          : group
      )
    );
  };

  const updateActiveStructure = (updater: (structure: typeof test.structures[number]) => typeof test.structures[number]) => {
    if (!activeStructure) return;

    setTest((current) => ({
      ...current,
      structures: current.structures.map((structure) => (structure.id === activeStructure.id ? updater(structure) : structure))
    }));
  };

  const handleCreateGroup = async (type: QuestionType, from: number, to: number, instructions: string) => {
    if (!activeStructure || isPersisting) {
      return;
    }

    const range = getStructureRange(activeStructure);
    if (!isRangeWithin(range, from, to)) {
      return;
    }

    const occupied = getOccupiedNumbers(activeGroups);
    if (!isRangeFree(occupied, from, to)) {
      return;
    }

    setIsPersisting(true);
    setApiNotice(null);

    try {
      const parentPayload =
        test.module === "listening"
          ? ({listening_part: activeStructure.id} satisfies Pick<QuestionGroupPayload, "listening_part">)
          : ({reading_passage: activeStructure.id} satisfies Pick<QuestionGroupPayload, "reading_passage">);

      const payload: QuestionGroupPayload = {
        question_type: type,
        group_order: activeGroups.length + 1,
        instructions: resolveInstructionsForSubmit(type, instructions),
        question_number_start: from,
        question_number_end: to,
        word_limit: null,
        number_allowed: false,
        group_content_json: buildDefaultGroupContentJson(type, from, to),
        is_active: true,
        ...parentPayload
      };

      const created = await questionGroupsService.create(payload);
      const createdGroup = normalizeGroup(mapApiQuestionGroupToBuilderGroup(created, from));

      setTest((current) => {
        const currentGroups = current.questionGroupsByStructure[activeStructure.id] ?? [];
        const currentOccupied = getOccupiedNumbers(currentGroups);
        if (!isRangeFree(currentOccupied, createdGroup.from, createdGroup.to)) {
          return current;
        }

        return {
          ...current,
          questionGroupsByStructure: {
            ...current.questionGroupsByStructure,
            [activeStructure.id]: [...currentGroups, createdGroup]
          }
        };
      });
      setCollapsedGroups((current) => ({...current, [createdGroup.id]: false}));
      setApiNotice("Saved.");
    } catch (error) {
      const message = error instanceof AdminApiError ? error.message : "Failed to create question group.";
      setApiNotice(message);
    } finally {
      setIsPersisting(false);
    }
  };

  const handleEditGroup = (groupId: string, type: QuestionType, from: number, to: number, instructions: string) => {
    if (!activeStructure) {
      return;
    }

    const range = getStructureRange(activeStructure);
    if (!isRangeWithin(range, from, to)) {
      return;
    }

    updateGroupsForActiveStructure((groups) => {
      const occupiedByOthers = getOccupiedNumbers(groups, groupId);
      if (!isRangeFree(occupiedByOthers, from, to)) {
        return groups;
      }

      return groups.map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        const questions: BuilderQuestion[] = [];
        for (let number = from; number <= to; number += 1) {
          const existing = group.questions.find((question) => question.number === number && question.type === type);
          questions.push(existing ? {...existing, number} : createDefaultQuestion(type, number));
        }

        return normalizeGroup({
          ...group,
          type,
          from,
          to,
          title: buildGroupTitle(from, to),
          questions,
          instructions: resolveInstructionsForSubmit(type, instructions)
        });
      });
    });
  };

  const handleDuplicateGroup = (groupId: string) => {
    if (!activeStructure) {
      return;
    }
    const range = getStructureRange(activeStructure);

    updateGroupsForActiveStructure((groups) => {
      const index = groups.findIndex((group) => group.id === groupId);
      if (index < 0) {
        return groups;
      }

      const source = normalizeGroup(groups[index]);
      const targetRange = findContiguousFreeRange(range, getOccupiedNumbers(groups), source.questions.length);
      if (!targetRange) {
        return groups;
      }

      const duplicate: QuestionGroup = {
        ...source,
        id: makeCopyId(source.id),
        title: `${buildGroupTitle(targetRange.from, targetRange.to)} ${t("groups.copySuffix")}`,
        from: targetRange.from,
        to: targetRange.to,
        questions: source.questions
          .sort((left, right) => left.number - right.number)
          .map((question, questionIndex) => ({
            ...question,
            id: makeCopyId(question.id),
            number: targetRange.from + questionIndex
          })),
        variantSetId: undefined
      };

      const next = [...groups];
      next.splice(index + 1, 0, normalizeGroup(duplicate));
      return next;
    });
  };

  const handleDeleteGroup = (groupId: string) => {
    updateGroupsForActiveStructure((groups) => groups.filter((group) => group.id !== groupId));
    setSelectedQuestion((current) => (current?.groupId === groupId ? null : current));
    setQuestionEditorOpen(false);
  };

  const handleAddQuestion = (groupId: string) => {
    if (!activeStructure) {
      return;
    }
    const range = getStructureRange(activeStructure);

    updateGroupsForActiveStructure((groups) =>
      groups.map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        const normalized = normalizeGroup(group);
        const occupiedByOthers = getOccupiedNumbers(groups, groupId);
        const insertNumber = getBoundaryInsertNumber(normalized, range, occupiedByOthers);
        if (insertNumber === null) {
          return group;
        }

        const question = createDefaultQuestion(group.type, insertNumber);
        const questions = insertNumber < normalized.from ? [question, ...normalized.questions] : [...normalized.questions, question];
        return normalizeGroup({...normalized, questions});
      })
    );
  };

  const handleMoveQuestion = (groupId: string, questionId: string, direction: "up" | "down") => {
    updateGroupsForActiveStructure((groups) =>
      groups.map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        const index = group.questions.findIndex((question) => question.id === questionId);
        if (index < 0) {
          return group;
        }
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= group.questions.length) {
          return group;
        }

        const reordered = [...group.questions];
        const [item] = reordered.splice(index, 1);
        reordered.splice(targetIndex, 0, item);

        return {...group, questions: reordered};
      })
    );
  };

  const handleDuplicateQuestion = (groupId: string, questionId: string) => {
    if (!activeStructure) {
      return;
    }
    const range = getStructureRange(activeStructure);

    updateGroupsForActiveStructure((groups) =>
      groups.map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        const normalized = normalizeGroup(group);
        const occupiedByOthers = getOccupiedNumbers(groups, groupId);
        const nextNumber = getBoundaryInsertNumber(normalized, range, occupiedByOthers);
        if (nextNumber === null) {
          return group;
        }

        const source = normalized.questions.find((question) => question.id === questionId);
        if (!source) {
          return group;
        }

        const duplicate = {
          ...source,
          id: makeCopyId(source.id),
          number: nextNumber
        } as BuilderQuestion;

        const questions = nextNumber < normalized.from ? [duplicate, ...normalized.questions] : [...normalized.questions, duplicate];
        return normalizeGroup({...normalized, questions});
      })
    );
  };

  const handleDeleteQuestion = (groupId: string, questionId: string) => {
    updateGroupsForActiveStructure((groups) =>
      groups.map((group) => {
        if (group.id !== groupId || group.questions.length <= 1) {
          return group;
        }

        const questions = group.questions.filter((question) => question.id !== questionId);
        return normalizeGroup({...group, questions});
      })
    );

    setSelectedQuestion((current) => (current?.questionId === questionId ? null : current));
    setQuestionEditorOpen(false);
  };

  const handleAttachEvidence = (text: string) => {
    if (!selectedQuestion || !text.trim()) {
      return false;
    }

    updateQuestion(selectedQuestion.groupId, selectedQuestion.questionId, (question) => ({
      ...question,
      evidence: text.trim(),
      evidenceText: text.trim()
    }));
    return true;
  };

  const handleRenameStructure = (structureId: string, title: string) => {
    setTest((current) => ({
      ...current,
      structures: current.structures.map((structure) => (structure.id === structureId ? {...structure, title} : structure))
    }));
  };

  const handleUpdateStructureContent = (structureId: string, content: string[]) => {
    setTest((current) => ({
      ...current,
      structures: current.structures.map((structure) => (structure.id === structureId ? {...structure, content} : structure))
    }));
  };

  const handleUpdateAudioLabel = (structureId: string, audioLabel: string) => {
    setTest((current) => ({
      ...current,
      structures: current.structures.map((structure) => (structure.id === structureId ? {...structure, audioLabel} : structure))
    }));
  };

  const handleSelectContentBankPassage = (passageId: string) => {
    if (!activeStructure) return;
    const selectedInOtherSlot = test.structures.some(
      (structure) => structure.id !== activeStructure.id && structure.linkedPassageId === passageId
    );
    if (selectedInOtherSlot) {
      return;
    }

    const passage = availableContentBankPassages.find((item) => item.id === passageId);
    if (!passage) return;

    const currentGroups = test.questionGroupsByStructure[activeStructure.id] ?? [];
    if (currentGroups.length > 0 && hasQuestionContent(currentGroups)) {
      const shouldReplace = window.confirm(t("confirmReplaceGeneratedGroups"));
      if (!shouldReplace) return;
    }

    setTest((current) => ({
      ...current,
      structures: current.structures.map((structure) =>
        structure.id === activeStructure.id
          ? {
              ...structure,
              linkedPassageId: passage.id,
              linkedVariantSetId: undefined,
              title: passage.title,
              content: passage.fullText.length ? [...passage.fullText] : [passage.previewText]
            }
          : structure
      ),
      questionGroupsByStructure: {
        ...current.questionGroupsByStructure,
        [activeStructure.id]: []
      }
    }));

    setSelectedQuestion(null);
    setQuestionEditorOpen(false);
  };

  const handleSelectVariantSet = (variantSetId: string) => {
    if (!activeStructure) return;
    if (!variantSetId) {
      updateActiveStructure((structure) => ({...structure, linkedVariantSetId: undefined}));
      return;
    }

    const variantSet = availableVariantSets.find((item) => item.id === variantSetId);
    if (!variantSet) return;

    const currentGroups = test.questionGroupsByStructure[activeStructure.id] ?? [];
    if (hasQuestionContent(currentGroups)) {
      const shouldReplace = window.confirm(t("confirmReplaceGeneratedGroups"));
      if (!shouldReplace) return;
    }

    const generatedGroups = generateQuestionGroupsFromVariant({
      module: test.module,
      slotIndex: activeStructure.index,
      variantSet
    });

    setTest((current) => ({
      ...current,
      structures: current.structures.map((structure) =>
        structure.id === activeStructure.id
          ? {
              ...structure,
              linkedPassageId: variantSet.passageId,
              linkedVariantSetId: variantSet.id
            }
          : structure
      ),
      questionGroupsByStructure: {
        ...current.questionGroupsByStructure,
        [activeStructure.id]: generatedGroups
      }
    }));

    setCollapsedGroups((current) => {
      const next = {...current};
      for (const group of generatedGroups) {
        next[group.id] = false;
      }
      return next;
    });
    setSelectedQuestion(null);
    setQuestionEditorOpen(false);
  };

  const syncTestToBackend = async (nextStatus: "draft" | "published") => {
    if (isPersisting) {
      return;
    }

    setIsPersisting(true);
    setApiNotice(null);

    try {
      await practiceTestsService.patch(test.id, {
        is_active: nextStatus === "published"
      });

      const nextGroupsByStructure: Record<string, QuestionGroup[]> = {
        ...test.questionGroupsByStructure
      };

      for (const structure of test.structures) {
        const range = getStructureRange(structure);
        const maxQuestions = Math.max(1, range.to - range.from + 1);
        const fullText = structure.content.join("\n\n").trim();

        if (test.module === "reading") {
          await readingPassagesService.patch(structure.id, {
            passage_number: `PASSAGE_${structure.index}`,
            title: structure.title,
            passage_text: fullText || " ",
            max_questions: maxQuestions,
            is_active: true
          });
        } else {
          await listeningPartsService.patch(structure.id, {
            part_number: `PART_${structure.index}`,
            title: structure.title,
            transcript_text: fullText || " ",
            max_questions: maxQuestions,
            is_active: true
          });
        }

        const localGroups = [...(test.questionGroupsByStructure[structure.id] ?? [])]
          .map((group) => normalizeGroup(group))
          .sort((left, right) => left.from - right.from);

        const listedGroups = await questionGroupsService.list({
          ...(test.module === "reading" ? {reading_passage: structure.id} : {listening_part: structure.id}),
          page: 1,
          pageSize: 200,
          ordering: "group_order"
        });

        const existingById = new Map(
          listedGroups.results
            .map((group) => [toStringSafe(group.id), group] as const)
            .filter(([id]) => Boolean(id))
        );
        const localIds = new Set(localGroups.map((group) => toStringSafe(group.id)).filter(Boolean));

        for (const remote of listedGroups.results) {
          const remoteId = toStringSafe(remote.id);
          if (!remoteId || localIds.has(remoteId)) {
            continue;
          }
          await questionGroupsService.remove(remoteId);
        }

        const syncedGroups: QuestionGroup[] = [];
        for (let index = 0; index < localGroups.length; index += 1) {
          const group = localGroups[index];
          const normalizedLocalQuestions = [...group.questions].sort((left, right) => left.number - right.number);
          const apiQuestionType = mapBuilderQuestionTypeToApi(group.type, normalizedLocalQuestions.length);
          const commonPayload = {
            question_type: group.type,
            group_order: index + 1,
            instructions: resolveInstructionsForSubmit(group.type, group.instructions ?? ""),
            question_number_start: group.from,
            question_number_end: group.to,
            word_limit: null,
            number_allowed: false,
            group_content_json: resolveGroupContentForSync(group),
            is_active: true
          } satisfies Partial<QuestionGroupPayload>;

          const groupId = toStringSafe(group.id);
          let persistedGroup: QuestionGroupRecord;
          if (groupId && existingById.has(groupId)) {
            persistedGroup = await questionGroupsService.patch(groupId, commonPayload);
          } else {
            persistedGroup = await questionGroupsService.create({
              ...commonPayload,
              ...(test.module === "reading" ? {reading_passage: structure.id} : {listening_part: structure.id})
            } as QuestionGroupPayload);
          }

          const persistedGroupId = toStringSafe(persistedGroup.id);
          if (persistedGroupId) {
            const existingQuestions = await questionsService.list({
              question_group: persistedGroupId,
              page: 1,
              pageSize: 200,
              ordering: "question_number"
            });

            for (const remoteQuestion of existingQuestions.results) {
              const remoteQuestionId = toStringSafe(remoteQuestion.id);
              if (!remoteQuestionId) continue;
              await questionsService.remove(remoteQuestionId);
            }

            const readyQuestions = normalizedLocalQuestions.filter((question) => isQuestionReadyForSync(question));
            if (readyQuestions.length > 0) {
              await questionsService.bulkCreate(
                persistedGroupId,
                apiQuestionType,
                {
                  questions: readyQuestions.map((question, questionIndex) =>
                    mapBuilderQuestionToBulkPayload(question, apiQuestionType, questionIndex + 1)
                  )
                }
              );
            }
          }

          syncedGroups.push(
            normalizeGroup({
              ...group,
              id: persistedGroupId || group.id,
              variantSetId: toStringSafe(persistedGroup.variant_set ?? group.variantSetId ?? ""),
              instructions: commonPayload.instructions,
              groupContentJson: commonPayload.group_content_json
            })
          );
        }

        nextGroupsByStructure[structure.id] = syncedGroups;
      }

      setTest((current) => ({
        ...current,
        status: nextStatus,
        questionGroupsByStructure: {
          ...current.questionGroupsByStructure,
          ...nextGroupsByStructure
        }
      }));
      setApiNotice("Saved.");
    } catch (error) {
      const message = error instanceof AdminApiError ? error.message : "Failed to save changes.";
      setApiNotice(message);
    } finally {
      setIsPersisting(false);
    }
  };

  const handleSaveDraft = () => {
    void syncTestToBackend("draft");
  };

  const handlePublish = () => {
    if (!canPublishByQuestionCount) {
      const pending = structureQuestionProgress
        .filter((item) => !item.complete)
        .map((item) => {
          const flags: string[] = [];
          if (item.hasOverlap) flags.push(t("validation.overlapIssue"));
          if (item.outOfRangeEntries > 0) flags.push(t("validation.outOfRangeIssue"));
          const issueLabel = flags.length ? ` (${flags.join(", ")})` : "";
          return `${t(`structure.labels.${item.structureKind}`, {index: item.structureIndex})}: ${item.assigned}/${item.required}${issueLabel}`;
        });
      const details = pending.length ? `\n\n${pending.join("\n")}` : "";
      window.alert(
        t("validation.publishQuestionCount", {
          current: totalAssignedQuestions,
          required: totalRequiredQuestions
        }) + details
      );
      return;
    }

    void syncTestToBackend("published");
  };

  const openQuestionEditor = (groupId: string, questionId: string) => {
    setSelectedQuestion({groupId, questionId});
    setQuestionEditorOpen(true);
  };

  if (!activeStructure) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <BuilderTopbar
            bookName={test.book}
            module={test.module}
            mode={mode}
            status={test.status}
            questionProgressLabel={`${totalAssignedQuestions}/${totalRequiredQuestions}`}
            publishDisabled={!canPublishByQuestionCount}
            mobileNav={<AdminSidebarMobileNav />}
            onModeChange={setMode}
            onSaveDraft={handleSaveDraft}
            onPublish={handlePublish}
          />

          <main className="mx-auto min-w-0 w-full max-w-[1760px] overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            {apiNotice ? (
              <div className="mb-4 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
                {apiNotice}
              </div>
            ) : null}
            <section className="grid min-w-0 gap-4 xl:grid-cols-[280px_minmax(0,1fr)_460px]">
              <TestStructurePanel
                module={test.module}
                structures={test.structures}
                activeStructureId={activeStructure.id}
                questionProgressByStructureId={questionProgressByStructureId}
                onSelect={(nextId) => {
                  setActiveStructureId(nextId);
                  setSelectedQuestion(null);
                  setQuestionEditorOpen(false);
                }}
                onRename={handleRenameStructure}
              />

              <PassageEditor
                mode={mode}
                module={test.module}
                structure={activeStructure}
                selectedQuestionLabel={selectedQuestionLabel}
                contentBankPassages={availableContentBankPassages}
                selectedPassageId={activeStructure.linkedPassageId ?? ""}
                onSelectContentBankPassage={handleSelectContentBankPassage}
                variantSets={availableVariantSets}
                hasAnyVariantSets={passageVariantSets.length > 0}
                requiredQuestionCount={slotRequiredQuestions}
                selectedVariantSetId={activeStructure.linkedVariantSetId ?? ""}
                selectedVariantSetName={selectedVariantSet?.name ?? null}
                onSelectVariantSet={handleSelectVariantSet}
                onUpdateContent={handleUpdateStructureContent}
                onUpdateAudioLabel={handleUpdateAudioLabel}
                onAttachEvidence={handleAttachEvidence}
              />

              <QuestionGroupsPanel
                mode={mode}
                module={test.module}
                activeStructure={activeStructure}
                groups={activeGroups}
                collapsedGroups={collapsedGroups}
                selectedQuestionId={selectedQuestion?.questionId ?? null}
                onCreateGroup={handleCreateGroup}
                onEditGroup={handleEditGroup}
                onDuplicateGroup={handleDuplicateGroup}
                onDeleteGroup={handleDeleteGroup}
                onToggleGroupCollapse={(groupId) => setCollapsedGroups((current) => ({...current, [groupId]: !current[groupId]}))}
                onAddQuestion={handleAddQuestion}
                onOpenQuestionEditor={openQuestionEditor}
                onSelectQuestion={(groupId, questionId) => setSelectedQuestion({groupId, questionId})}
                onMoveQuestion={handleMoveQuestion}
                onDuplicateQuestion={handleDuplicateQuestion}
                onDeleteQuestion={handleDeleteQuestion}
              />
            </section>
          </main>
        </div>
      </div>

      <QuestionEditorModal
        open={questionEditorOpen && Boolean(selectedQuestionData)}
        question={selectedQuestionData?.question ?? null}
        onOpenChange={setQuestionEditorOpen}
        onQuestionChange={(nextQuestion) => {
          if (!selectedQuestion) {
            return;
          }
          updateQuestion(selectedQuestion.groupId, selectedQuestion.questionId, () => nextQuestion);
        }}
      />
    </div>
  );
}
