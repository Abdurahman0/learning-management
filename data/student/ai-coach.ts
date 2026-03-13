import {STUDENT_MISTAKE_ANALYSIS_BY_RANGE} from "@/data/student-mistake-analysis";
import {STUDENT_PROGRESS_SUMMARY, STUDENT_MODULE_PERFORMANCE, STUDENT_RECENT_PRACTICE_ACTIVITY} from "@/data/student/progress-analytics";
import {STUDENT_SAVED_QUESTIONS} from "@/data/student/study-bank";
import type {
  StudentCoachAccuracyRow,
  StudentCoachMessage,
  StudentCoachRecommendation,
  StudentCoachStrategyCard,
  StudentModuleKey
} from "@/types/student";

const latestMistakes = STUDENT_MISTAKE_ANALYSIS_BY_RANGE.last30Days;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function buildAccuracyByType(): StudentCoachAccuracyRow[] {
  const coachTypes = ["matchingHeadings", "trueFalseNotGiven", "multipleChoice", "sentenceCompletion"] as const;
  const selected = latestMistakes.questionTypeMistakes.filter(
    (item): item is typeof item & {type: (typeof coachTypes)[number]} =>
      coachTypes.includes(item.type as (typeof coachTypes)[number])
  );
  const maxMistakes = Math.max(1, ...selected.map((item) => item.mistakes));

  const baseByType = {
    matchingHeadings: 68,
    trueFalseNotGiven: 68,
    multipleChoice: 83,
    sentenceCompletion: 92
  } as const;

  return selected.map((item) => {
    const penalty = Math.round((item.mistakes / maxMistakes) * 10);
    return {
      id: `coach-accuracy-${item.type}`,
      type: item.type,
      accuracy: clamp(baseByType[item.type] - penalty, 45, 95)
    };
  });
}

const sortedModules = [...STUDENT_MODULE_PERFORMANCE].sort((left, right) => right.percentage - left.percentage);
const strongestModule = sortedModules[0];
const weakestModule = sortedModules[sortedModules.length - 1];

const recentWeakQuestion = STUDENT_SAVED_QUESTIONS.find((item) => item.isWeakArea)?.questionType ?? "matchingHeadings";
const recentSession = STUDENT_RECENT_PRACTICE_ACTIVITY[0];

export const STUDENT_COACH_SUMMARY = {
  estimatedBand: STUDENT_PROGRESS_SUMMARY.currentBandEstimate,
  estimatedBandDelta: STUDENT_PROGRESS_SUMMARY.currentBandDelta,
  targetBand: STUDENT_PROGRESS_SUMMARY.targetBand,
  strongestModule: strongestModule?.module ?? "listening",
  weakestModule: weakestModule?.module ?? "writing"
} as const;

export const STUDENT_COACH_ACCURACY_ROWS: StudentCoachAccuracyRow[] = buildAccuracyByType();

export const STUDENT_COACH_MESSAGES_SEED: StudentCoachMessage[] = [
  {
    id: "coach-seed-student",
    role: "student",
    content: `How can I improve my "${recentWeakQuestion}" accuracy in Reading? I keep getting confused between similar choices.`,
    createdAt: "2026-03-13T09:15:00.000Z",
    meta: {isSeed: true}
  },
  {
    id: "coach-seed-assistant",
    role: "assistant",
    content:
      `Based on your recent attempts, ${recentWeakQuestion} is still a weak area. ` +
      `You are currently around band ${STUDENT_PROGRESS_SUMMARY.currentBandEstimate.toFixed(1)} and trending upward.\n\n` +
      `1. Read each paragraph first, then compare headings to avoid keyword traps.\n` +
      `2. Mark the topic sentence and final sentence before choosing.\n` +
      `3. Eliminate headings that are too narrow for the paragraph's main idea.\n\n` +
      `Your latest ${recentSession.module} session reached ${recentSession.accuracy}% accuracy, so consistency is improving.`,
    createdAt: "2026-03-13T09:16:00.000Z",
    meta: {isSeed: true}
  }
];

export const STUDENT_COACH_STRATEGY_CARDS: StudentCoachStrategyCard[] = [
  {id: "dailyReadingRhythm", tone: "amber", action: "navigate", href: "/reading"},
  {id: "writingTaskFeedback", tone: "indigo", action: "toast"},
  {id: "consolidateStrengths", tone: "emerald", action: "navigate", href: "/listening"}
];

export const STUDENT_COACH_RECOMMENDATIONS: StudentCoachRecommendation[] = [
  {id: "practiceMatchingHeadings", tag: "reading", action: "navigate", href: "/reading"},
  {id: "focusTask2Structure", tag: "writing", action: "toast"},
  {id: "reviewTfngStrategy", tag: "listening", action: "navigate", href: "/reading"},
  {id: "revisitStudyBank", tag: "studyBank", action: "navigate", href: "/study-bank"}
];

export function buildCoachReply(question: string) {
  const prompt = question.trim().toLowerCase();
  const weak = STUDENT_COACH_SUMMARY.weakestModule;
  const strong = STUDENT_COACH_SUMMARY.strongestModule;
  const weakestType = STUDENT_COACH_ACCURACY_ROWS.slice().sort((a, b) => a.accuracy - b.accuracy)[0];
  const strongestType = STUDENT_COACH_ACCURACY_ROWS.slice().sort((a, b) => b.accuracy - a.accuracy)[0];

  if (!prompt) {
    return `Ask a focused question and I will build a short IELTS action plan for you.`;
  }

  if (prompt.includes("matching") || prompt.includes("heading")) {
    return `Your ${weakestType.type} accuracy is ${weakestType.accuracy}%. ` +
      `Use a 3-step routine: identify paragraph theme, remove overly specific headings, then verify with opening and closing lines. ` +
      `Run one timed set today and review only wrong answers.`;
  }

  if (prompt.includes("writing") || prompt.includes("task 2") || prompt.includes("essay")) {
    return `Writing remains your weakest module. ` +
      `For today: build one clear thesis, two body paragraphs with examples, and leave 6 minutes for grammar cleanup. ` +
      `This structure improves coherence and lexical control quickly.`;
  }

  if (prompt.includes("listening")) {
    return `${strong} is currently your strongest module. ` +
      `Maintain it with one Section 4 drill weekly and transcript shadowing for 10 minutes. ` +
      `Then transfer extra study time to ${weak} for better total band growth.`;
  }

  if (prompt.includes("study plan") || prompt.includes("plan")) {
    return `Recommended weekly split: 3 Reading sessions, 2 Writing sessions, 1 Listening maintenance session. ` +
      `Start with ${weakestType.type}, finish with ${strongestType.type} to reinforce confidence.`;
  }

  return `You are at estimated band ${STUDENT_COACH_SUMMARY.estimatedBand.toFixed(1)} toward ${STUDENT_COACH_SUMMARY.targetBand.toFixed(1)}. ` +
    `Prioritize ${weak} and focus on ${weakestType.type}. Keep ${strong} stable through one short drill each week.`;
}

export function getModuleTone(module: StudentModuleKey) {
  const tones: Record<StudentModuleKey, "indigo" | "blue" | "violet" | "cyan"> = {
    reading: "indigo",
    listening: "blue",
    writing: "violet",
    speaking: "cyan"
  };
  return tones[module];
}
