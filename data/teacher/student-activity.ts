import type {TeacherStudentTimelineEvent} from "@/types/teacher";

import {TEACHER_STUDENTS} from "./students";

const explicitTimeline: TeacherStudentTimelineEvent[] = [
  {
    id: "timeline-alex-1",
    studentId: "student-alex-thompson",
    type: "completed_reading_test",
    occurredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "timeline-alex-2",
    studentId: "student-alex-thompson",
    type: "submitted_writing_assignment",
    occurredAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "timeline-alex-3",
    studentId: "student-alex-thompson",
    type: "started_listening_drill",
    occurredAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "timeline-alex-4",
    studentId: "student-alex-thompson",
    type: "logged_into_dashboard",
    occurredAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString()
  }
];

const generatedTimeline: TeacherStudentTimelineEvent[] = TEACHER_STUDENTS
  .filter((student) => !explicitTimeline.some((event) => event.studentId === student.id))
  .flatMap((student, index) => {
    const now = Date.now();

    return [
      {
        id: `timeline-${student.id}-1`,
        studentId: student.id,
        type: "completed_reading_test" as const,
        occurredAt: new Date(now - (index % 10 + 3) * 60 * 60 * 1000).toISOString()
      },
      {
        id: `timeline-${student.id}-2`,
        studentId: student.id,
        type: "submitted_writing_assignment" as const,
        occurredAt: new Date(now - (index % 8 + 7) * 60 * 60 * 1000).toISOString()
      },
      {
        id: `timeline-${student.id}-3`,
        studentId: student.id,
        type: "logged_into_dashboard" as const,
        occurredAt: new Date(now - (index % 6 + 25) * 60 * 60 * 1000).toISOString()
      }
    ];
  });

export const TEACHER_STUDENT_TIMELINE_EVENTS: TeacherStudentTimelineEvent[] = [...explicitTimeline, ...generatedTimeline];
