import type {StudentPaginatedResponse} from "./types";

export type StudentMarathonDifficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | string;
export type StudentMarathonCategory = "READING_FOCUS" | "LISTENING_FOCUS" | "MIXED" | string;

export type StudentMarathonEnrollmentBrief = {
  id: string;
  status: "ENROLLED" | "ACTIVE" | "COMPLETED" | "ABANDONED" | string;
  is_finished_marathon: boolean;
  current_streak: number;
  enrolled_at: string | null;
};

export type StudentMarathonEnrollment = StudentMarathonEnrollmentBrief & {
  marathon: string;
  last_activity_at: string | null;
  completed_at: string | null;
  longest_streak: number;
  days_missed: number;
  total_score: string;
  total_time_seconds: number;
  current_day_number: number;
  days_completed: number;
  progress_percentage: number;
};

export type StudentMarathonListItem = {
  id: string;
  title: string;
  description: string;
  marathon_days: number;
  total_days: number;
  difficulty: StudentMarathonDifficulty;
  difficulty_display: string;
  category: StudentMarathonCategory;
  category_display: string;
  target_band: string | null;
  for_premium_users: boolean;
  external_link: string | null;
  external_link_title: string | null;
  enrollment: StudentMarathonEnrollmentBrief | null;
};

export type StudentMarathonDetail = StudentMarathonListItem & {
  streak_goal_days: number;
  enrollment: StudentMarathonEnrollment | null;
};

export type StudentMarathonDaySummary = {
  id: string;
  day_number: number;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | string | null;
  estimated_minutes: number | null;
  is_bonus_day: boolean;
  is_completable: boolean;
  is_locked: boolean;
  is_completed: boolean;
  external_links_count: number;
  reading_passages_count: number;
  listening_parts_count: number;
};

export type StudentMarathonDayLink = {
  id: string;
  title: string;
  url: string;
  order: number;
};

export type StudentMarathonDayNote = {
  id: string;
  note_text: string | null;
  updated_at: string | null;
};

export type StudentMarathonDayContentItem = {
  id: string;
  title: string;
  max_questions: number;
  difficulty_level: string | null;
  estimated_time_minutes: number | null;
  is_available_to_be_solved: boolean;
  attempt_id: string | null;
  attempt_status: "IN_PROGRESS" | "COMPLETED" | string | null;
  band_score: string | null;
  question_groups_count: number;
  external_link: StudentMarathonContentLink | null;
};

export type StudentMarathonContentLink = {
  title: string;
  url: string;
};

export type StudentMarathonListeningDayItem = StudentMarathonDayContentItem & {
  audio_file_url: string | null;
};

export type StudentMarathonDayDetail = {
  id: string;
  day_number: number;
  title: string;
  content: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | string | null;
  estimated_minutes: number | null;
  is_bonus_day: boolean;
  is_completable: boolean;
  is_locked: boolean;
  is_completed: boolean;
  student_day_id: string | null;
  time_spent_seconds: number;
  external_links: StudentMarathonDayLink[];
  reading_passages: StudentMarathonDayContentItem[];
  listening_parts: StudentMarathonListeningDayItem[];
  note: StudentMarathonDayNote | null;
};

export type StudentMarathonDayCompleteResponse = {
  detail: string;
  is_completed: boolean;
  day_band_score: string | null;
  current_streak: number | null;
  is_finished_marathon: boolean;
  incomplete: Array<{
    type: string;
    id: string;
    title: string;
  }>;
};

export type StudentMarathonAttemptCreatePayload =
  | {passage_id: string; part_id?: never}
  | {part_id: string; passage_id?: never};

export type StudentMarathonAttemptSavePayload = {
  time_used_seconds?: number;
  answers: Array<{
    question_id: string;
    answer: unknown;
    is_flagged?: boolean;
    time_spent_seconds?: number;
  }>;
};

export type StudentMarathonAttemptSubmitPayload = {
  time_used_seconds?: number;
  answers?: StudentMarathonAttemptSavePayload["answers"];
};

export type StudentMarathonAttemptSaveResponse = {
  answered: number;
  total: number;
  time_used_seconds: number;
};

export type StudentMarathonAttempt = {
  id: string;
  enrollment: string;
  day: string;
  reading_passage: string | null;
  listening_part: string | null;
  status: "IN_PROGRESS" | "COMPLETED" | string;
  score: number | null;
  band_score: string | null;
  started_at: string | null;
  completed_at: string | null;
  time_used_seconds: number;
  questions_answered: number;
  total_questions: number;
  content: Record<string, unknown> | null;
};

export type StudentMarathonAttemptResultAnswer = {
  id: string;
  question: string;
  question_number: number;
  question_text: string;
  question_type: string;
  student_answer_json: unknown;
  correct_answer_json: unknown;
  is_correct: boolean;
  is_skipped: boolean;
  is_flagged: boolean;
  explanation: string | null;
  answer_evidence_json: unknown;
};

export type StudentMarathonAttemptResult = {
  id: string;
  status: "COMPLETED" | string;
  score: number | null;
  band_score: string | null;
  question_type_stats_json: Record<string, unknown> | null;
  time_used_seconds: number;
  started_at: string | null;
  completed_at: string | null;
  correct_count: number;
  incorrect_count: number;
  skipped_count: number;
  answers: StudentMarathonAttemptResultAnswer[];
};

export type StudentMarathonLeaderboardEntry = {
  rank: number;
  student_full_name: string;
  total_score: string;
  current_streak: number;
  is_finished_marathon: boolean;
  days_completed: number;
  is_self: boolean;
};

export type StudentMarathonListResponse = StudentPaginatedResponse<StudentMarathonListItem>;
