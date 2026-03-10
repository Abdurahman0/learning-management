import {TEST_ENTITIES} from "./tests";
import {PASSAGE_ASSET_ENTITIES, getQuestionVariantSetEntities} from "./content-bank";
import type {
  BuilderQuestion as AdminBuilderQuestion,
  BuilderQuestionBase,
  BuilderQuestionGroup,
  ContentModule,
  MultipleChoiceAnswer,
  QuestionType as AdminQuestionType,
  TFNGAnswer,
  YesNoNotGivenAnswer,
  TextAnswerBuilderQuestion,
  TestModule
} from "@/types/admin";

export type {TestModule};
export type BuilderMode = "editor" | "preview";
export type BuilderStatus = "draft" | "published";
export type QuestionType = AdminQuestionType;
export type BuilderQuestion = AdminBuilderQuestion;
export type TextInputQuestion = TextAnswerBuilderQuestion;
export type QuestionGroup = BuilderQuestionGroup;
export type StructureType = "passage" | "section";

export type BuilderStructureItem = {
  id: string;
  index: number;
  kind: StructureType;
  title: string;
  questionRangeLabel: string;
  content: string[];
  audioLabel?: string;
  linkedPassageId?: string;
  linkedVariantSetId?: string;
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
  {value: "yes_no_not_given", labelKey: "questionTypes.yes_no_not_given"},
  {value: "multiple_choice", labelKey: "questionTypes.multiple_choice"},
  {value: "selecting_from_a_list", labelKey: "questionTypes.selecting_from_a_list"},
  {value: "matching_headings", labelKey: "questionTypes.matching_headings"},
  {value: "matching_information", labelKey: "questionTypes.matching_information"},
  {value: "matching_features", labelKey: "questionTypes.matching_features"},
  {value: "sentence_completion", labelKey: "questionTypes.sentence_completion"},
  {value: "summary_completion", labelKey: "questionTypes.summary_completion"},
  {value: "table_completion", labelKey: "questionTypes.table_completion"},
  {value: "flow_chart", labelKey: "questionTypes.flow_chart"},
  {value: "map", labelKey: "questionTypes.map"},
  {value: "form_completion", labelKey: "questionTypes.form_completion"},
  {value: "note_completion", labelKey: "questionTypes.note_completion"},
  {value: "short_answer", labelKey: "questionTypes.short_answer"}
];

export const QUESTION_TYPE_OPTIONS_BY_MODULE: Record<TestModule, {value: QuestionType; labelKey: string}[]> = {
  reading: [
    {value: "tfng", labelKey: "questionTypes.tfng"},
    {value: "yes_no_not_given", labelKey: "questionTypes.yes_no_not_given"},
    {value: "multiple_choice", labelKey: "questionTypes.multiple_choice"},
    {value: "matching_headings", labelKey: "questionTypes.matching_headings"},
    {value: "matching_information", labelKey: "questionTypes.matching_information"},
    {value: "matching_features", labelKey: "questionTypes.matching_features"},
    {value: "sentence_completion", labelKey: "questionTypes.sentence_completion"},
    {value: "summary_completion", labelKey: "questionTypes.summary_completion"},
    {value: "table_completion", labelKey: "questionTypes.table_completion"},
    {value: "note_completion", labelKey: "questionTypes.note_completion"},
    {value: "short_answer", labelKey: "questionTypes.short_answer"}
  ],
  listening: [
    {value: "multiple_choice", labelKey: "questionTypes.multiple_choice"},
    {value: "selecting_from_a_list", labelKey: "questionTypes.selecting_from_a_list"},
    {value: "form_completion", labelKey: "questionTypes.form_completion"},
    {value: "note_completion", labelKey: "questionTypes.note_completion"},
    {value: "table_completion", labelKey: "questionTypes.table_completion"},
    {value: "summary_completion", labelKey: "questionTypes.summary_completion"},
    {value: "flow_chart", labelKey: "questionTypes.flow_chart"},
    {value: "map", labelKey: "questionTypes.map"},
    {value: "sentence_completion", labelKey: "questionTypes.sentence_completion"},
    {value: "short_answer", labelKey: "questionTypes.short_answer"},
    {value: "matching_information", labelKey: "questionTypes.matching_information"}
  ]
};

export const MODULE_RULES: Record<TestModule, {requiredCount: number; totalQuestions: number; labelKey: string}> = {
  reading: {requiredCount: 3, totalQuestions: 40, labelKey: "structure.readingRule"},
  listening: {requiredCount: 4, totalQuestions: 40, labelKey: "structure.listeningRule"}
};

type BuilderLinkedImportSeed = {
  structureId: string;
  passageId: string;
  variantSetId: string;
};

const BUILDER_LINKED_IMPORT_SEEDS: Record<string, BuilderLinkedImportSeed[]> = {
  "cam-18-r-1": [
    {
      structureId: "cam-18-r-1-p1",
      passageId: "passage-urban-gardens-health",
      variantSetId: "var-urban-a"
    },
    {
      structureId: "cam-18-r-1-p3",
      passageId: "passage-behavioral-economics",
      variantSetId: "var-behavioral-a"
    }
  ],
  "guide-l-4": [
    {
      structureId: "guide-l-4-s1",
      passageId: "passage-campus-services",
      variantSetId: "var-campus-a"
    }
  ]
};

function createQuestionId(type: QuestionType, number: number, suffix = "base") {
  return `${type}-${number}-${suffix}`;
}

function parseRangeLabel(label: string) {
  const numbers = label.match(/\d+/g)?.map(Number) ?? [1, 1];
  return {from: numbers[0] ?? 1, to: numbers[1] ?? numbers[0] ?? 1};
}

function createQuestionBase(type: QuestionType, number: number): BuilderQuestionBase {
  return {
    id: createQuestionId(type, number),
    number,
    type,
    prompt: "",
    explanation: "",
    evidence: "",
    evidenceText: ""
  };
}

export function createDefaultQuestion(type: QuestionType, number: number): BuilderQuestion {
  const base = createQuestionBase(type, number);

  if (type === "tfng") {
    return {...base, type, correctAnswer: "" satisfies TFNGAnswer};
  }

  if (type === "yes_no_not_given") {
    return {...base, type, correctAnswer: "" satisfies YesNoNotGivenAnswer};
  }

  if (type === "multiple_choice") {
    return {
      ...base,
      type,
      options: ["", "", "", ""],
      correctAnswer: "" satisfies MultipleChoiceAnswer
    };
  }

  if (type === "matching_headings") {
    return {...base, type, headings: [], correctAnswer: ""};
  }

  if (
    type === "matching_information" ||
    type === "matching_features" ||
    type === "selecting_from_a_list" ||
    type === "map"
  ) {
    return {
      ...base,
      type,
      items: [],
      choices: [],
      correctAnswer: {}
    };
  }

  return {
    ...base,
    type,
    correctAnswer: [],
    acceptableAnswers: []
  };
}

export function createQuestionGroup(type: QuestionType, from: number, to: number, variantSetId?: string): QuestionGroup {
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
    questions,
    variantSetId
  };
}

function createEmptyGroupsByStructure(structures: BuilderStructureItem[]) {
  return structures.reduce<Record<string, QuestionGroup[]>>((accumulator, structure) => {
    accumulator[structure.id] = [];
    return accumulator;
  }, {});
}

function createImportedQuestionGroupsFromVariant(structure: BuilderStructureItem, variantSet: {id: string; groups: Array<{type: QuestionType; count: number}>}) {
  const range = parseRangeLabel(structure.questionRangeLabel);
  const requiredTotal = range.to - range.from + 1;
  const variantTotal = variantSet.groups.reduce((sum, group) => sum + group.count, 0);

  if (variantTotal !== requiredTotal) {
    return [] as QuestionGroup[];
  }

  let cursor = range.from;
  return variantSet.groups.map((group, index) => {
    const from = cursor;
    const to = cursor + group.count - 1;
    cursor = to + 1;
    return {
      ...createQuestionGroup(group.type, from, to, variantSet.id),
      id: `${variantSet.id}-group-${index + 1}`
    };
  });
}

function createBuilderFromTest(testId: string): AdminBuilderTest | null {
  const test = TEST_ENTITIES.find((item) => item.id === testId);
  if (!test) return null;

  const baseStructures: BuilderStructureItem[] = test.structures.map((structure) => ({
    id: structure.id,
    index: structure.index,
    kind: structure.kind,
    title: structure.title,
    questionRangeLabel: structure.questionRangeLabel,
    content: structure.content.length ? [...structure.content] : [structure.shortDescription],
    audioLabel: structure.audioLabel,
    linkedPassageId: undefined,
    linkedVariantSetId: undefined
  }));
  const questionGroupsByStructure = createEmptyGroupsByStructure(baseStructures);
  const linkedImports = BUILDER_LINKED_IMPORT_SEEDS[testId] ?? [];
  const passageById = new Map(PASSAGE_ASSET_ENTITIES.map((passage) => [passage.id, passage]));
  const variantById = new Map(getQuestionVariantSetEntities().map((variant) => [variant.id, variant]));

  const structures: BuilderStructureItem[] = baseStructures.map((structure) => {
    const link = linkedImports.find((item) => item.structureId === structure.id);
    if (!link) {
      return structure;
    }

    const passage = passageById.get(link.passageId);
    const variantSet = variantById.get(link.variantSetId);
    if (!passage || !variantSet) {
      return structure;
    }
    if (passage.module !== test.module || variantSet.passageId !== passage.id) {
      return structure;
    }

    const generatedGroups = createImportedQuestionGroupsFromVariant(structure, variantSet);
    if (!generatedGroups.length) {
      return structure;
    }
    questionGroupsByStructure[structure.id] = generatedGroups;

    return {
      ...structure,
      title: passage.title,
      content: passage.fullText.length ? [...passage.fullText] : [passage.previewText],
      linkedPassageId: passage.id,
      linkedVariantSetId: variantSet.id
    };
  });

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
  const targetModule: TestModule = testId.includes("listening") ? "listening" : "reading";
  const rule = MODULE_RULES[targetModule];
  const rangeSize = targetModule === "reading" ? [13, 13, 14] : [10, 10, 10, 10];

  const structures: BuilderStructureItem[] = [];
  let from = 1;
  for (let index = 0; index < rule.requiredCount; index += 1) {
    const count = rangeSize[index] ?? 10;
    const to = from + count - 1;
    structures.push({
      id: `${testId}-${targetModule === "reading" ? "p" : "s"}${index + 1}`,
      index: index + 1,
      kind: targetModule === "reading" ? "passage" : "section",
      title: `${targetModule === "reading" ? "Passage" : "Section"} ${index + 1}`,
      questionRangeLabel: `Q${from}-${to}`,
      content: [targetModule === "reading" ? `Write passage ${index + 1} content here.` : `Write transcript for section ${index + 1} here.`],
      audioLabel: targetModule === "listening" ? "" : undefined
    });
    from = to + 1;
  }

  return {
    id: testId,
    name: targetModule === "reading" ? "Custom Reading Test" : "Custom Listening Test",
    book: "Custom",
    module: targetModule,
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

function hasQuestionAnswerContent(question: BuilderQuestion) {
  if (question.type === "tfng") return question.correctAnswer !== "";
  if (question.type === "yes_no_not_given") return question.correctAnswer !== "";
  if (question.type === "multiple_choice") {
    return question.correctAnswer !== "" || question.options.some((option) => option.trim().length > 0);
  }
  if (question.type === "matching_headings") {
    return question.correctAnswer.trim().length > 0 || question.headings.some((heading) => heading.trim().length > 0);
  }
  if (
    question.type === "matching_information" ||
    question.type === "matching_features" ||
    question.type === "selecting_from_a_list" ||
    question.type === "map"
  ) {
    return (
      question.items.some((item) => item.trim().length > 0) ||
      question.choices.some((choice) => choice.trim().length > 0) ||
      Object.values(question.correctAnswer).some((value) => value.trim().length > 0)
    );
  }

  if (Array.isArray(question.correctAnswer)) {
    return question.correctAnswer.some((answer) => answer.trim().length > 0);
  }

  return String(question.correctAnswer ?? "").trim().length > 0;
}

export function hasQuestionContent(groups: QuestionGroup[]) {
  return groups.some((group) =>
    group.questions.some((question) => {
      if (question.prompt.trim().length > 0) return true;
      if ((question.explanation ?? "").trim().length > 0) return true;
      if ((question.evidence ?? "").trim().length > 0) return true;
      if ((question.evidenceText ?? "").trim().length > 0) return true;
      return hasQuestionAnswerContent(question);
    })
  );
}

export function resolveModuleFromKind(kind: StructureType): ContentModule {
  return kind === "passage" ? "reading" : "listening";
}
