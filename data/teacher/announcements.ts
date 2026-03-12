import type {
  TeacherAnnouncement,
  TeacherAnnouncementAttachment,
  TeacherAnnouncementAudience,
  TeacherAnnouncementStatus,
  TeacherModuleKey,
  TeacherWeakSkillKey
} from "@/types/teacher";

import {TEACHER_STUDENTS} from "./students";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function weakSkillToModule(weakSkill: TeacherWeakSkillKey): TeacherModuleKey {
  switch (weakSkill) {
    case "writingTask2":
      return "writing";
    case "speakingFluency":
      return "speaking";
    case "listeningPart4":
    case "sentenceCompletion":
      return "listening";
    default:
      return "reading";
  }
}

function daysAgoToIso(daysAgo: number, hourOffset = 9) {
  return new Date(Date.now() - (daysAgo * 24 + hourOffset) * 60 * 60 * 1000).toISOString();
}

function daysAheadToIso(daysAhead: number, hourOffset = 10) {
  return new Date(Date.now() + (daysAhead * 24 + hourOffset) * 60 * 60 * 1000).toISOString();
}

function attachmentForIndex(index: number): TeacherAnnouncementAttachment | undefined {
  if (index % 3 === 1) {
    return undefined;
  }

  if (index % 3 === 0) {
    return {
      fileName: `lesson-note-${index + 1}.pdf`,
      fileType: "pdf",
      fileSizeBytes: 720_000 + (index % 7) * 85_000
    };
  }

  return {
    fileName: `class-reminder-${index + 1}.docx`,
    fileType: "docx",
    fileSizeBytes: 300_000 + (index % 6) * 60_000
  };
}

export function resolveTeacherAnnouncementAudienceStudentIds(audience: TeacherAnnouncementAudience) {
  if (audience === "all") {
    return TEACHER_STUDENTS.map((student) => student.id);
  }

  if (audience === "weak_students") {
    return TEACHER_STUDENTS
      .filter((student) => student.progressState === "needs_help" || student.status === "at_risk")
      .map((student) => student.id);
  }

  const moduleKey: TeacherModuleKey = audience === "reading_students" ? "reading" : "writing";

  return TEACHER_STUDENTS
    .filter((student) => weakSkillToModule(student.weakestSkill) === moduleKey || student.moduleBands[moduleKey] < 6.0)
    .map((student) => student.id);
}

const AUDIENCE_CYCLE: TeacherAnnouncementAudience[] = [
  "all",
  "weak_students",
  "reading_students",
  "writing_students"
];

const TITLE_CYCLE = [
  "Weekly Class Roadmap",
  "Exam Readiness Reminder",
  "Reading Strategy Focus",
  "Writing Feedback Window",
  "Mock Test Instructions",
  "Speaking Clinic Schedule",
  "Homework Clarification",
  "Target Band Action Plan"
] as const;

const CONTENT_CYCLE = [
  "Please review this week's study plan and keep your submissions on time.",
  "Use this reminder to prepare for the upcoming practice window and submit questions early.",
  "Focus on evidence matching and timing drills before the next class checkpoint.",
  "Review feedback highlights and apply corrections in your next writing response.",
  "Complete the assigned mock test under timed conditions and submit reflections.",
  "Bring one speaking recording and one self-review note to our next session.",
  "Check attached resource notes and confirm if any instructions are unclear.",
  "Use the attached guidance to close your weakest skill gap this week."
] as const;

function buildSeedAnnouncement(index: number): TeacherAnnouncement {
  const audience = AUDIENCE_CYCLE[index % AUDIENCE_CYCLE.length];
  const recipients = resolveTeacherAnnouncementAudienceStudentIds(audience);
  const attachment = attachmentForIndex(index);

  let status: TeacherAnnouncementStatus = "published";
  let createdAt = daysAgoToIso(8 + (index % 90), 8 + (index % 6));
  let scheduledAt: string | undefined;
  let views = 0;
  let resourceClicks = 0;
  let unreadRate = 100;

  if (index < 8) {
    createdAt = daysAgoToIso(index % 7, 2 + (index % 5));
  }

  if (index < 96) {
    status = "published";
    const reachRate = clamp(0.82 + ((index % 6) - 2) * 0.025, 0.68, 0.95);
    views = Math.round(recipients.length * reachRate);
    const clickRate = attachment ? clamp(0.35 + (index % 5) * 0.03, 0.32, 0.56) : clamp(0.08 + (index % 4) * 0.02, 0.08, 0.2);
    resourceClicks = Math.round(views * clickRate);
    unreadRate = Math.round(clamp(100 - (views / Math.max(1, recipients.length)) * 100 + (index % 3) * 1.4, 7, 34));
  } else if (index < 108) {
    status = "scheduled";
    createdAt = daysAgoToIso(index - 90, 6);
    scheduledAt = daysAheadToIso(index - 95, 8);
    views = 0;
    resourceClicks = 0;
    unreadRate = 100;
  } else {
    status = "draft";
    createdAt = daysAgoToIso(index - 100, 7);
    scheduledAt = index % 2 === 0 ? daysAheadToIso(index - 104, 5) : undefined;
    views = 0;
    resourceClicks = 0;
    unreadRate = 100;
  }

  return {
    id: `teacher-announcement-${index + 1}`,
    title: `${TITLE_CYCLE[index % TITLE_CYCLE.length]} #${index + 1}`,
    content: CONTENT_CYCLE[index % CONTENT_CYCLE.length],
    audience,
    status,
    createdAt,
    scheduledAt,
    attachment,
    views,
    resourceClicks,
    unreadRate
  };
}

export const TEACHER_ANNOUNCEMENTS: TeacherAnnouncement[] = Array.from({length: 124}, (_, index) =>
  buildSeedAnnouncement(index)
);

const workspaceAnnouncements: TeacherAnnouncement[] = [];

export function getTeacherWorkspaceAnnouncements() {
  return [...workspaceAnnouncements];
}

export function getTeacherAnnouncementsWithWorkspace() {
  return [...TEACHER_ANNOUNCEMENTS, ...workspaceAnnouncements].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

export function createTeacherWorkspaceAnnouncement(input: {
  title: string;
  content: string;
  audience: TeacherAnnouncementAudience;
  status: TeacherAnnouncementStatus;
  scheduledAt?: string;
  attachment?: TeacherAnnouncementAttachment;
  views: number;
  resourceClicks: number;
  unreadRate: number;
}) {
  const created = {
    id: `teacher-announcement-workspace-${Date.now()}`,
    title: input.title,
    content: input.content,
    audience: input.audience,
    status: input.status,
    createdAt: new Date().toISOString(),
    scheduledAt: input.scheduledAt,
    attachment: input.attachment,
    views: input.views,
    resourceClicks: input.resourceClicks,
    unreadRate: input.unreadRate
  } satisfies TeacherAnnouncement;

  workspaceAnnouncements.unshift(created);
  return created;
}
