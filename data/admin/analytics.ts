import type {AnalyticsRangeKey, DailyCompletionEntity, TrendPointEntity, UserTestAttemptEntity} from "@/types/admin";

export type QuestionTypeAccuracySeed = {
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

export type HardQuestionSeed = {
  id: string;
  preview: string;
  type: string;
  testId: string;
  accuracy: number;
  attempts: number;
};

export type PassagePerformanceSeed = {
  id: string;
  title: string;
  avgScore: number;
  rank: number;
};

export const USER_TEST_ATTEMPT_ENTITIES: UserTestAttemptEntity[] = [
  {id: "att-1", userId: "usr-1005", testId: "cam-18-r-1", module: "reading", scoreBand: 7.5, date: "2026-02-18"},
  {id: "att-2", userId: "usr-1004", testId: "guide-l-4", module: "listening", scoreBand: 7.6, date: "2026-02-17"},
  {id: "att-3", userId: "usr-1001", testId: "cam-17-r-2", module: "reading", scoreBand: 6.8, date: "2026-02-16"},
  {id: "att-4", userId: "usr-1002", testId: "cam-19-r-3", module: "reading", scoreBand: 8.1, date: "2026-02-15"},
  {id: "att-5", userId: "usr-1008", testId: "cam-16-l-3", module: "listening", scoreBand: 7.2, date: "2026-02-15"},
  {id: "att-6", userId: "usr-1006", testId: "cam-18-l-1", module: "listening", scoreBand: 8.0, date: "2026-02-14"},
  {id: "att-7", userId: "usr-1003", testId: "practice-r-mock-1", module: "reading", scoreBand: 6.2, date: "2026-02-13"},
  {id: "att-8", userId: "usr-1009", testId: "cam-16-r-4", module: "reading", scoreBand: 8.4, date: "2026-02-13"},
  {id: "att-9", userId: "usr-1010", testId: "cam-14-l-1", module: "listening", scoreBand: 8.0, date: "2026-02-12"},
  {id: "att-10", userId: "usr-1007", testId: "practice-l-mock-2", module: "listening", scoreBand: 5.8, date: "2026-02-11"},
  {id: "att-11", userId: "usr-1005", testId: "cam-11-r-1", module: "reading", scoreBand: 7.0, date: "2026-02-10"},
  {id: "att-12", userId: "usr-1002", testId: "cam-12-l-4", module: "listening", scoreBand: 7.8, date: "2026-02-10"}
];

export const SCORE_TREND_BY_RANGE: Record<AnalyticsRangeKey, TrendPointEntity[]> = {
  last7Days: [
    {label: "D1", reading: 6.3, listening: 6.8},
    {label: "D2", reading: 6.4, listening: 6.7},
    {label: "D3", reading: 6.5, listening: 6.9},
    {label: "D4", reading: 6.7, listening: 7},
    {label: "D5", reading: 6.8, listening: 7.1},
    {label: "D6", reading: 6.7, listening: 7},
    {label: "D7", reading: 6.9, listening: 7.2}
  ],
  last30Days: [
    {label: "W1", reading: 6.2, listening: 6.6},
    {label: "W2", reading: 6.5, listening: 6.8},
    {label: "W3", reading: 7, listening: 7.1},
    {label: "W4", reading: 6.9, listening: 7.3}
  ],
  last3Months: [
    {label: "M1", reading: 6.5, listening: 6.8},
    {label: "M2", reading: 6.7, listening: 7},
    {label: "M3", reading: 6.8, listening: 7.1},
    {label: "M4", reading: 7, listening: 7.3},
    {label: "M5", reading: 7.1, listening: 7.4},
    {label: "M6", reading: 7, listening: 7.3}
  ]
};

export const DAILY_COMPLETION_BY_RANGE: Record<AnalyticsRangeKey, DailyCompletionEntity[]> = {
  last7Days: [
    {day: "Mon", value: 1210},
    {day: "Tue", value: 1630},
    {day: "Wed", value: 1470},
    {day: "Thu", value: 1780},
    {day: "Fri", value: 1950},
    {day: "Sat", value: 1580},
    {day: "Sun", value: 1300}
  ],
  last30Days: [
    {day: "Mon", value: 1320},
    {day: "Tue", value: 1760},
    {day: "Wed", value: 1550},
    {day: "Thu", value: 2140},
    {day: "Fri", value: 2360},
    {day: "Sat", value: 1980},
    {day: "Sun", value: 1640}
  ],
  last3Months: [
    {day: "Mon", value: 4120},
    {day: "Tue", value: 4470},
    {day: "Wed", value: 4250},
    {day: "Thu", value: 4860},
    {day: "Fri", value: 5030},
    {day: "Sat", value: 4720},
    {day: "Sun", value: 4380}
  ]
};

export const QUESTION_TYPE_ACCURACY_BY_RANGE: Record<AnalyticsRangeKey, QuestionTypeAccuracySeed[]> = {
  last7Days: [
    {id: "qt-1", typeKey: "multipleChoice", accuracy: 81, color: "#22c55e"},
    {id: "qt-2", typeKey: "tfng", accuracy: 67, color: "#8b5cf6"},
    {id: "qt-3", typeKey: "matchingHeadings", accuracy: 59, color: "#f59e0b"},
    {id: "qt-4", typeKey: "diagramLabeling", accuracy: 44, color: "#f43f5e"},
    {id: "qt-5", typeKey: "summaryCompletion", accuracy: 52, color: "#38bdf8"},
    {id: "qt-6", typeKey: "tableCompletion", accuracy: 49, color: "#a78bfa"}
  ],
  last30Days: [
    {id: "qt-1", typeKey: "multipleChoice", accuracy: 82, color: "#22c55e"},
    {id: "qt-2", typeKey: "tfng", accuracy: 64, color: "#8b5cf6"},
    {id: "qt-3", typeKey: "matchingHeadings", accuracy: 58, color: "#f59e0b"},
    {id: "qt-4", typeKey: "diagramLabeling", accuracy: 42, color: "#f43f5e"},
    {id: "qt-5", typeKey: "summaryCompletion", accuracy: 51, color: "#38bdf8"},
    {id: "qt-6", typeKey: "tableCompletion", accuracy: 47, color: "#a78bfa"}
  ],
  last3Months: [
    {id: "qt-1", typeKey: "multipleChoice", accuracy: 84, color: "#22c55e"},
    {id: "qt-2", typeKey: "tfng", accuracy: 68, color: "#8b5cf6"},
    {id: "qt-3", typeKey: "matchingHeadings", accuracy: 61, color: "#f59e0b"},
    {id: "qt-4", typeKey: "diagramLabeling", accuracy: 46, color: "#f43f5e"},
    {id: "qt-5", typeKey: "summaryCompletion", accuracy: 56, color: "#38bdf8"},
    {id: "qt-6", typeKey: "tableCompletion", accuracy: 52, color: "#a78bfa"}
  ]
};

export const SKILL_DISTRIBUTION_BY_RANGE: Record<AnalyticsRangeKey, {reading: number; listening: number; writing: number; speaking: number}> = {
  last7Days: {reading: 70, listening: 75, writing: 62, speaking: 64},
  last30Days: {reading: 74, listening: 78, writing: 66, speaking: 69},
  last3Months: {reading: 77, listening: 80, writing: 70, speaking: 72}
};

export const HARDEST_QUESTIONS_BY_RANGE: Record<AnalyticsRangeKey, HardQuestionSeed[]> = {
  last7Days: [
    {id: "hq-1", preview: "The writer suggests that...", type: "TFNG", testId: "cam-19-r-3", accuracy: 18.4, attempts: 1320},
    {id: "hq-2", preview: "Label the diagram of...", type: "Diagram", testId: "guide-l-4", accuracy: 22.1, attempts: 1180},
    {id: "hq-3", preview: "Which paragraph contains...", type: "Matching", testId: "cam-18-r-1", accuracy: 27.8, attempts: 1490},
    {id: "hq-4", preview: "Choose the best heading for...", type: "Headings", testId: "cam-17-r-2", accuracy: 29.3, attempts: 1265}
  ],
  last30Days: [
    {id: "hq-1", preview: "The writer suggests that...", type: "TFNG", testId: "cam-18-r-1", accuracy: 18.4, attempts: 4502},
    {id: "hq-2", preview: "Label the flowchart regarding...", type: "Diagram", testId: "guide-l-4", accuracy: 22.1, attempts: 3890},
    {id: "hq-3", preview: "Which paragraph contains...", type: "Matching", testId: "cam-19-r-3", accuracy: 28.7, attempts: 6120},
    {id: "hq-4", preview: "Choose three letters A-G", type: "Multiple", testId: "cam-16-r-4", accuracy: 31.5, attempts: 5744}
  ],
  last3Months: [
    {id: "hq-1", preview: "The writer suggests that...", type: "TFNG", testId: "cam-18-r-1", accuracy: 17.8, attempts: 15870},
    {id: "hq-2", preview: "Label the flowchart regarding...", type: "Diagram", testId: "guide-l-4", accuracy: 21.4, attempts: 12945},
    {id: "hq-3", preview: "Which paragraph contains...", type: "Matching", testId: "cam-19-r-3", accuracy: 26.9, attempts: 18230},
    {id: "hq-4", preview: "Choose three letters A-G", type: "Multiple", testId: "cam-16-r-4", accuracy: 30.2, attempts: 17060}
  ]
};

export const PASSAGE_PERFORMANCE_BY_RANGE: Record<AnalyticsRangeKey, PassagePerformanceSeed[]> = {
  last7Days: [
    {id: "pp-1", title: "Natural Sciences", avgScore: 5.3, rank: 1},
    {id: "pp-2", title: "Historical Accounts", avgScore: 5.8, rank: 2},
    {id: "pp-3", title: "Psychology Research", avgScore: 6.0, rank: 3}
  ],
  last30Days: [
    {id: "pp-1", title: "Natural Sciences", avgScore: 5.2, rank: 1},
    {id: "pp-2", title: "Historical Accounts", avgScore: 5.8, rank: 2},
    {id: "pp-3", title: "Psychology Research", avgScore: 6.1, rank: 3}
  ],
  last3Months: [
    {id: "pp-1", title: "Natural Sciences", avgScore: 5.4, rank: 1},
    {id: "pp-2", title: "Historical Accounts", avgScore: 5.9, rank: 2},
    {id: "pp-3", title: "Psychology Research", avgScore: 6.2, rank: 3}
  ]
};
