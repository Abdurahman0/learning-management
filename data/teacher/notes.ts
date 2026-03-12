import type {TeacherStudentNote} from "@/types/teacher";

export const TEACHER_STUDENT_INITIAL_NOTES: TeacherStudentNote[] = [
  {
    id: "note-alex-1",
    studentId: "student-alex-thompson",
    teacherId: "teacher-1",
    teacherName: "Sarah Jenkins",
    content:
      "Alex is struggling with time management in Reading. Recommended the skimming strategy for Section 3.",
    createdAt: "2023-10-22T14:00:00.000Z"
  },
  {
    id: "note-alex-2",
    studentId: "student-alex-thompson",
    teacherId: "teacher-1",
    teacherName: "Sarah Jenkins",
    content:
      "Initial assessment completed. Strong vocabulary but needs to improve sentence structure variety.",
    createdAt: "2023-10-15T09:30:00.000Z"
  }
];

export function getTeacherInitialNotesByStudent(studentId: string) {
  return TEACHER_STUDENT_INITIAL_NOTES.filter((note) => note.studentId === studentId);
}

export function createTeacherNote({
  studentId,
  teacherId,
  teacherName,
  content
}: {
  studentId: string;
  teacherId: string;
  teacherName: string;
  content: string;
}) {
  return {
    id: `note-${studentId}-${Date.now()}`,
    studentId,
    teacherId,
    teacherName,
    content,
    createdAt: new Date().toISOString()
  } satisfies TeacherStudentNote;
}
