import {TEST_ENTITIES} from "@/data/admin/tests";
import type {TestModule} from "@/types/admin";

export type {TestModule};
export type BuilderMode = "editor" | "preview";
export type BuilderStatus = "draft" | "published";

export type ReadingPassage = {
  id: string;
  title: string;
  questionRangeLabel: string;
  content: string[];
};

export type ListeningSection = {
  id: string;
  title: string;
  questionRangeLabel: string;
  transcript: string[];
  audioLabel?: string;
};

export type QuestionType =
  | "tfng"
  | "multiple_choice"
  | "matching_headings"
  | "sentence_completion"
  | "summary_completion"
  | "table_completion"
  | "diagram_labeling"
  | "form_completion"
  | "note_completion"
  | "matching_information"
  | "short_answer";

export type QuestionBase = {
  id: string;
  number: number;
  type: QuestionType;
  prompt: string;
  explanation?: string;
  evidenceText?: string;
};

export type TFNGQuestion = QuestionBase & {
  type: "tfng";
  correctAnswer: "TRUE" | "FALSE" | "NOT GIVEN";
};

export type MultipleChoiceQuestion = QuestionBase & {
  type: "multiple_choice";
  options: string[];
  correctAnswer: "A" | "B" | "C" | "D";
};

export type MatchingHeadingsQuestion = QuestionBase & {
  type: "matching_headings";
  headings: string[];
  correctAnswer: string;
};

export type TextInputQuestion = QuestionBase & {
  type:
    | "sentence_completion"
    | "summary_completion"
    | "table_completion"
    | "diagram_labeling"
    | "form_completion"
    | "note_completion"
    | "short_answer";
  correctAnswer: string | string[];
};

export type MatchingInformationQuestion = QuestionBase & {
  type: "matching_information";
  items: string[];
  choices: string[];
  correctAnswer: Record<string, string>;
};

export type BuilderQuestion =
  | TFNGQuestion
  | MultipleChoiceQuestion
  | MatchingHeadingsQuestion
  | TextInputQuestion
  | MatchingInformationQuestion;

export type QuestionGroup = {
  id: string;
  title: string;
  type: QuestionType;
  from: number;
  to: number;
  questions: BuilderQuestion[];
};

export type StructureType = "passage" | "section";

export type BuilderStructureItem = {
  id: string;
  index: number;
  kind: StructureType;
  title: string;
  questionRangeLabel: string;
  content: string[];
  audioLabel?: string;
};

export type AdminBuilderTest = {
  id: string;
  name: string;
  book: string;
  module: TestModule;
  status: BuilderStatus;
  structures: BuilderStructureItem[];
  questionGroupsByStructure: Record<string, QuestionGroup[]>;
};

export const QUESTION_TYPE_OPTIONS: {value: QuestionType; labelKey: string}[] = [
  {value: "tfng", labelKey: "questionTypes.tfng"},
  {value: "multiple_choice", labelKey: "questionTypes.multiple_choice"},
  {value: "matching_headings", labelKey: "questionTypes.matching_headings"},
  {value: "sentence_completion", labelKey: "questionTypes.sentence_completion"},
  {value: "summary_completion", labelKey: "questionTypes.summary_completion"},
  {value: "table_completion", labelKey: "questionTypes.table_completion"},
  {value: "diagram_labeling", labelKey: "questionTypes.diagram_labeling"},
  {value: "form_completion", labelKey: "questionTypes.form_completion"},
  {value: "note_completion", labelKey: "questionTypes.note_completion"},
  {value: "matching_information", labelKey: "questionTypes.matching_information"},
  {value: "short_answer", labelKey: "questionTypes.short_answer"}
];

export const QUESTION_TYPE_OPTIONS_BY_MODULE: Record<TestModule, {value: QuestionType; labelKey: string}[]> = {
  reading: [
    {value: "tfng", labelKey: "questionTypes.tfng"},
    {value: "multiple_choice", labelKey: "questionTypes.multiple_choice"},
    {value: "matching_headings", labelKey: "questionTypes.matching_headings"},
    {value: "matching_information", labelKey: "questionTypes.matching_information"},
    {value: "sentence_completion", labelKey: "questionTypes.sentence_completion"},
    {value: "summary_completion", labelKey: "questionTypes.summary_completion"},
    {value: "table_completion", labelKey: "questionTypes.table_completion"},
    {value: "diagram_labeling", labelKey: "questionTypes.diagram_labeling"},
    {value: "short_answer", labelKey: "questionTypes.short_answer"}
  ],
  listening: [
    {value: "multiple_choice", labelKey: "questionTypes.multiple_choice"},
    {value: "form_completion", labelKey: "questionTypes.form_completion"},
    {value: "note_completion", labelKey: "questionTypes.note_completion"},
    {value: "table_completion", labelKey: "questionTypes.table_completion"},
    {value: "summary_completion", labelKey: "questionTypes.summary_completion"},
    {value: "diagram_labeling", labelKey: "questionTypes.diagram_labeling"},
    {value: "sentence_completion", labelKey: "questionTypes.sentence_completion"},
    {value: "short_answer", labelKey: "questionTypes.short_answer"},
    {value: "matching_information", labelKey: "questionTypes.matching_information"}
  ]
};

export const MODULE_RULES: Record<TestModule, {requiredCount: number; totalQuestions: number; labelKey: string}> = {
  reading: {requiredCount: 3, totalQuestions: 40, labelKey: "structure.readingRule"},
  listening: {requiredCount: 4, totalQuestions: 40, labelKey: "structure.listeningRule"}
};

function createQuestionId(type: QuestionType, number: number, suffix = "base") {
  return `${type}-${number}-${suffix}`;
}

function parseRangeLabel(label: string) {
  const numbers = label.match(/\d+/g)?.map(Number) ?? [1, 1];
  return {from: numbers[0] ?? 1, to: numbers[1] ?? numbers[0] ?? 1};
}

export function createDefaultQuestion(type: QuestionType, number: number): BuilderQuestion {
  const base: QuestionBase = {
    id: createQuestionId(type, number),
    number,
    type,
    prompt: ""
  };

  if (type === "tfng") {
    return {...base, type, correctAnswer: "TRUE", explanation: ""};
  }

  if (type === "multiple_choice") {
    return {...base, type, options: ["", "", "", ""], correctAnswer: "A", explanation: ""};
  }

  if (type === "matching_headings") {
    return {...base, type, headings: ["i", "ii", "iii", "iv"], correctAnswer: "", explanation: ""};
  }

  if (type === "matching_information") {
    return {
      ...base,
      type,
      items: ["A", "B", "C"],
      choices: ["i", "ii", "iii", "iv"],
      correctAnswer: {A: "i", B: "ii", C: "iii"},
      explanation: ""
    };
  }

  return {...base, type, correctAnswer: "", explanation: ""};
}

export function createQuestionGroup(type: QuestionType, from: number, to: number): QuestionGroup {
  const questions: BuilderQuestion[] = [];
  for (let number = from; number <= to; number += 1) {
    questions.push(createDefaultQuestion(type, number));
  }

  return {
    id: `group-${type}-${from}-${to}`,
    title: `Questions ${from}-${to}`,
    type,
    from,
    to,
    questions
  };
}

function createEmptyGroupsByStructure(structures: BuilderStructureItem[]) {
  return structures.reduce<Record<string, QuestionGroup[]>>((accumulator, structure) => {
    accumulator[structure.id] = [];
    return accumulator;
  }, {});
}

function createSeedGroup(structure: BuilderStructureItem): QuestionGroup[] {
  const range = parseRangeLabel(structure.questionRangeLabel);
  const to = Math.min(range.from + 4, range.to);
  return [
    {
      ...createQuestionGroup(structure.kind === "passage" ? "tfng" : "form_completion", range.from, to),
      id: `${structure.id}-g1`
    }
  ];
}

function createBuilderFromTest(testId: string): AdminBuilderTest | null {
  const test = TEST_ENTITIES.find((item) => item.id === testId);
  if (!test) return null;

  const structures: BuilderStructureItem[] = test.structures.map((structure) => ({
    id: structure.id,
    index: structure.index,
    kind: structure.kind,
    title: structure.title,
    questionRangeLabel: structure.questionRangeLabel,
    content: structure.content.length ? [...structure.content] : [structure.shortDescription],
    audioLabel: structure.audioLabel
  }));

  const questionGroupsByStructure = createEmptyGroupsByStructure(structures);
  if (structures[0]) {
    questionGroupsByStructure[structures[0].id] = createSeedGroup(structures[0]);
  }

  return {
    id: test.id,
    name: test.name,
    book: test.book,
    module: test.module,
    status: test.status,
    structures,
    questionGroupsByStructure
  };
}

function createCustomBuilderTest(testId: string): AdminBuilderTest {
  const module: TestModule = testId.includes("listening") ? "listening" : "reading";
  const rule = MODULE_RULES[module];
  const rangeSize = module === "reading" ? [13, 13, 14] : [10, 10, 10, 10];

  const structures: BuilderStructureItem[] = [];
  let from = 1;
  for (let index = 0; index < rule.requiredCount; index += 1) {
    const count = rangeSize[index] ?? 10;
    const to = from + count - 1;
    structures.push({
      id: `${testId}-${module === "reading" ? "p" : "s"}${index + 1}`,
      index: index + 1,
      kind: module === "reading" ? "passage" : "section",
      title: `${module === "reading" ? "Passage" : "Section"} ${index + 1}`,
      questionRangeLabel: `Q${from}-${to}`,
      content: [module === "reading" ? `Write passage ${index + 1} content here.` : `Write transcript for section ${index + 1} here.`],
      audioLabel: module === "listening" ? "" : undefined
    });
    from = to + 1;
  }

  return {
    id: testId,
    name: module === "reading" ? "Custom Reading Test" : "Custom Listening Test",
    book: "Custom",
    module,
    status: "draft",
    structures,
    questionGroupsByStructure: createEmptyGroupsByStructure(structures)
  };
}

export function getInitialBuilderTest(testId: string) {
  const fromShared = createBuilderFromTest(testId);
  if (fromShared) {
    return JSON.parse(JSON.stringify(fromShared)) as AdminBuilderTest;
  }

  if (testId.startsWith("custom-") || testId === "new") {
    return createCustomBuilderTest(testId);
  }

  return createCustomBuilderTest("custom-reading-1");
}

export function getStructureRange(item: BuilderStructureItem) {
  return parseRangeLabel(item.questionRangeLabel);
}
