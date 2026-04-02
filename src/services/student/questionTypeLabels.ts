export type QuestionTypeTranslate = (key: string) => string;
export type QuestionTypeHas = (key: string) => boolean;

type QuestionTypeDefinition = {
  token: string;
  label: string;
  short: string;
  aliases?: string[];
  translationKeys?: string[];
};

const QUESTION_TYPE_DEFINITIONS: QuestionTypeDefinition[] = [
  {
    token: "TFNG",
    label: "True / False / Not Given",
    short: "TFNG",
    aliases: ["TRUE_FALSE_NOT_GIVEN", "TRUE_FALSE_NG"],
    translationKeys: ["TFNG", "trueFalseNotGiven", "tfng", "true_false_not_given"]
  },
  {
    token: "YNNG",
    label: "Yes / No / Not Given",
    short: "YNNG",
    aliases: ["YES_NO_NOT_GIVEN"],
    translationKeys: ["YNNG", "yesNoNotGiven", "yes_no_not_given"]
  },
  {
    token: "MCQ_SINGLE",
    label: "Multiple Choice",
    short: "MCQ",
    aliases: ["MCQ", "MULTIPLE_CHOICE", "MULTIPLE_CHOICE_SINGLE"],
    translationKeys: ["MCQ_SINGLE", "multipleChoice", "mcq", "multiple_choice"]
  },
  {
    token: "MCQ_MULTIPLE",
    label: "Multiple Choice (Multiple Answers)",
    short: "MCQ",
    aliases: ["MULTIPLE_CHOICE_MULTIPLE"],
    translationKeys: ["MCQ_MULTIPLE", "multipleChoice", "mcq", "multiple_choice"]
  },
  {
    token: "MATCH_PARA_INFO",
    label: "Matching Paragraph Information",
    short: "MPI",
    aliases: ["MATCHING_INFORMATION", "MATCHING_PARA_INFO", "MATCHING_PARAGRAPH_INFORMATION"],
    translationKeys: ["MATCH_PARA_INFO", "matchingInfo", "matching_information"]
  },
  {
    token: "MATCHING_HEADINGS",
    label: "Matching Headings",
    short: "MH",
    translationKeys: ["MATCHING_HEADINGS", "matchingHeadings", "matching_headings"]
  },
  {
    token: "MATCHING_FEATURES",
    label: "Matching Features",
    short: "MF",
    translationKeys: ["MATCHING_FEATURES", "matchingFeatures", "matching_features"]
  },
  {
    token: "MATCH_SENT_ENDINGS",
    label: "Matching Sentence Endings",
    short: "MSE",
    aliases: ["MATCHING_SENTENCE_ENDINGS"],
    translationKeys: ["MATCH_SENT_ENDINGS", "matchingSentenceEndings", "matching_sentence_endings"]
  },
  {
    token: "SENTENCE_COMPLETION",
    label: "Sentence Completion",
    short: "SC",
    translationKeys: ["SENTENCE_COMPLETION", "sentenceCompletion", "sentence_completion"]
  },
  {
    token: "SUMMARY_COMPLETION",
    label: "Summary Completion",
    short: "SUM",
    translationKeys: ["SUMMARY_COMPLETION", "summaryCompletion", "summary_completion"]
  },
  {
    token: "TABLE_COMPLETION",
    label: "Table Completion",
    short: "TAB",
    translationKeys: ["TABLE_COMPLETION", "tableCompletion", "table_completion"]
  },
  {
    token: "FLOW_CHART",
    label: "Flow Chart",
    short: "FLOW",
    aliases: ["FLOW_CHART_COMPLETION"],
    translationKeys: ["FLOW_CHART", "flowChart", "flow_chart"]
  },
  {
    token: "MAP",
    label: "Map",
    short: "MAP",
    translationKeys: ["MAP", "map"]
  },
  {
    token: "LABELLING",
    label: "Labelling",
    short: "LBL",
    aliases: ["LABELING", "DIAGRAM_LABELING", "DIAGRAM_LABELLING"],
    translationKeys: ["labelling", "diagramLabeling", "diagram_labeling", "DIAGRAM_LABELING"]
  },
  {
    token: "FORM_COMPLETION",
    label: "Form Completion",
    short: "FORM",
    translationKeys: ["FORM_COMPLETION", "formCompletion", "form_completion"]
  },
  {
    token: "NOTE_COMPLETION",
    label: "Note Completion",
    short: "NOTE",
    translationKeys: ["NOTE_COMPLETION", "noteCompletion", "note_completion"]
  },
  {
    token: "SHORT_ANSWER",
    label: "Short Answer",
    short: "SA",
    translationKeys: ["SHORT_ANSWER", "shortAnswer", "short_answer"]
  },
  {
    token: "SELECTING_FROM_A_LIST",
    label: "Selecting From a List",
    short: "LIST",
    translationKeys: ["SELECTING_FROM_A_LIST", "selectingFromAList", "selecting_from_a_list"]
  },
  {
    token: "TEXT",
    label: "Text Completion",
    short: "TEXT",
    aliases: ["TEXT_COMPLETION"],
    translationKeys: ["text", "TEXT", "textCompletion"]
  },
  {
    token: "MATCHING",
    label: "Matching",
    short: "MATCH",
    translationKeys: ["matching", "MATCHING"]
  },
  {
    token: "TASK1_REPORT",
    label: "Task 1 Report",
    short: "T1",
    aliases: ["TASK_1_REPORT", "TASK1"],
    translationKeys: ["task1Report", "task_1_report", "TASK1_REPORT"]
  },
  {
    token: "TASK2_ESSAY",
    label: "Task 2 Essay",
    short: "T2",
    aliases: ["TASK_2_ESSAY", "TASK2"],
    translationKeys: ["task2Essay", "task_2_essay", "TASK2_ESSAY"]
  }
];

const TOKEN_LOOKUP = new Map<string, QuestionTypeDefinition>();
for (const definition of QUESTION_TYPE_DEFINITIONS) {
  TOKEN_LOOKUP.set(definition.token, definition);
  for (const alias of definition.aliases ?? []) {
    TOKEN_LOOKUP.set(alias, definition);
  }
}

function toCanonicalToken(value: string) {
  return String(value ?? "")
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[\s\/-]+/g, "_")
    .replace(/[^a-zA-Z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toUpperCase();
}

function toCamelCaseToken(token: string) {
  const lower = token.toLowerCase();
  return lower.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase());
}

function dedupe(items: string[]) {
  return [...new Set(items.filter((item) => item.trim().length > 0))];
}

function buildTranslationCandidates(value: string) {
  const raw = String(value ?? "").trim();
  if (!raw) return [];

  const token = toCanonicalToken(raw);
  const definition = TOKEN_LOOKUP.get(token);
  const definitionKeys = definition?.translationKeys ?? [];

  return dedupe([
    ...definitionKeys,
    raw,
    token,
    token.toLowerCase(),
    toCamelCaseToken(token)
  ]);
}

function humanizeToken(token: string) {
  if (!token) return "";
  return token
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((word) => (word.length ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

export function getQuestionTypeHumanLabel(value: string, fallback = "-") {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;

  const token = toCanonicalToken(raw);
  const definition = TOKEN_LOOKUP.get(token);
  if (definition?.label) {
    return definition.label;
  }

  return humanizeToken(token) || fallback;
}

export function getQuestionTypeDisplayLabel(
  value: string,
  options?: {
    questionTypeDisplay?: string | null;
    translate?: QuestionTypeTranslate;
    has?: QuestionTypeHas;
    translationPrefix?: string;
    fallback?: string;
  }
) {
  const display = options?.questionTypeDisplay?.trim();
  if (display) {
    return display;
  }

  const raw = String(value ?? "").trim();
  const fallback = options?.fallback ?? "-";
  if (!raw) {
    return fallback;
  }

  const translate = options?.translate;
  const has = options?.has;
  const translationPrefix = options?.translationPrefix ?? "questionTypes";

  if (translate) {
    const candidates = buildTranslationCandidates(raw);
    for (const candidate of candidates) {
      const messageKey = `${translationPrefix}.${candidate}`;

      if (has) {
        try {
          if (!has(messageKey)) {
            continue;
          }
        } catch {
          // Ignore key-check failures and continue with translation fallback flow.
        }
      }

      try {
        const translated = translate(messageKey);
        if (typeof translated === "string" && translated.trim()) {
          return translated;
        }
      } catch {
        // Ignore missing message errors and continue with the next fallback.
      }
    }
  }

  return getQuestionTypeHumanLabel(raw, fallback);
}

export function getQuestionTypeShortCode(value: string, fallback = "-") {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return fallback;
  }

  const token = toCanonicalToken(raw);
  const definition = TOKEN_LOOKUP.get(token);
  if (definition?.short) {
    return definition.short;
  }

  const words = humanizeToken(token)
    .split(" ")
    .filter(Boolean);

  if (words.length === 1) {
    return words[0].slice(0, 4).toUpperCase();
  }

  return words
    .slice(0, 4)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}
