import {STUDENT_ASSIGNMENTS, STUDENT_ASSIGNMENT_TEACHERS} from "@/data/student/assignments";
import type {
  StudentMessageAttachmentType,
  StudentTeacherConversation,
  StudentTeacherMessage,
  StudentTeacherProfileCard
} from "@/types/student";

export const STUDENT_MESSAGE_TEACHER_PROFILES: Record<string, StudentTeacherProfileCard> = {
  sarahJohnson: {
    teacherId: "sarahJohnson",
    roleKey: "teacherProfiles.sarah.role",
    studentsCount: 28,
    reviewsCompleted: 142,
    expertiseKey: "teacherProfiles.sarah.expertise"
  },
  davidChen: {
    teacherId: "davidChen",
    roleKey: "teacherProfiles.david.role",
    studentsCount: 22,
    reviewsCompleted: 118,
    expertiseKey: "teacherProfiles.david.expertise"
  }
};

export const STUDENT_TEACHER_CONVERSATIONS: StudentTeacherConversation[] = [
  {
    id: "conv-sarah-writing",
    teacherId: "sarahJohnson",
    assignmentIds: ["assignment-writing-tech-essay", "assignment-writing-task1-report"],
    lastMessagePreviewKey: "seed.previews.sarahWriting",
    lastMessageAt: "2026-03-13T10:20:00.000Z",
    unreadCount: 1,
    topicKey: "topics.writingFeedback"
  },
  {
    id: "conv-david-listening",
    teacherId: "davidChen",
    assignmentIds: ["assignment-listening-section4-lecture", "assignment-listening-note-completion"],
    lastMessagePreviewKey: "seed.previews.davidListening",
    lastMessageAt: "2026-03-12T15:05:00.000Z",
    unreadCount: 0,
    topicKey: "topics.listeningStrategy"
  },
  {
    id: "conv-sarah-reading",
    teacherId: "sarahJohnson",
    assignmentIds: ["assignment-reading-matching-headings", "assignment-reading-tfng-accuracy"],
    lastMessagePreviewKey: "seed.previews.sarahReading",
    lastMessageAt: "2026-03-11T09:30:00.000Z",
    unreadCount: 2,
    topicKey: "topics.readingWeakArea"
  }
];

export const STUDENT_TEACHER_MESSAGES: StudentTeacherMessage[] = [
  {
    id: "msg-1",
    conversationId: "conv-sarah-writing",
    sender: "teacher",
    textKey: "seed.messages.msg1",
    createdAt: "2026-03-13T09:45:00.000Z"
  },
  {
    id: "msg-2",
    conversationId: "conv-sarah-writing",
    sender: "student",
    textKey: "seed.messages.msg2",
    createdAt: "2026-03-13T09:52:00.000Z"
  },
  {
    id: "msg-3",
    conversationId: "conv-sarah-writing",
    sender: "teacher",
    textKey: "seed.messages.msg3",
    createdAt: "2026-03-13T10:20:00.000Z",
    attachments: [
      {
        id: "att-1",
        type: "pdf",
        name: "Task2-Structure-Guide.pdf",
        sizeKb: 420
      }
    ]
  },
  {
    id: "msg-4",
    conversationId: "conv-david-listening",
    sender: "teacher",
    textKey: "seed.messages.msg4",
    createdAt: "2026-03-12T14:10:00.000Z"
  },
  {
    id: "msg-5",
    conversationId: "conv-david-listening",
    sender: "student",
    textKey: "seed.messages.msg5",
    createdAt: "2026-03-12T14:22:00.000Z"
  },
  {
    id: "msg-6",
    conversationId: "conv-david-listening",
    sender: "teacher",
    textKey: "seed.messages.msg6",
    createdAt: "2026-03-12T15:05:00.000Z"
  },
  {
    id: "msg-7",
    conversationId: "conv-sarah-reading",
    sender: "teacher",
    textKey: "seed.messages.msg7",
    createdAt: "2026-03-11T08:40:00.000Z"
  },
  {
    id: "msg-8",
    conversationId: "conv-sarah-reading",
    sender: "teacher",
    textKey: "seed.messages.msg8",
    createdAt: "2026-03-11T09:30:00.000Z"
  }
];

export const STUDENT_MESSAGE_ATTACHMENT_PRESETS: {
  id: string;
  type: StudentMessageAttachmentType;
  labelKey: string;
  fileName: string;
  sizeKb: number;
}[] = [
  {id: "preset-essay", type: "essay", labelKey: "composer.attachEssay", fileName: "Essay-Draft.docx", sizeKb: 256},
  {id: "preset-image", type: "image", labelKey: "composer.attachScreenshot", fileName: "Screenshot.png", sizeKb: 612},
  {id: "preset-audio", type: "audio", labelKey: "composer.attachAudio", fileName: "Speaking-Response.m4a", sizeKb: 1490}
];

export const getStudentConversationById = (conversationId: string) =>
  STUDENT_TEACHER_CONVERSATIONS.find((conversation) => conversation.id === conversationId) ?? null;

export const getStudentConversationMessages = (conversationId: string) =>
  STUDENT_TEACHER_MESSAGES.filter((message) => message.conversationId === conversationId).sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  );

export const getStudentTeacherProfileById = (teacherId: string) => STUDENT_MESSAGE_TEACHER_PROFILES[teacherId] ?? null;

export const getStudentAssignmentsByIds = (assignmentIds: string[]) =>
  assignmentIds
    .map((assignmentId) => STUDENT_ASSIGNMENTS.find((assignment) => assignment.id === assignmentId))
    .filter((assignment): assignment is (typeof STUDENT_ASSIGNMENTS)[number] => Boolean(assignment));

export const getStudentTeacherNameById = (teacherId: string) => STUDENT_ASSIGNMENT_TEACHERS[teacherId]?.name ?? "";
