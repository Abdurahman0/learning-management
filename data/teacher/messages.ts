import type {TeacherChatMessage, TeacherMessageThread} from "@/types/teacher";

import {TEACHER_STUDENTS} from "./students";

function conversationIdForStudent(studentId: string) {
  return `thread-${studentId}`;
}

const explicitUnreadCounts: Record<string, number> = {
  "student-alex-thompson": 1,
  "student-maria-garcia": 0,
  "student-liam-nguyen": 0,
  "student-james-sterling": 2,
  "student-maria-valdez": 1,
  "student-arjun-kapoor": 1,
  "student-john-smith": 0,
  "student-emma-wilson": 0,
  "student-liam-chen": 1
};

function minutesAgoToIso(value: number) {
  return new Date(Date.now() - value * 60 * 1000).toISOString();
}

function truncatePreview(value: string) {
  return value.length > 110 ? `${value.slice(0, 107)}...` : value;
}

const explicitConversationMessages: TeacherChatMessage[] = [
  {
    id: "msg-alex-1",
    conversationId: conversationIdForStudent("student-alex-thompson"),
    studentId: "student-alex-thompson",
    senderRole: "student",
    text: "Hello professor. Could you please check my Writing Task 2 introduction from tonight's homework?",
    createdAt: minutesAgoToIso(95)
  },
  {
    id: "msg-alex-2",
    conversationId: conversationIdForStudent("student-alex-thompson"),
    studentId: "student-alex-thompson",
    senderRole: "teacher",
    text: "Yes, send the first paragraph here. I will leave comments on cohesion and structure.",
    createdAt: minutesAgoToIso(88)
  },
  {
    id: "msg-alex-3",
    conversationId: conversationIdForStudent("student-alex-thompson"),
    studentId: "student-alex-thompson",
    senderRole: "student",
    text: "Done. Also should I keep body paragraphs at around 6-7 lines each?",
    createdAt: minutesAgoToIso(62)
  },
  {
    id: "msg-maria-1",
    conversationId: conversationIdForStudent("student-maria-garcia"),
    studentId: "student-maria-garcia",
    senderRole: "student",
    text: "I'm struggling with Section 3 listening distractors. Can you suggest one drill before tomorrow?",
    createdAt: minutesAgoToIso(215)
  },
  {
    id: "msg-maria-2",
    conversationId: conversationIdForStudent("student-maria-garcia"),
    studentId: "student-maria-garcia",
    senderRole: "teacher",
    text: "Start with a 15-minute distractor drill. Pause after each question and identify why each option is incorrect.",
    createdAt: minutesAgoToIso(208)
  },
  {
    id: "msg-james-1",
    conversationId: conversationIdForStudent("student-james-sterling"),
    studentId: "student-james-sterling",
    senderRole: "student",
    text: "I missed yesterday's reading practice session. Can I submit late tonight?",
    createdAt: minutesAgoToIso(1640)
  },
  {
    id: "msg-james-2",
    conversationId: conversationIdForStudent("student-james-sterling"),
    studentId: "student-james-sterling",
    senderRole: "teacher",
    text: "Submit by 10 PM and include a short reflection on where you lost time.",
    createdAt: minutesAgoToIso(1580)
  },
  {
    id: "msg-arjun-1",
    conversationId: conversationIdForStudent("student-arjun-kapoor"),
    studentId: "student-arjun-kapoor",
    senderRole: "student",
    text: "When is the next speaking feedback slot available?",
    createdAt: minutesAgoToIso(44)
  }
];

const generatedConversationMessages: TeacherChatMessage[] = TEACHER_STUDENTS
  .filter((student) => !explicitConversationMessages.some((item) => item.studentId === student.id))
  .flatMap((student, index) => {
    const baseMinutes = Math.max(30, student.lastActiveMinutesAgo + 18 + (index % 6) * 9);
    const conversationId = conversationIdForStudent(student.id);
    const focusText =
      student.weakestSkill === "matchingHeadings"
        ? "matching headings practice"
        : student.weakestSkill === "trueFalseNotGiven"
          ? "TFNG accuracy"
          : student.weakestSkill === "writingTask2"
            ? "Writing Task 2 structure"
            : student.weakestSkill === "speakingFluency"
              ? "speaking fluency"
              : student.weakestSkill === "listeningPart4"
                ? "Part 4 listening details"
                : "time management";

    return [
      {
        id: `msg-${student.id}-1`,
        conversationId,
        studentId: student.id,
        senderRole: "student" as const,
        text: `Hi teacher, could you recommend one focused exercise for ${focusText}?`,
        createdAt: minutesAgoToIso(baseMinutes + 22)
      },
      {
        id: `msg-${student.id}-2`,
        conversationId,
        studentId: student.id,
        senderRole: "teacher" as const,
        text: `Sure. I'll assign a short practice set today. Complete it and send me your summary afterwards.`,
        createdAt: minutesAgoToIso(baseMinutes + 14)
      },
      {
        id: `msg-${student.id}-3`,
        conversationId,
        studentId: student.id,
        senderRole: "student" as const,
        text: truncatePreview(`Thank you, teacher. I'll finish the set and update you by tonight.`),
        createdAt: minutesAgoToIso(baseMinutes)
      }
    ];
  });

export const TEACHER_CHAT_MESSAGES: TeacherChatMessage[] = [...explicitConversationMessages, ...generatedConversationMessages];

const workspaceMessages: TeacherChatMessage[] = [];

export function getTeacherChatMessages() {
  return [...TEACHER_CHAT_MESSAGES, ...workspaceMessages].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  );
}

export function getTeacherChatMessagesByConversation(conversationId: string) {
  return getTeacherChatMessages().filter((item) => item.conversationId === conversationId);
}

export function createTeacherChatMessage(input: {conversationId: string; studentId: string; text: string}) {
  const created = {
    id: `msg-workspace-${input.studentId}-${Date.now()}`,
    conversationId: input.conversationId,
    studentId: input.studentId,
    senderRole: "teacher",
    text: input.text.trim(),
    createdAt: new Date().toISOString()
  } satisfies TeacherChatMessage;

  workspaceMessages.push(created);
  return created;
}

export const TEACHER_MESSAGE_THREADS: TeacherMessageThread[] = TEACHER_STUDENTS.map((student, index) => {
  const unreadCount = explicitUnreadCounts[student.id] ?? (student.status === "at_risk" ? 1 + (index % 2) : index % 6 === 0 ? 1 : 0);
  const lastMessage = TEACHER_CHAT_MESSAGES
    .filter((item) => item.studentId === student.id)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())[0];

  return {
    id: conversationIdForStudent(student.id),
    studentId: student.id,
    unreadCount,
    lastMessageAt: lastMessage?.createdAt ?? new Date(Date.now() - (student.lastActiveMinutesAgo + 4) * 60 * 1000).toISOString()
  };
});
