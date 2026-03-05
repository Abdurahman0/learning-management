export type DashboardUserSummary = {
  name: string;
  currentBand: number;
  goalBand: number;
  testsTaken: number;
  avgScore: string;
  streakDays: number;
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
export type WeakArea = {id: string; title: string; module: string; accuracy: string; actionLabel: string};
export type RecentHistoryItem = {id: string; testName: string; date: string; module: string; score: string};
export type Achievement = {id: string; title: string; subtitle: string; earned: boolean};

export const DASHBOARD_DATA = {
  userSummary: {
    name: "Alex",
    currentBand: 6.5,
    goalBand: 7.0,
    testsTaken: 24,
    avgScore: "32/40",
    streakDays: 5,
    bandsAway: 0.5
  } satisfies DashboardUserSummary,
  continueTest: {
    id: "cam-19-t2-reading",
    module: "Reading Section",
    title: "Cambridge IELTS 19 Test 2",
    level: "Academic",
    lastActiveLabel: "2 hours ago",
    progressQuestions: 15,
    totalQuestions: 40
  } satisfies ContinueTest,
  scoreProgress: [
    {label: "Test 15", band: 6.2},
    {label: "Test 16", band: 6.3},
    {label: "Test 17", band: 6.4},
    {label: "Test 18", band: 6.5},
    {label: "Test 19", band: 6.4},
    {label: "Test 20", band: 6.6},
    {label: "Test 21", band: 6.7},
    {label: "Test 22", band: 6.8},
    {label: "Test 23", band: 6.9},
    {label: "Latest", band: 6.8}
  ] satisfies ScorePoint[],
  skillsSnapshot: [
    {key: "listening", band: 7.5},
    {key: "reading", band: 6.5},
    {key: "writing", band: 6.0},
    {key: "speaking", band: 6.5}
  ] satisfies SkillItem[],
  overallJourneyPct: 75,
  weakAreas: [
    {id: "diagram", title: "Diagram Labeling", module: "Reading", accuracy: "52%", actionLabel: "Practice now"},
    {id: "lexical", title: "Task 2 - Lexical Resource", module: "Writing", accuracy: "5.5", actionLabel: "View lessons"},
    {id: "summary", title: "Summary Completion", module: "Listening", accuracy: "58%", actionLabel: "Practice now"}
  ] satisfies WeakArea[],
  aiRecommendation: {
    tag: "Tutor feedback",
    message:
      "Alex, your listening scores are consistent. Focus this week on note-taking and paraphrase matching in Reading to close the gap to Band 7."
  },
  recentHistory: [
    {id: "h1", testName: "Cambridge 19 - Test 1", date: "Aug 12, 2023", module: "Reading", score: "7.0"},
    {id: "h2", testName: "General Training - Mock A", date: "Aug 10, 2023", module: "Listening", score: "7.5"},
    {id: "h3", testName: "Cambridge 18 - Test 4", date: "Aug 05, 2023", module: "Writing", score: "6.0"}
  ] satisfies RecentHistoryItem[],
  achievements: [
    {id: "streak", title: "5 Day Streak", subtitle: "Consistency badge", earned: true},
    {id: "band", title: "Band 7 Achiever", subtitle: "Milestone badge", earned: true},
    {id: "perfect", title: "Perfect Score", subtitle: "Challenge badge", earned: false}
  ] satisfies Achievement[]
};

export const DASHBOARD_DEMO = DASHBOARD_DATA;
export const dashboardDemo = DASHBOARD_DATA;
