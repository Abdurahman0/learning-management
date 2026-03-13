export type StudentMistakeRangeKey = "last7Days" | "last30Days" | "last3Months";

export type StudentMistakeQuestionTypeKey =
  | "matchingHeadings"
  | "trueFalseNotGiven"
  | "multipleChoice"
  | "sentenceCompletion"
  | "labelling"
  | "summaryCompletion";

export type StudentMistakeModuleKey = "reading" | "listening" | "writing" | "speaking";

export type StudentErrorPatternKey = "keywordMatching" | "timeManagement" | "misreadingInstructions";

export type StudentFocusAreaKey = "practiceMatchingHeadings" | "reviewParaphrasingStrategy" | "retakeReadingDrill";

export type StudentMistakeSummary = {
  totalMistakesReviewed: number;
  reviewedDelta: number;
  mostDifficultType: StudentMistakeQuestionTypeKey;
  weakestModule: StudentMistakeModuleKey;
  accuracyTrend: number;
};

export type StudentQuestionTypeMistakePoint = {
  id: string;
  type: StudentMistakeQuestionTypeKey;
  mistakes: number;
};

export type StudentModuleDistributionPoint = {
  id: string;
  module: StudentMistakeModuleKey;
  share: number;
  color: string;
};

export type StudentMistakeAnalysisSnapshot = {
  summary: StudentMistakeSummary;
  questionTypeMistakes: StudentQuestionTypeMistakePoint[];
  moduleDistribution: StudentModuleDistributionPoint[];
};

export type StudentErrorPattern = {
  id: StudentErrorPatternKey;
  icon: "keyword" | "time" | "instructions";
};

export type StudentFocusAreaAction = {
  id: StudentFocusAreaKey;
  module: StudentMistakeModuleKey;
  action: "navigate" | "toast";
  href?: "/dashboard" | "/reading";
};

export const STUDENT_MISTAKE_RANGE_OPTIONS: {value: StudentMistakeRangeKey; labelKey: string}[] = [
  {value: "last7Days", labelKey: "filters.last7Days"},
  {value: "last30Days", labelKey: "filters.last30Days"},
  {value: "last3Months", labelKey: "filters.last3Months"}
];

export const STUDENT_MISTAKE_ANALYSIS_BY_RANGE: Record<StudentMistakeRangeKey, StudentMistakeAnalysisSnapshot> = {
  last7Days: {
    summary: {
      totalMistakesReviewed: 21,
      reviewedDelta: 4,
      mostDifficultType: "matchingHeadings",
      weakestModule: "reading",
      accuracyTrend: 3
    },
    questionTypeMistakes: [
      {id: "qt-1", type: "matchingHeadings", mistakes: 7},
      {id: "qt-2", type: "trueFalseNotGiven", mistakes: 4},
      {id: "qt-3", type: "multipleChoice", mistakes: 3},
      {id: "qt-4", type: "sentenceCompletion", mistakes: 4},
      {id: "qt-5", type: "labelling", mistakes: 1},
      {id: "qt-6", type: "summaryCompletion", mistakes: 2}
    ],
    moduleDistribution: [
      {id: "module-1", module: "reading", share: 52, color: "#6366f1"},
      {id: "module-2", module: "listening", share: 27, color: "#3b82f6"},
      {id: "module-3", module: "writing", share: 13, color: "#818cf8"},
      {id: "module-4", module: "speaking", share: 8, color: "#38bdf8"}
    ]
  },
  last30Days: {
    summary: {
      totalMistakesReviewed: 84,
      reviewedDelta: 12,
      mostDifficultType: "matchingHeadings",
      weakestModule: "reading",
      accuracyTrend: 6
    },
    questionTypeMistakes: [
      {id: "qt-1", type: "matchingHeadings", mistakes: 22},
      {id: "qt-2", type: "trueFalseNotGiven", mistakes: 15},
      {id: "qt-3", type: "multipleChoice", mistakes: 10},
      {id: "qt-4", type: "sentenceCompletion", mistakes: 18},
      {id: "qt-5", type: "labelling", mistakes: 7},
      {id: "qt-6", type: "summaryCompletion", mistakes: 12}
    ],
    moduleDistribution: [
      {id: "module-1", module: "reading", share: 56, color: "#6366f1"},
      {id: "module-2", module: "listening", share: 24, color: "#3b82f6"},
      {id: "module-3", module: "writing", share: 12, color: "#818cf8"},
      {id: "module-4", module: "speaking", share: 8, color: "#38bdf8"}
    ]
  },
  last3Months: {
    summary: {
      totalMistakesReviewed: 247,
      reviewedDelta: 19,
      mostDifficultType: "matchingHeadings",
      weakestModule: "reading",
      accuracyTrend: 9
    },
    questionTypeMistakes: [
      {id: "qt-1", type: "matchingHeadings", mistakes: 58},
      {id: "qt-2", type: "trueFalseNotGiven", mistakes: 44},
      {id: "qt-3", type: "multipleChoice", mistakes: 30},
      {id: "qt-4", type: "sentenceCompletion", mistakes: 49},
      {id: "qt-5", type: "labelling", mistakes: 24},
      {id: "qt-6", type: "summaryCompletion", mistakes: 42}
    ],
    moduleDistribution: [
      {id: "module-1", module: "reading", share: 54, color: "#6366f1"},
      {id: "module-2", module: "listening", share: 25, color: "#3b82f6"},
      {id: "module-3", module: "writing", share: 13, color: "#818cf8"},
      {id: "module-4", module: "speaking", share: 8, color: "#38bdf8"}
    ]
  }
};

export const STUDENT_COMMON_ERROR_PATTERNS: StudentErrorPattern[] = [
  {id: "keywordMatching", icon: "keyword"},
  {id: "timeManagement", icon: "time"},
  {id: "misreadingInstructions", icon: "instructions"}
];

export const STUDENT_RECOMMENDED_FOCUS_AREAS: StudentFocusAreaAction[] = [
  {id: "practiceMatchingHeadings", module: "reading", action: "navigate", href: "/reading"},
  {id: "reviewParaphrasingStrategy", module: "reading", action: "toast"},
  {id: "retakeReadingDrill", module: "reading", action: "navigate", href: "/dashboard"}
];

