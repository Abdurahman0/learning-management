import type {TeacherReviewItem} from "@/types/teacher";

import {TEACHER_STUDENTS} from "./students";

const pendingReviewStudentIds = [
  "student-alex-thompson",
  "student-james-sterling",
  "student-maria-valdez",
  "student-arjun-kapoor",
  "student-emma-wilson",
  "student-auto-001",
  "student-auto-002",
  "student-auto-003"
] as const;

export const TEACHER_REVIEWS: TeacherReviewItem[] = [
  ...pendingReviewStudentIds.map((studentId, index) => ({
    id: `review-pending-${index + 1}`,
    studentId,
    reviewType: (index % 2 === 0 ? "writing" : "speaking") as "writing" | "speaking",
    status: "pending" as const,
    priority: index < 3 ? "urgent" as const : "normal" as const,
    submittedAt: new Date(Date.now() - (35 + index * 22) * 60 * 1000).toISOString()
  })),
  ...TEACHER_STUDENTS.slice(0, 56).map((student, index) => ({
    id: `review-completed-${index + 1}`,
    studentId: student.id,
    reviewType: (index % 2 === 0 ? "writing" : "speaking") as "writing" | "speaking",
    status: "completed" as const,
    priority: "normal" as const,
    submittedAt: new Date(Date.now() - (720 + index * 45) * 60 * 1000).toISOString()
  }))
];
