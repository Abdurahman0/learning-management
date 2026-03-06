import {getAnalyticsDataset} from "@/data/admin/selectors";

export type AnalyticsRangeKey = "last7Days" | "last30Days" | "last3Months";

export type AnalyticsStat = {
  id: "totalTestsTaken" | "avgReadingScore" | "avgListeningScore" | "activeStudents";
  value: string;
  change: string;
  icon: "tests" | "reading" | "listening" | "users";
};

export type ScoreTrendPoint = {
  label: string;
  reading: number;
  listening: number;
};

export type DailyCompletion = {
  day: string;
  value: number;
};

export type QuestionTypeAccuracyItem = {
  id: string;
  typeKey:
    | "multipleChoice"
    | "tfng"
    | "matchingHeadings"
    | "diagramLabeling"
    | "summaryCompletion"
    | "tableCompletion";
  accuracy: number;
  color: string;
};

export type SkillDistribution = {
  reading: number;
  listening: number;
  writing: number;
  speaking: number;
};

export type HardestQuestion = {
  id: string;
  preview: string;
  type: string;
  testName: string;
  accuracy: number;
  attempts: number;
};

export type PassagePerformance = {
  id: string;
  title: string;
  avgScore: number;
  rank: number;
};

export type InsightCard = {
  id: string;
  tone: "default" | "success" | "info";
  badgeKey: "optimize" | "strength" | "segment";
  titleKey: "risingDifficultyGap" | "vocabularyRetention" | "regionalPerformance";
  descriptionKey: "risingDifficultyGapDesc" | "vocabularyRetentionDesc" | "regionalPerformanceDesc";
};

export type AnalyticsRangeDataset = {
  summary: AnalyticsStat[];
  scoreTrend: ScoreTrendPoint[];
  completedPerDay: DailyCompletion[];
  questionTypeAccuracy: QuestionTypeAccuracyItem[];
  skillDistribution: SkillDistribution;
  hardestQuestions: HardestQuestion[];
  passagePerformance: PassagePerformance[];
  insights: InsightCard[];
};

export const ANALYTICS_RANGE_OPTIONS: {value: AnalyticsRangeKey; labelKey: string}[] = [
  {value: "last7Days", labelKey: "dateRanges.last7Days"},
  {value: "last30Days", labelKey: "dateRanges.last30Days"},
  {value: "last3Months", labelKey: "dateRanges.last3Months"}
];

export const ADMIN_ANALYTICS_BY_RANGE: Record<AnalyticsRangeKey, AnalyticsRangeDataset> = {
  last7Days: getAnalyticsDataset("last7Days"),
  last30Days: getAnalyticsDataset("last30Days"),
  last3Months: getAnalyticsDataset("last3Months")
};
