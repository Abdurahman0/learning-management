import type {TeacherMessageThread} from "@/types/teacher";

import {TEACHER_STUDENTS} from "./students";

const explicitUnreadCounts: Record<string, number> = {
  "student-alex-thompson": 1,
  "student-maria-garcia": 0,
  "student-liam-nguyen": 0,
  "student-james-sterling": 1,
  "student-maria-valdez": 0,
  "student-arjun-kapoor": 1,
  "student-john-smith": 0,
  "student-emma-wilson": 0,
  "student-liam-chen": 1
};

export const TEACHER_MESSAGE_THREADS: TeacherMessageThread[] = TEACHER_STUDENTS.map((student, index) => {
  let unreadCount = explicitUnreadCounts[student.id];

  if (unreadCount === undefined) {
    if (student.status === "inactive") {
      unreadCount = index % 8 === 0 ? 1 : 0;
    } else if (student.status === "at_risk") {
      unreadCount = 1 + (index % 2);
    } else {
      unreadCount = index % 7 === 0 ? 1 : 0;
    }
  }

  return {
    id: `thread-${student.id}`,
    studentId: student.id,
    unreadCount,
    lastMessageAt: new Date(Date.now() - (student.lastActiveMinutesAgo + 5) * 60 * 1000).toISOString()
  };
});
