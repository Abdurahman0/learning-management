import {createDefaultQuestion, type BuilderQuestion, type QuestionGroup, type QuestionType} from "@/data/admin-test-builder";
import type {QuestionBulkItemPayload, QuestionGroupRecord, QuestionRecord} from "@/src/services/admin/types";

function buildGroupTitle(from: number, to: number) {
  return `Questions ${from}-${to}`;
}

function uniqueSortedNumbers(values: number[]) {
  return [...new Set(values)].sort((left, right) => left - right);
}

export function makeCopyId(value: string) {
  return `${value}-copy-${Math.random().toString(36).slice(2, 8)}`;
}

export function getOccupiedNumbers(groups: QuestionGroup[], excludeGroupId?: string) {
  const occupied = new Set<number>();
  for (const group of groups) {
    if (excludeGroupId && group.id === excludeGroupId) continue;
    for (const question of group.questions) {
      occupied.add(question.number);
    }
  }
  return occupied;
}

export function isRangeWithin(range: {from: number; to: number}, from: number, to: number) {
  return from >= range.from && to <= range.to && from <= to;
}

export function normalizeGroup(group: QuestionGroup): QuestionGroup {
  const uniqueNumbers = uniqueSortedNumbers(group.questions.map((question) => question.number));
  if (!uniqueNumbers.length) {
    return group;
  }

  const questions = [...group.questions]
    .sort((left, right) => left.number - right.number)
    .map((question) => {
      if (question.type !== "selecting_from_a_list") {
        return question;
      }

      const autoItem = question.prompt.trim() || `Question ${question.number}`;
      return {
        ...question,
        items: [autoItem]
      };
    });

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

export function findContiguousFreeRange(range: {from: number; to: number}, occupied: Set<number>, length: number) {
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

export function getBoundaryInsertNumber(group: QuestionGroup, range: {from: number; to: number}, occupiedByOthers: Set<number>) {
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

function toRoman(index: number) {
  const romans = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];
  return romans[index] ?? `h${index + 1}`;
}

function toOptionKey(index: number) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let value = index + 1;
  let result = "";
  while (value > 0) {
    value -= 1;
    result = alphabet[value % 26] + result;
    value = Math.floor(value / 26);
  }
  return result || "A";
}

function generateRangeOptions(startRaw: string, endRaw: string): string[] {
  const start = startRaw.trim().toUpperCase();
  const end = endRaw.trim().toUpperCase();
  if (!start || !end) return [];

  if (/^\d+$/.test(start) && /^\d+$/.test(end)) {
    const from = Number(start);
    const to = Number(end);
    if (!Number.isFinite(from) || !Number.isFinite(to)) return [];
    const step = from <= to ? 1 : -1;
    const out: string[] = [];
    for (let number = from; step > 0 ? number <= to : number >= to; number += step) out.push(String(number));
    return out;
  }

  if (/^[A-Z]$/.test(start) && /^[A-Z]$/.test(end)) {
    const from = start.charCodeAt(0);
    const to = end.charCodeAt(0);
    const step = from <= to ? 1 : -1;
    const out: string[] = [];
    for (let code = from; step > 0 ? code <= to : code >= to; code += step) out.push(String.fromCharCode(code));
    return out;
  }

  return [];
}

function extractRangeFromInstructionText(text: string) {
  const match = String(text ?? "").match(/\b([A-Z]|\d{1,2})\s*[-–—]\s*([A-Z]|\d{1,2})\b/i);
  if (!match) return [];
  return generateRangeOptions(match[1] ?? "", match[2] ?? "");
}

function normalizeMcqAnswerTokens(rawValue: string, optionCount: number) {
  const validKeys = new Set(Array.from({length: Math.max(0, optionCount)}, (_, index) => toOptionKey(index)));
  const rawTokens = rawValue
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);

  const normalized = rawTokens
    .map((token) => {
      if (validKeys.has(token)) return token;
      const prefixedMatch = token.match(/^([A-Z]+)[\)\].:\-\s]/);
      if (prefixedMatch && validKeys.has(prefixedMatch[1])) return prefixedMatch[1];
      const compact = token.replace(/[^A-Z]/g, "");
      if (validKeys.has(compact)) return compact;
      return "";
    })
    .filter(Boolean);

  return [...new Set(normalized)];
}

function buildDefaultGroupContentJson(type: QuestionType, from: number, to: number) {
  switch (type) {
    case "matching_headings":
      return {headings: []};
    case "matching_features":
      return {categories: [{key: "A", label: "Category A"}, {key: "B", label: "Category B"}, {key: "C", label: "Category C"}]};
    case "selecting_from_a_list":
    case "matching_information":
      return {options: Array.from({length: 5}, (_, index) => ({key: toOptionKey(index), text: `Option ${toOptionKey(index)}`}))};
    case "summary_completion":
      return {summary_text: "", word_bank_enabled: false, word_bank: null};
    case "form_completion":
    case "note_completion":
      return {template_text: Array.from({length: Math.max(1, to - from + 1)}, (_, index) => `Item ${from + index}: {${from + index}}`).join("\n")};
    case "table_completion":
      return {
        columns: ["Field", "Value"],
        rows: Array.from({length: Math.max(1, to - from + 1)}, (_, index) => [`Item ${from + index}`, `{${from + index}}`])
      };
    case "map":
      return {image: "/media/diagrams/placeholder-map.png", labels: []};
    default:
      return null;
  }
}

function ensureGroupContentForApi(type: QuestionType, from: number, to: number, input: unknown, module?: "reading" | "listening") {
  const fallback = buildDefaultGroupContentJson(type, from, to);
  const content = asRecord(input);

  if (type === "multiple_choice") return null;
  if (type === "matching_information" && module !== "listening") return null;

  if (type === "matching_information") {
    const sourceRows = Array.isArray(content.options) ? content.options : Array.isArray(content.choices) ? content.choices : [];
    const options = sourceRows
      .map((item) => {
        if (typeof item === "string") return item;
        const row = asRecord(item);
        return toStringSafe(row.text ?? row.label ?? row.key);
      })
      .map((item) => item.trim())
      .filter(Boolean);
    return options.length > 0 ? {options: options.map((text, index) => ({key: toOptionKey(index), text}))} : fallback;
  }

  if (type === "matching_headings") {
    const sourceRows = Array.isArray(content.headings) ? content.headings : [];
    const headings = sourceRows
      .map((item) => {
        if (typeof item === "string") return item;
        const row = asRecord(item);
        return toStringSafe(row.text ?? row.label ?? row.key);
      })
      .map((item) => item.trim())
      .filter(Boolean);
    return headings.length > 0 ? {headings: headings.map((text, index) => ({key: toRoman(index), text}))} : fallback;
  }

  if (type === "matching_features") {
    const sourceRows = Array.isArray(content.categories) ? content.categories : Array.isArray(content.choices) ? content.choices : [];
    const categories = sourceRows
      .map((item) => {
        if (typeof item === "string") return item;
        const row = asRecord(item);
        return toStringSafe(row.label ?? row.text ?? row.key);
      })
      .map((item) => item.trim())
      .filter(Boolean);
    return categories.length > 0 ? {categories: categories.map((rawLabel, index) => {
      const prefixed = rawLabel.match(/^\s*([A-Z])(?:[\)\].:\-]\s*|\s+)(.+)$/i);
      const key = prefixed ? prefixed[1].toUpperCase() : toOptionKey(index);
      const label = prefixed ? prefixed[2].trim() : rawLabel;
      return {key, label};
    })} : fallback;
  }

  if (type === "selecting_from_a_list") {
    const sourceRows = Array.isArray(content.options) ? content.options : Array.isArray(content.choices) ? content.choices : [];
    const options = sourceRows
      .map((item) => {
        if (typeof item === "string") return item;
        const row = asRecord(item);
        return toStringSafe(row.text ?? row.label ?? row.key);
      })
      .map((item) => item.trim())
      .filter(Boolean);
    return options.length > 0 ? {options: options.map((text, index) => ({key: toOptionKey(index), text}))} : fallback;
  }

  if (type === "map") {
    const fallbackRecord = asRecord(fallback);
    const image = toStringSafe(content.image ?? fallbackRecord.image).trim() || toStringSafe(fallbackRecord.image);
    const sourceRows = Array.isArray(content.labels) ? content.labels : Array.isArray(content.options) ? content.options : Array.isArray(content.choices) ? content.choices : [];
    const labels = sourceRows
      .map((item) => {
        if (typeof item === "string") return item;
        const row = asRecord(item);
        return toStringSafe(row.text ?? row.label ?? row.key);
      })
      .map((item) => item.trim())
      .filter(Boolean);
    return {image, labels: labels.map((text, index) => ({key: toOptionKey(index), text}))};
  }

  if (type === "form_completion" || type === "note_completion") {
    const templateText = toStringSafe(content.template_text).trim();
    return templateText.length > 0 ? {template_text: templateText} : fallback;
  }

  if (type === "summary_completion") {
    const summaryText = toStringSafe(content.summary_text).trim();
    const wordBankEnabled = content.word_bank_enabled === true || content.summary_word_bank_enabled === true;
    const wordBank = Array.isArray(content.word_bank)
      ? (content.word_bank as unknown[]).map((item) => toStringSafe(item).trim()).filter(Boolean)
      : null;
    return {
      summary_text: summaryText || toStringSafe(asRecord(fallback).summary_text),
      word_bank_enabled: wordBankEnabled,
      word_bank: wordBankEnabled && wordBank && wordBank.length ? wordBank : null
    };
  }

  if (type === "table_completion") {
    const fallbackRecord = asRecord(fallback);
    const columns = (Array.isArray(content.columns) ? content.columns : [])
      .map((item) => (typeof item === "string" ? item : toStringSafe(asRecord(item).text ?? asRecord(item).label ?? asRecord(item).key)))
      .map((item) => item.trim())
      .filter(Boolean);
    const rows = (Array.isArray(content.rows) ? content.rows : [])
      .map((row) => (Array.isArray(row) ? row : []))
      .map((row) => row.map((cell) => toStringSafe(cell).trim()).filter(Boolean))
      .filter((row) => row.length > 0);
    return {
      columns: columns.length ? columns : (Array.isArray(fallbackRecord.columns) ? fallbackRecord.columns : ["Field", "Value"]),
      rows: rows.length ? rows : (Array.isArray(fallbackRecord.rows) ? fallbackRecord.rows : [])
    };
  }

  if (input === undefined || input === null) return fallback ?? null;
  if (typeof input === "object" && !Array.isArray(input) && Object.keys(input as Record<string, unknown>).length === 0) return fallback ?? null;
  return input;
}

export function resolveGroupContentForSync(group: QuestionGroup, module: "reading" | "listening"): unknown {
  if (group.type === "multiple_choice") return null;
  if (group.type === "matching_information" && module !== "listening") return null;

  if (group.type === "matching_headings") {
    return {
      headings: ((group.questions[0] as {headings?: string[]})?.headings ?? []).map((text: string, index: number) => ({key: toRoman(index), text}))
    };
  }

  if (group.type === "matching_features") {
    return {
      categories: ((group.questions[0] as {choices?: string[]})?.choices ?? []).map((rawLabel: string, index: number) => {
        const prefixed = rawLabel.match(/^\s*([A-Z])(?:[\)\].:\-]\s*|\s+)(.+)$/i);
        const key = prefixed ? prefixed[1].toUpperCase() : toOptionKey(index);
        const label = prefixed ? prefixed[2].trim() : rawLabel;
        return {key, label};
      })
    };
  }

  if (group.type === "selecting_from_a_list") {
    return {
      options: ((group.questions[0] as {choices?: string[]})?.choices ?? []).map((text: string, index: number) => ({key: toOptionKey(index), text}))
    };
  }

  if (group.type === "map") {
    const groupContent = asRecord(group.groupContentJson);
    return {
      image: toStringSafe(groupContent.image).trim() || "/media/diagrams/placeholder-map.png",
      labels: ((group.questions[0] as {choices?: string[]})?.choices ?? []).map((text: string, index: number) => ({key: toOptionKey(index), text}))
    };
  }

  return ensureGroupContentForApi(group.type, group.from, group.to, group.groupContentJson, module);
}

export function resolveApiQuestionTypeForGroup(type: QuestionType, _questionCount: number, _groupContent?: unknown, module?: "reading" | "listening") {
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
    matching_information: module === "listening" ? "MATCHING" : "MATCH_PARA_INFO",
    short_answer: "SHORT_ANSWER"
  };
  return mapping[type] ?? String(type).toUpperCase();
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
      if (normalized) answerCandidates.push(normalized);
    }
  } else {
    const normalized = toStringSafe((question as {correctAnswer?: unknown}).correctAnswer).trim();
    if (normalized) answerCandidates.push(normalized);
  }

  const extras = Array.isArray((question as {acceptableAnswers?: unknown}).acceptableAnswers)
    ? ((question as {acceptableAnswers: unknown[]}).acceptableAnswers ?? [])
    : [];

  for (const value of extras) {
    const normalized = toStringSafe(value).trim();
    if (normalized) answerCandidates.push(normalized);
  }

  const unique = [...new Set(answerCandidates)];
  return {answer: unique[0] ?? "", alternatives: unique.slice(1)};
}

function ensureAlternativeAnswers(answer: string, alternatives: string[]) {
  const normalizedAnswer = answer.trim();
  return [...new Set(alternatives.map((item) => item.trim()).filter(Boolean))].filter(
    (item) => item.toLowerCase() !== normalizedAnswer.toLowerCase()
  );
}

function buildCompletionCorrectAnswer(answer: string, alternatives: string[]) {
  const cleanedAlternatives = ensureAlternativeAnswers(answer, alternatives);
  return cleanedAlternatives.length
    ? {answer, alternative_answers: cleanedAlternatives}
    : {answer};
}

export function isQuestionReadyForSync(question: BuilderQuestion) {
  const prompt = question.prompt.trim();

  if (question.type === "tfng" || question.type === "yes_no_not_given") {
    return Boolean(prompt) && Boolean((question.correctAnswer ?? "").trim());
  }

  if (question.type === "multiple_choice") {
    const nonEmptyOptions = question.options.filter((option) => option.trim().length > 0);
    const normalizedAnswers = normalizeMcqAnswerTokens(question.correctAnswer, nonEmptyOptions.length);
    return Boolean(prompt) && nonEmptyOptions.length > 0 && normalizedAnswers.length > 0;
  }

  if (question.type === "matching_headings") {
    return Boolean(prompt) && Boolean(question.correctAnswer.trim());
  }

  if (question.type === "matching_information" || question.type === "matching_features" || question.type === "selecting_from_a_list" || question.type === "map") {
    const mapped = Object.values(question.correctAnswer).find((value) => String(value ?? "").trim().length > 0);
    return Boolean(prompt) && Boolean(mapped);
  }

  const answers = toTextAnswers(question);
  return Boolean(prompt) && Boolean(answers.answer);
}

export function mapBuilderQuestionToBulkPayload(question: BuilderQuestion, apiType: string, order: number): QuestionBulkItemPayload {
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

  if (question.type === "tfng" || question.type === "yes_no_not_given") {
    return {...base, options_json: {statement: prompt}, correct_answer_json: {answer: normalizeChoiceToken(String(question.correctAnswer ?? ""))}};
  }

  if (question.type === "multiple_choice") {
    const optionRows = question.options.map((text, index) => ({key: toOptionKey(index), text: text.trim()})).filter((item) => item.text.length > 0);
    const normalizedAnswer = normalizeMcqAnswerTokens(question.correctAnswer, optionRows.length)[0] ?? "";
    return {...base, options_json: {options: optionRows}, correct_answer_json: {answer: normalizedAnswer}};
  }

  if (question.type === "matching_headings") {
    return {...base, options_json: null, correct_answer_json: {answer: question.correctAnswer.trim()}};
  }

  if (question.type === "matching_information" || question.type === "matching_features" || question.type === "selecting_from_a_list" || question.type === "map") {
    const mappedAnswer = question.correctAnswer[prompt] ?? Object.values(question.correctAnswer).find((value) => String(value ?? "").trim().length > 0) ?? "";
    return {
      ...base,
      options_json: question.type === "matching_information" && apiType !== "MATCHING" ? {statement: prompt} : null,
      correct_answer_json: {answer: String(mappedAnswer).trim()}
    };
  }

  const answers = toTextAnswers(question);
  return {
    ...base,
    options_json: null,
    correct_answer_json: buildCompletionCorrectAnswer(answers.answer, answers.alternatives)
  };
}

function mapApiQuestionTypeToBuilder(value: string): QuestionType {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized === "TFNG") return "tfng";
  if (normalized === "YNNG") return "yes_no_not_given";
  if (normalized === "MCQ_SINGLE" || normalized === "MCQ_MULTIPLE") return "multiple_choice";
  if (normalized === "MATCHING_HEADINGS") return "matching_headings";
  if (normalized === "MATCH_PARA_INFO" || normalized === "MATCHING_INFORMATION" || normalized === "MATCHING") return "matching_information";
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

function mapApiQuestionToBuilderQuestion(type: QuestionType, question: QuestionRecord, group: QuestionGroupRecord, fallbackNumber: number): BuilderQuestion {
  const builderQuestion = createDefaultQuestion(type, toNumberSafe(question.question_number, fallbackNumber));
  builderQuestion.id = toStringSafe(question.id, builderQuestion.id);
  builderQuestion.prompt = toStringSafe(question.prompt ?? question.question_text, builderQuestion.prompt);
  builderQuestion.explanation = toStringSafe(question.explanation, "");
  builderQuestion.evidence = toStringSafe((asRecord(question.answer_evidence_json).text_snippet ?? question.evidence_text), "");
  builderQuestion.evidenceText = builderQuestion.evidence;

  const optionsJson = asRecord(question.options_json);
  const answerJson = asRecord(question.correct_answer_json);
  const groupContent = asRecord(group.group_content_json);

  if (builderQuestion.type === "tfng" || builderQuestion.type === "yes_no_not_given") {
    builderQuestion.correctAnswer = String(answerJson.answer ?? "").replace(/_/g, " ") as never;
    return builderQuestion;
  }

  if (builderQuestion.type === "multiple_choice") {
    const optionsRows = Array.isArray(optionsJson.options) ? optionsJson.options : [];
    const texts = optionsRows
      .map((item) => {
        if (typeof item === "string") return item;
        const row = asRecord(item);
        return toStringSafe(row.text ?? row.label ?? row.key);
      })
      .map((item) => item.trim())
      .filter(Boolean);
    if (texts.length > 0) builderQuestion.options = texts;
    builderQuestion.correctAnswer = toStringSafe(answerJson.answer);
    return builderQuestion;
  }

  if (builderQuestion.type === "matching_headings") {
    const headingRows = Array.isArray(groupContent.headings) ? groupContent.headings : [];
    builderQuestion.headings = headingRows
      .map((item) => (typeof item === "string" ? item : toStringSafe(asRecord(item).text ?? asRecord(item).label ?? asRecord(item).key)))
      .map((item) => item.trim())
      .filter(Boolean);
    builderQuestion.correctAnswer = toStringSafe(answerJson.answer);
    return builderQuestion;
  }

  if (builderQuestion.type === "matching_information" || builderQuestion.type === "matching_features" || builderQuestion.type === "selecting_from_a_list" || builderQuestion.type === "map") {
    const choiceRows = Array.isArray(groupContent.choices)
      ? groupContent.choices
      : Array.isArray(groupContent.options)
        ? groupContent.options
        : Array.isArray(groupContent.labels)
          ? groupContent.labels
          : Array.isArray(groupContent.categories)
            ? groupContent.categories
            : [];
    const choices = choiceRows
      .map((item) => (typeof item === "string" ? item : toStringSafe(asRecord(item).text ?? asRecord(item).label ?? asRecord(item).key)))
      .map((item) => item.trim())
      .filter(Boolean);
    (builderQuestion as Extract<BuilderQuestion, {type: "matching_information" | "matching_features" | "selecting_from_a_list" | "map"}>).choices =
      choices.length > 0 ? choices : extractRangeFromInstructionText(group.instructions ?? "");
    (builderQuestion as Extract<BuilderQuestion, {type: "matching_information" | "matching_features" | "selecting_from_a_list" | "map"}>).correctAnswer = {
      [builderQuestion.prompt.trim() || `Question ${builderQuestion.number}`]: toStringSafe(answerJson.answer)
    };
    return builderQuestion;
  }

  const primary = toStringSafe(answerJson.answer).trim();
  const alternatives = Array.isArray(answerJson.alternative_answers)
    ? (answerJson.alternative_answers as unknown[]).map((value) => toStringSafe(value).trim()).filter(Boolean)
    : [];
  const values = [primary, ...alternatives].filter(Boolean);
  (builderQuestion as Extract<BuilderQuestion, {type: "sentence_completion" | "summary_completion" | "table_completion" | "flow_chart" | "diagram_labeling" | "form_completion" | "note_completion" | "short_answer"}>).correctAnswer = values.length > 1 ? values : values[0] ?? "";
  (builderQuestion as Extract<BuilderQuestion, {type: "sentence_completion" | "summary_completion" | "table_completion" | "flow_chart" | "diagram_labeling" | "form_completion" | "note_completion" | "short_answer"}>).acceptableAnswers = alternatives;
  return builderQuestion;
}

export function mapApiQuestionGroupToBuilderGroup(group: QuestionGroupRecord, fallbackIndex: number): QuestionGroup {
  const from = toNumberSafe(group.question_number_start, fallbackIndex);
  const to = toNumberSafe(group.question_number_end, from);
  const type = mapApiQuestionTypeToBuilder(toStringSafe(group.question_type));
  const sourceQuestions = Array.isArray(group.questions) ? group.questions : [];

  const questions = sourceQuestions.length
    ? sourceQuestions.map((question, index) => mapApiQuestionToBuilderQuestion(type, question, group, from + index))
    : Array.from({length: Math.max(0, to - from + 1)}, (_, index) => createDefaultQuestion(type, from + index));

  const groupContent = asRecord(group.group_content_json);
  const headingRows = Array.isArray(groupContent.headings) ? groupContent.headings : [];
  const choiceRows = Array.isArray(groupContent.choices)
    ? groupContent.choices
    : Array.isArray(groupContent.options)
      ? groupContent.options
      : Array.isArray(groupContent.labels)
        ? groupContent.labels
        : Array.isArray(groupContent.categories)
          ? groupContent.categories
          : [];
  const headings = headingRows
    .map((item) => (typeof item === "string" ? item : toStringSafe(asRecord(item).text ?? asRecord(item).label ?? asRecord(item).key)))
    .map((item) => item.trim())
    .filter(Boolean);
  const choices = choiceRows
    .map((item) => (typeof item === "string" ? item : toStringSafe(asRecord(item).text ?? asRecord(item).label ?? asRecord(item).key)))
    .map((item) => item.trim())
    .filter(Boolean);

  const enrichedQuestions = questions.map((question) => {
    if (question.type === "matching_headings" && headings.length > 0) {
      return {...question, headings};
    }
    if ((question.type === "matching_information" || question.type === "matching_features" || question.type === "selecting_from_a_list") && choices.length > 0) {
      return {...question, choices};
    }
    return question;
  });

  return normalizeGroup({
    id: toStringSafe(group.id, `${type}-${from}-${to}`),
    title: buildGroupTitle(from, to),
    type,
    from,
    to,
    questions: enrichedQuestions,
    instructions: toStringSafe(group.instructions ?? ""),
    groupContentJson: groupContent,
    variantSetId: toStringSafe(group.variant_set ?? "")
  });
}
