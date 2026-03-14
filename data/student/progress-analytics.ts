import type {
  StudentAccuracyPoint,
  StudentBandProgressPoint,
  StudentLearningInsight,
  StudentModulePerformance,
  StudentPracticeActivity,
  StudentProgressRangeKey,
  StudentProgressSummary,
  StudentWeeklyStudyPoint
} from "@/types/student";

import {STUDENT_PROFILE, STUDENT_TEST_HISTORY} from "./performance";

function getModuleAccuracy(module: "reading" | "listening") {
  const tests = STUDENT_TEST_HISTORY.filter((item) => item.module === module && item.totalQuestions > 1);
  const totalCorrect = tests.reduce((sum, item) => sum + item.correctAnswers, 0);
  const totalQuestions = tests.reduce((sum, item) => sum + item.totalQuestions, 0);

  if (!totalQuestions) {
    return 0;
  }

  return Math.round((totalCorrect / totalQuestions) * 100);
}

const readingAccuracy = getModuleAccuracy("reading");
const listeningAccuracy = getModuleAccuracy("listening");
const latestBandEstimate = [...STUDENT_TEST_HISTORY].sort((left, right) => new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime())[0]?.estimatedBand ?? 0;

export const STUDENT_PROGRESS_SUMMARY: StudentProgressSummary = {
  currentBandEstimate: latestBandEstimate,
  currentBandDelta: 0.3,
  targetBand: STUDENT_PROFILE.targetBand,
  practiceSessions: STUDENT_TEST_HISTORY.length,
  averageAccuracy: Math.round((readingAccuracy + listeningAccuracy) / 2),
  accuracyDelta: 2
};

export const STUDENT_PROGRESS_RANGE_OPTIONS: {value: StudentProgressRangeKey; labelKey: string}[] = [
  {value: "last6Tests", labelKey: "filters.last6Tests"},
  {value: "last12Tests", labelKey: "filters.last12Tests"}
];

export const STUDENT_BAND_PROGRESSION_BY_RANGE: Record<StudentProgressRangeKey, StudentBandProgressPoint[]> = {
  last6Tests: [
    {id: "bp-1", labelKey: "test1", band: 5.5},
    {id: "bp-2", labelKey: "test2", band: 6.0},
    {id: "bp-3", labelKey: "test3", band: 6.2},
    {id: "bp-4", labelKey: "test4", band: 6.8},
    {id: "bp-5", labelKey: "test5", band: 7.1},
    {id: "bp-6", labelKey: "recent", band: 7.5}
  ],
  last12Tests: [
    {id: "bp-1", labelKey: "test1", band: 5.1},
    {id: "bp-2", labelKey: "test2", band: 5.4},
    {id: "bp-3", labelKey: "test3", band: 5.6},
    {id: "bp-4", labelKey: "test4", band: 5.8},
    {id: "bp-5", labelKey: "test5", band: 6.0},
    {id: "bp-6", labelKey: "test6", band: 6.1},
    {id: "bp-7", labelKey: "test7", band: 6.2},
    {id: "bp-8", labelKey: "test8", band: 6.5},
    {id: "bp-9", labelKey: "test9", band: 6.8},
    {id: "bp-10", labelKey: "test10", band: 7.0},
    {id: "bp-11", labelKey: "test11", band: 7.2},
    {id: "bp-12", labelKey: "recent", band: 7.5}
  ]
};

export const STUDENT_MODULE_PERFORMANCE: StudentModulePerformance[] = [
  {module: "reading", percentage: readingAccuracy},
  {module: "listening", percentage: listeningAccuracy},
  {module: "writing", percentage: 65},
  {module: "speaking", percentage: 68}
];

export const STUDENT_ACCURACY_IMPROVEMENT: StudentAccuracyPoint[] = [
  {id: "acc-1", labelKey: "w1", percentage: 62},
  {id: "acc-2", labelKey: "w2", percentage: 65},
  {id: "acc-3", labelKey: "w3", percentage: 69},
  {id: "acc-4", labelKey: "w4", percentage: 73},
  {id: "acc-5", labelKey: "w5", percentage: 74},
  {id: "acc-6", labelKey: "w6", percentage: 76}
];

export const STUDENT_WEEKLY_STUDY_ACTIVITY: StudentWeeklyStudyPoint[] = [
  {id: "week-1", labelKey: "w1", sessions: 8},
  {id: "week-2", labelKey: "w2", sessions: 6},
  {id: "week-3", labelKey: "w3", sessions: 9},
  {id: "week-4", labelKey: "w4", sessions: 7}
];

export const STUDENT_LEARNING_INSIGHTS: StudentLearningInsight[] = [
  {id: "readingImproved", tone: "positive"},
  {id: "listeningConsistent", tone: "neutral"},
  {id: "writingWeakest", tone: "warning"},
  {id: "band7WritingNote", tone: "neutral"}
];

export const STUDENT_RECENT_PRACTICE_ACTIVITY: StudentPracticeActivity[] = [
  {
    id: "activity-1",
    dateKey: "today1045",
    module: "reading",
    questionType: "matchingHeadings",
    accuracy: 78,
    durationMinutes: 12,
    action: "navigate",
    href: "/reading"
  },
  {
    id: "activity-2",
    dateKey: "yesterday",
    module: "listening",
    questionType: "multipleChoice",
    accuracy: 85,
    durationMinutes: 22,
    action: "navigate",
    href: "/listening"
  },
  {
    id: "activity-3",
    dateKey: "oct22",
    module: "writing",
    questionType: "task2Essay",
    accuracy: 62,
    durationMinutes: 40,
    action: "toast"
  }
];
