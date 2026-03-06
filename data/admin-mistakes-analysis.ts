import {getMistakesAnalysisData, getMistakesRecommendationDefaults} from "@/data/admin/selectors";

export type MistakesDateRangeKey = "last7Days" | "last30Days" | "last3Months";

export type MistakeSummaryStat = {
  id: "mostDifficultType" | "lowestAccuracyPassage" | "avgReadingAccuracy" | "avgListeningAccuracy";
  value: string;
  sublabel: string;
  tone?: "critical" | "warning" | "positive" | "neutral";
};

export type QuestionTypeAccuracyItem = {
  id: string;
  label: string;
  accuracy: number;
  severity: "critical" | "warning" | "good";
};

export type MistakeDistributionItem = {
  module: "reading" | "listening" | "writing" | "speaking";
  percentage: number;
  totalErrors: number;
  color: string;
};

export type MostMissedQuestion = {
  id: string;
  preview: string;
  testName: string;
  type: string;
  accuracyRate: number;
  attempts: number;
  topics: string[];
};

export type PassageDifficultyItem = {
  id: string;
  title: string;
  accuracy: number;
  rank: number;
};

export type MistakeTopic = {
  id: string;
  label: string;
  count: number;
};

export type AiInsight = {
  id: string;
  title: string;
  description: string;
};

export type RecommendationSettings = {
  enabled: boolean;
  threshold: number;
};

export type MistakesRangeDataset = {
  summaryStats: MistakeSummaryStat[];
  questionTypeAccuracy: QuestionTypeAccuracyItem[];
  distribution: MistakeDistributionItem[];
  totalErrorsLabel: string;
  mostMissedQuestions: MostMissedQuestion[];
  passageDifficulty: PassageDifficultyItem[];
  commonTopics: MistakeTopic[];
  aiInsights: AiInsight[];
};

export const MISTAKES_DATE_RANGE_OPTIONS: {value: MistakesDateRangeKey; labelKey: string}[] = [
  {value: "last7Days", labelKey: "dateRanges.last7Days"},
  {value: "last30Days", labelKey: "dateRanges.last30Days"},
  {value: "last3Months", labelKey: "dateRanges.last3Months"}
];

export const DEFAULT_RECOMMENDATION_SETTINGS = getMistakesRecommendationDefaults() satisfies RecommendationSettings;

export const ADMIN_MISTAKES_ANALYSIS_BY_RANGE: Record<MistakesDateRangeKey, MistakesRangeDataset> = {
  last7Days: getMistakesAnalysisData("last7Days"),
  last30Days: getMistakesAnalysisData("last30Days"),
  last3Months: getMistakesAnalysisData("last3Months")
};
