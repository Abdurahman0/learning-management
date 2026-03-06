import {getTestsManagementRows, type TestsRow} from "@/data/admin/selectors";
import type {TestDifficulty, TestModule, TestStatus} from "@/types/admin";

export type {TestStatus, TestDifficulty, TestModule};
export type TestSort = "newest" | "oldest" | "alphabetical";

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
  book: string;
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

export const ADMIN_TESTS = getTestsManagementRows() satisfies TestsRow[];
