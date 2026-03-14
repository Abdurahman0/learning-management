import {
  STUDENT_COMMON_ERROR_PATTERNS,
  STUDENT_MISTAKE_ANALYSIS_BY_RANGE,
  STUDENT_RECOMMENDED_FOCUS_AREAS,
  type StudentErrorPatternKey,
  type StudentMistakeQuestionTypeKey
} from "@/data/student-mistake-analysis";
import {STUDENT_MODULE_PERFORMANCE} from "@/data/student/progress-analytics";
import {STUDENT_SAVED_QUESTIONS} from "@/data/student/study-bank";
import type {StudentModuleKey, StudentReviewReason, StudentSavedQuestion} from "@/types/student";

export type StudentReviewCenterSummary = {
  questionsToReview: number;
  mostDifficultType: StudentMistakeQuestionTypeKey;
  weakestModule: StudentModuleKey;
  accuracyTrend: number;
};

export type StudentReviewInsight = {
  id: StudentErrorPatternKey;
  icon: "keyword" | "time" | "instructions";
  tone: "warning" | "neutral";
};

export const STUDENT_REVIEW_REASON_OPTIONS: {value: "all" | StudentReviewReason; labelKey: string}[] = [
  {value: "all", labelKey: "filters.reason.all"},
  {value: "wrong", labelKey: "filters.reason.wrong"},
  {value: "saved", labelKey: "filters.reason.saved"},
  {value: "flagged", labelKey: "filters.reason.flagged"},
  {value: "weakArea", labelKey: "filters.reason.weakArea"}
];

const REVIEW_RANGE = "last30Days";
const rangeSnapshot = STUDENT_MISTAKE_ANALYSIS_BY_RANGE[REVIEW_RANGE];

const weakestModuleFromAnalytics = [...STUDENT_MODULE_PERFORMANCE].sort((left, right) => left.percentage - right.percentage)[0]?.module ?? "reading";

export const STUDENT_REVIEW_CENTER_SUMMARY: StudentReviewCenterSummary = {
  questionsToReview: STUDENT_SAVED_QUESTIONS.length,
  mostDifficultType: rangeSnapshot.summary.mostDifficultType,
  weakestModule: weakestModuleFromAnalytics,
  accuracyTrend: rangeSnapshot.summary.accuracyTrend
};

export const STUDENT_REVIEW_CENTER_QUESTIONS: StudentSavedQuestion[] = STUDENT_SAVED_QUESTIONS;

export const STUDENT_REVIEW_CENTER_QUESTION_TYPE_MISTAKES = rangeSnapshot.questionTypeMistakes;

export const STUDENT_REVIEW_CENTER_MODULE_DISTRIBUTION = rangeSnapshot.moduleDistribution;

export const STUDENT_REVIEW_CENTER_INSIGHTS: StudentReviewInsight[] = STUDENT_COMMON_ERROR_PATTERNS.map((pattern, index) => ({
  id: pattern.id,
  icon: pattern.icon,
  tone: index === 0 ? "warning" : "neutral"
}));

export const STUDENT_REVIEW_CENTER_NEXT_STEPS = STUDENT_RECOMMENDED_FOCUS_AREAS;

export function hasReviewReason(question: StudentSavedQuestion, reason: "all" | StudentReviewReason) {
  if (reason === "all") {
    return true;
  }

  return question.reviewReasons.includes(reason);
}
