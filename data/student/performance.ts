import type {StudentModuleKey, StudentProfile, StudentStreakConfig, StudentTestRecord} from "@/types/student";

export const STUDENT_PROFILE: StudentProfile = {
  id: "student-string-user",
  name: "String User",
  targetBand: 7.0
};

export const STUDENT_STREAK_CONFIG: StudentStreakConfig = {
  initialStreakDays: 3,
  windowStartDate: "2026-03-07T00:00:00.000Z"
};

export const STUDENT_TEST_HISTORY: StudentTestRecord[] = [
  {id: "attempt-001", studentId: STUDENT_PROFILE.id, testName: "Cambridge 18 Test 3", module: "reading", completedAt: "2026-01-08T08:20:00.000Z", correctAnswers: 29, totalQuestions: 40, estimatedBand: 6.0},
  {id: "attempt-002", studentId: STUDENT_PROFILE.id, testName: "Cambridge 18 Test 3", module: "listening", completedAt: "2026-01-09T09:10:00.000Z", correctAnswers: 28, totalQuestions: 40, estimatedBand: 6.0},
  {id: "attempt-003", studentId: STUDENT_PROFILE.id, testName: "Weekly Writing Mock", module: "writing", completedAt: "2026-01-12T11:30:00.000Z", correctAnswers: 0, totalQuestions: 1, estimatedBand: 6.0},
  {id: "attempt-004", studentId: STUDENT_PROFILE.id, testName: "Cambridge 18 Test 4", module: "reading", completedAt: "2026-01-16T07:55:00.000Z", correctAnswers: 30, totalQuestions: 40, estimatedBand: 6.5},
  {id: "attempt-005", studentId: STUDENT_PROFILE.id, testName: "Cambridge 18 Test 4", module: "listening", completedAt: "2026-01-17T08:45:00.000Z", correctAnswers: 29, totalQuestions: 40, estimatedBand: 6.5},
  {id: "attempt-006", studentId: STUDENT_PROFILE.id, testName: "Speaking Part 2 Mock", module: "speaking", completedAt: "2026-01-20T10:00:00.000Z", correctAnswers: 0, totalQuestions: 1, estimatedBand: 6.0},
  {id: "attempt-007", studentId: STUDENT_PROFILE.id, testName: "Cambridge 19 Test 1", module: "reading", completedAt: "2026-02-02T08:10:00.000Z", correctAnswers: 31, totalQuestions: 40, estimatedBand: 6.5},
  {id: "attempt-008", studentId: STUDENT_PROFILE.id, testName: "Cambridge 19 Test 1", module: "listening", completedAt: "2026-02-03T09:20:00.000Z", correctAnswers: 30, totalQuestions: 40, estimatedBand: 6.5},
  {id: "attempt-009", studentId: STUDENT_PROFILE.id, testName: "Cambridge 19 Test 2", module: "reading", completedAt: "2026-02-14T09:00:00.000Z", correctAnswers: 32, totalQuestions: 40, estimatedBand: 7.0},
  {id: "attempt-010", studentId: STUDENT_PROFILE.id, testName: "Cambridge 19 Test 2", module: "listening", completedAt: "2026-02-15T09:15:00.000Z", correctAnswers: 31, totalQuestions: 40, estimatedBand: 7.0},
  {id: "attempt-011", studentId: STUDENT_PROFILE.id, testName: "Cambridge 19 Test 3", module: "reading", completedAt: "2026-03-07T09:05:00.000Z", correctAnswers: 33, totalQuestions: 40, estimatedBand: 7.0},
  {id: "attempt-012", studentId: STUDENT_PROFILE.id, testName: "Cambridge 19 Test 3", module: "listening", completedAt: "2026-03-08T08:35:00.000Z", correctAnswers: 30, totalQuestions: 40, estimatedBand: 6.5},
  {id: "attempt-013", studentId: STUDENT_PROFILE.id, testName: "Cambridge 19 Test 4", module: "reading", completedAt: "2026-03-10T09:30:00.000Z", correctAnswers: 31, totalQuestions: 40, estimatedBand: 6.5},
  {id: "attempt-014", studentId: STUDENT_PROFILE.id, testName: "Cambridge 19 Test 4", module: "listening", completedAt: "2026-03-12T10:10:00.000Z", correctAnswers: 32, totalQuestions: 40, estimatedBand: 7.0},
  {id: "attempt-015", studentId: STUDENT_PROFILE.id, testName: "Cambridge 20 Test 1", module: "reading", completedAt: "2026-03-13T11:20:00.000Z", correctAnswers: 31, totalQuestions: 40, estimatedBand: 6.5}
];

export function getStudentTestsByModule(module: StudentModuleKey) {
  return STUDENT_TEST_HISTORY.filter((record) => record.module === module);
}
