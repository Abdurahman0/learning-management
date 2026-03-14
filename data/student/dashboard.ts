import {calculateStudyStreak} from "@/lib/student/streak";
import type {StudentModuleKey, StudentTestRecord} from "@/types/student";

import {STUDENT_ONE_TO_ONE_SESSIONS} from "./sessions";
import {STUDENT_PROFILE, STUDENT_STREAK_CONFIG, STUDENT_TEST_HISTORY} from "./performance";

export type DashboardUserSummary = {
  name: string;
  currentBand: number;
  goalBand: number;
  testsTaken: number;
  readingAccuracy: number;
  listeningAccuracy: number;
  streakDays: number;
  streakIncreasedToday: boolean;
  bandsAway: number;
};

export type ContinueTest = {
  id: string;
  module: string;
  title: string;
  level: string;
  lastActiveLabel: string;
  progressQuestions: number;
  totalQuestions: number;
};

export type ScorePoint = {label: string; band: number};
export type SkillItem = {key: "listening" | "reading" | "writing" | "speaking"; band: number};
export type WeakArea = {id: string; title: string; module: StudentModuleKey; accuracy: string; actionLabel: string};
export type RecentHistoryItem = {id: string; testName: string; date: string; module: StudentModuleKey; score: string};
export type Achievement = {id: string; title: string; subtitle: string; earned: boolean};

type MetricSummary = {
  currentBand: number;
  readingAccuracy: number;
  listeningAccuracy: number;
};

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function getModuleAccuracy(module: Extract<StudentModuleKey, "reading" | "listening">, tests: StudentTestRecord[]) {
  const moduleTests = tests.filter((test) => test.module === module && test.totalQuestions > 1);
  const totalCorrect = moduleTests.reduce((sum, test) => sum + test.correctAnswers, 0);
  const totalQuestions = moduleTests.reduce((sum, test) => sum + test.totalQuestions, 0);

  if (!totalQuestions) {
    return 0;
  }

  return Math.round((totalCorrect / totalQuestions) * 100);
}

function getLatestModuleBand(module: StudentModuleKey, tests: StudentTestRecord[]) {
  const latest = [...tests]
    .filter((test) => test.module === module)
    .sort((left, right) => new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime())[0];

  return latest?.estimatedBand ?? 0;
}

function buildMetricSummary(tests: StudentTestRecord[]): MetricSummary {
  const latestByDate = [...tests].sort((left, right) => new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime())[0];

  return {
    currentBand: latestByDate?.estimatedBand ?? 0,
    readingAccuracy: getModuleAccuracy("reading", tests),
    listeningAccuracy: getModuleAccuracy("listening", tests)
  };
}

const metrics = buildMetricSummary(STUDENT_TEST_HISTORY);
const sortedByDate = [...STUDENT_TEST_HISTORY].sort((left, right) => new Date(left.completedAt).getTime() - new Date(right.completedAt).getTime());
const lastTenTests = sortedByDate.slice(-10);
const dashboardDateFormatter = new Intl.DateTimeFormat("en-US", {month: "short", day: "2-digit", year: "numeric"});
const STUDENT_DASHBOARD_REFERENCE_DATE = new Date("2026-03-14T12:00:00.000Z");
const streak = calculateStudyStreak({
  tests: STUDENT_TEST_HISTORY,
  initialStreakDays: STUDENT_STREAK_CONFIG.initialStreakDays,
  windowStartDate: STUDENT_STREAK_CONFIG.windowStartDate,
  referenceDate: STUDENT_DASHBOARD_REFERENCE_DATE
});

export const DASHBOARD_DATA = {
  userSummary: {
    name: STUDENT_PROFILE.name,
    currentBand: round(metrics.currentBand),
    goalBand: STUDENT_PROFILE.targetBand,
    testsTaken: STUDENT_TEST_HISTORY.length,
    readingAccuracy: metrics.readingAccuracy,
    listeningAccuracy: metrics.listeningAccuracy,
    streakDays: streak.currentStreakDays,
    streakIncreasedToday: streak.completedTestToday,
    bandsAway: round(Math.max(0, STUDENT_PROFILE.targetBand - metrics.currentBand))
  } satisfies DashboardUserSummary,
  continueTest: {
    id: "cam-20-t1-reading",
    module: "Reading Section",
    title: "Cambridge IELTS 20 Test 1",
    level: "Academic",
    lastActiveLabel: "2 hours ago",
    progressQuestions: 18,
    totalQuestions: 40
  } satisfies ContinueTest,
  scoreProgress: lastTenTests.map((test, index) => ({
    label: index === lastTenTests.length - 1 ? "Latest" : `Test ${index + 1}`,
    band: round(test.estimatedBand)
  })) satisfies ScorePoint[],
  skillsSnapshot: [
    {key: "listening", band: round(getLatestModuleBand("listening", STUDENT_TEST_HISTORY))},
    {key: "reading", band: round(getLatestModuleBand("reading", STUDENT_TEST_HISTORY))},
    {key: "writing", band: round(getLatestModuleBand("writing", STUDENT_TEST_HISTORY))},
    {key: "speaking", band: round(getLatestModuleBand("speaking", STUDENT_TEST_HISTORY))}
  ] satisfies SkillItem[],
  overallJourneyPct: Math.round((metrics.currentBand / STUDENT_PROFILE.targetBand) * 100),
  weakAreas: [
    {
      id: "reading-accuracy",
      title: "Matching Headings Accuracy",
      module: "reading",
      accuracy: `${metrics.readingAccuracy}%`,
      actionLabel: "Practice now"
    },
    {
      id: "listening-distractors",
      title: "Listening Distractor Control",
      module: "listening",
      accuracy: `${metrics.listeningAccuracy}%`,
      actionLabel: "Practice now"
    },
    {
      id: "writing-cohesion",
      title: "Task 2 Cohesion",
      module: "writing",
      accuracy: "6.0",
      actionLabel: "View lessons"
    }
  ] satisfies WeakArea[],
  aiRecommendation: {
    tag: "Tutor insight",
    message:
      "Keep daily reading drills and book a 1-to-1 session this week to improve paraphrase matching and close the gap to your target band."
  },
  recentHistory: [...sortedByDate]
    .sort((left, right) => new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime())
    .slice(0, 3)
    .map((attempt) => ({
      id: attempt.id,
      testName: attempt.testName,
      date: dashboardDateFormatter.format(new Date(attempt.completedAt)),
      module: attempt.module,
      score: attempt.totalQuestions > 1 ? `${attempt.correctAnswers}/${attempt.totalQuestions}` : attempt.estimatedBand.toFixed(1)
    })) satisfies RecentHistoryItem[],
  achievements: [
    {id: "streak", title: `${streak.currentStreakDays} Day Streak`, subtitle: "Consistency badge", earned: true},
    {id: "band", title: "Band 7 Sprint", subtitle: "Milestone badge", earned: metrics.currentBand >= 6.5},
    {id: "perfect", title: "Full Focus Week", subtitle: "Challenge badge", earned: streak.currentStreakDays >= 7}
  ] satisfies Achievement[],
  oneToOneSummary: {
    totalSessions: STUDENT_ONE_TO_ONE_SESSIONS.length,
    upcomingSessions: STUDENT_ONE_TO_ONE_SESSIONS.filter((session) => session.status === "scheduled" || session.status === "pending").length
  }
};
