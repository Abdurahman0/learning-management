import type {TeacherActivityEvent} from "@/types/teacher";

export const TEACHER_ACTIVITY_EVENTS: TeacherActivityEvent[] = [
  {
    id: "activity-1",
    studentId: "student-john-smith",
    type: "completed_reading_test",
    occurredAt: new Date(Date.now() - 2 * 60 * 1000).toISOString()
  },
  {
    id: "activity-2",
    studentId: "student-emma-wilson",
    type: "submitted_writing_task_1",
    occurredAt: new Date(Date.now() - 45 * 60 * 1000).toISOString()
  },
  {
    id: "activity-3",
    studentId: "student-liam-chen",
    type: "sent_message",
    occurredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "activity-4",
    studentId: "student-alex-thompson",
    type: "completed_reading_test",
    occurredAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  }
];
