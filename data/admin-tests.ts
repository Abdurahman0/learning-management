import {getTestsManagementRows, type TestsRow} from "@/data/admin/selectors";
import type {TestDifficulty, TestModule, TestStatus} from "@/types/admin";

export type {TestStatus, TestDifficulty, TestModule};
export type TestSort = "newest" | "oldest" | "alphabetical";
export type QuestionTypeFilterValue =
  | "all"
  | "TFNG"
  | "YNNG"
  | "MCQ_SINGLE"
  | "MCQ_MULTIPLE"
  | "MATCHING_HEADINGS"
  | "MATCH_PARA_INFO"
  | "CLASSIFICATION"
  | "LIST_SELECTION"
  | "CHOOSING_TITLE"
  | "MATCH_SENT_ENDINGS"
  | "PLAN_MAP_DIAGRAM"
  | "SENTENCE_COMPLETION"
  | "SUMMARY_COMPLETION"
  | "TABLE_COMPLETION"
  | "FLOW_CHART_COMPLETION"
  | "DIAGRAM_COMPLETION"
  | "FORM_COMPLETION"
  | "NOTE_COMPLETION"
  | "SHORT_ANSWER";

export type TestPassage = {
  id: string;
  title: string;
  shortDescription: string;
  questionCount: number;
};

export type TestSection = {
  id: string;
  title: string;
  shortDescription: string;
  questionCount: number;
};

export type AdminTest = {
  id: string;
  name: string;
  module: TestModule;
  testFormat?: "full" | "part" | "both";
  book: string;
  displayOrder?: number | null;
  groupId?: string | null;
  groupName?: string | null;
  questions: number;
  difficulty: TestDifficulty;
  status: TestStatus;
  createdAt: string;
  passages?: TestPassage[];
  sections?: TestSection[];
};

export type ModuleFilterValue = "all" | TestModule;
export type DifficultyFilterValue = "all" | TestDifficulty;
export type StatusFilterValue = "all" | TestStatus;

type FilterOption<Value extends string> = {
  value: Value;
  labelKey: string;
};

export const TEST_MODULE_OPTIONS = [
  {value: "all", labelKey: "filters.module.all"},
  {value: "reading", labelKey: "filters.module.reading"},
  {value: "listening", labelKey: "filters.module.listening"}
] satisfies FilterOption<ModuleFilterValue>[];

export const TEST_DIFFICULTY_OPTIONS = [
  {value: "all", labelKey: "filters.difficulty.all"},
  {value: "beginner", labelKey: "filters.difficulty.beginner"},
  {value: "intermediate", labelKey: "filters.difficulty.intermediate"},
  {value: "advanced", labelKey: "filters.difficulty.advanced"}
] satisfies FilterOption<DifficultyFilterValue>[];

export const TEST_STATUS_OPTIONS = [
  {value: "all", labelKey: "filters.status.all"},
  {value: "published", labelKey: "filters.status.published"},
  {value: "draft", labelKey: "filters.status.draft"}
] satisfies FilterOption<StatusFilterValue>[];

export const TEST_SORT_OPTIONS = [
  {value: "newest", labelKey: "filters.sort.newest"},
  {value: "oldest", labelKey: "filters.sort.oldest"},
  {value: "alphabetical", labelKey: "filters.sort.alphabetical"}
] satisfies FilterOption<TestSort>[];

export const TEST_QUESTION_TYPE_OPTIONS = [
  {value: "all", labelKey: "filters.questionType.all"},
  {value: "TFNG", labelKey: "filters.questionType.tfng"},
  {value: "YNNG", labelKey: "filters.questionType.ynng"},
  {value: "MCQ_SINGLE", labelKey: "filters.questionType.mcqSingle"},
  {value: "MCQ_MULTIPLE", labelKey: "filters.questionType.mcqMultiple"},
  {value: "MATCHING_HEADINGS", labelKey: "filters.questionType.matchingHeadings"},
  {value: "MATCH_PARA_INFO", labelKey: "filters.questionType.matchParaInfo"},
  {value: "CLASSIFICATION", labelKey: "filters.questionType.classification"},
  {value: "LIST_SELECTION", labelKey: "filters.questionType.listSelection"},
  {value: "CHOOSING_TITLE", labelKey: "filters.questionType.choosingTitle"},
  {value: "MATCH_SENT_ENDINGS", labelKey: "filters.questionType.matchSentEndings"},
  {value: "PLAN_MAP_DIAGRAM", labelKey: "filters.questionType.planMapDiagram"},
  {value: "SENTENCE_COMPLETION", labelKey: "filters.questionType.sentenceCompletion"},
  {value: "SUMMARY_COMPLETION", labelKey: "filters.questionType.summaryCompletion"},
  {value: "TABLE_COMPLETION", labelKey: "filters.questionType.tableCompletion"},
  {value: "FLOW_CHART_COMPLETION", labelKey: "filters.questionType.flowChartCompletion"},
  {value: "DIAGRAM_COMPLETION", labelKey: "filters.questionType.diagramCompletion"},
  {value: "FORM_COMPLETION", labelKey: "filters.questionType.formCompletion"},
  {value: "NOTE_COMPLETION", labelKey: "filters.questionType.noteCompletion"},
  {value: "SHORT_ANSWER", labelKey: "filters.questionType.shortAnswer"}
] satisfies FilterOption<QuestionTypeFilterValue>[];

export const ADMIN_TESTS = getTestsManagementRows() satisfies TestsRow[];
