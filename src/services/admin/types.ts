export type AdminListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
};

export type AdminEntityId = number | string;

export type AdminPaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type AdminNotificationsResponse<T> = AdminPaginatedResponse<T> & {
  unread_count: number;
};

export type AdminFieldErrors = Record<string, string[]>;

export class AdminApiError extends Error {
  status: number;
  fieldErrors: AdminFieldErrors;
  raw: unknown;

  constructor(message: string, status = 500, fieldErrors: AdminFieldErrors = {}, raw: unknown = null) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.raw = raw;
  }
}

export type PracticeTestRecord = {
  id: AdminEntityId;
  title: string;
  description: string;
  test_type: string;
  difficulty_level: string;
  practice_source?: string | null;
  active_for_registered_users?: boolean;
  test_format: string;
  total_questions: number;
  time_limit_seconds: number | null;
  is_active: boolean;
  is_premium?: boolean;
  packages?: AdminEntityId[];
  listening_parts_count: number;
  reading_passages_count: number;
  display_order?: number | null;
  group_id?: AdminEntityId | null;
  group_name?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type PracticeTestGroupRecord = {
  id: AdminEntityId;
  name: string;
  description: string;
  is_active: boolean;
  test_count: number;
  created_at?: string;
  updated_at?: string;
};

export type ListeningPartRecord = {
  id: AdminEntityId;
  practice_test?: AdminEntityId;
  part_number: string;
  title: string;
  audio_file?: string | null;
  audio_url?: string | null;
  transcript_text: string;
  max_questions: number;
  time_limit_seconds: number | null;
  is_active: boolean;
  is_premium?: boolean;
  question_groups?: QuestionGroupRecord[];
};

export type FullListeningAudioSegmentRecord = {
  id: AdminEntityId;
  listening_part: AdminEntityId;
  part_number: string;
  title?: string | null;
  start_seconds: number;
  end_seconds: number;
};

export type FullListeningAudioRecord = {
  id: AdminEntityId;
  practice_test: AdminEntityId;
  source_audio_file: string;
  created_at?: string;
  updated_at?: string;
  segments: FullListeningAudioSegmentRecord[];
};

export type FullListeningAudioSegmentPayload = {
  listening_part: AdminEntityId;
  start_seconds: number;
  end_seconds: number;
};

export type FullListeningAudioUpsertPayload = {
  source_audio_file?: File | null;
  segments?: FullListeningAudioSegmentPayload[];
};

export type ReadingPassageRecord = {
  id: AdminEntityId;
  practice_test?: AdminEntityId;
  passage_number: string | number;
  title: string;
  passage_text: string;
  max_questions: number;
  time_limit_seconds: number | null;
  is_active: boolean;
  is_premium?: boolean;
  question_groups?: QuestionGroupRecord[];
};

export type QuestionRecord = {
  id?: AdminEntityId;
  question_group?: AdminEntityId;
  question_number: number;
  question_order?: number;
  question_text?: string;
  prompt?: string;
  options_json?: unknown;
  correct_answer_json?: unknown;
  explanation?: string;
  evidence_text?: string;
  answer_evidence_json?: unknown;
  is_active?: boolean;
};

export type QuestionGroupRecord = {
  id: AdminEntityId;
  variant_set?: AdminEntityId | null;
  question_type: string;
  group_order: number;
  instructions: string;
  question_number_start: number;
  question_number_end: number;
  word_limit: number | null;
  number_allowed: boolean | null;
  group_content_json: unknown;
  is_active: boolean;
  listening_part?: AdminEntityId | null;
  reading_passage?: AdminEntityId | null;
  questions?: QuestionRecord[];
};

export type PracticeTestDetailRecord = PracticeTestRecord & {
  listening_parts?: ListeningPartRecord[];
  reading_passages?: ReadingPassageRecord[];
  question_groups?: QuestionGroupRecord[];
  questions?: QuestionRecord[];
};

export type PracticeTestCreatePayload = {
  title: string;
  description: string;
  test_type: string;
  difficulty_level: string;
  practice_source?: string | null;
  active_for_registered_users?: boolean;
  display_order?: number | null;
  group?: AdminEntityId | null;
  test_format: string;
  total_questions: number;
  time_limit_seconds: number | null;
  is_active: boolean;
  is_premium?: boolean;
  packages?: AdminEntityId[];
  // Per-request action flag: when true the backend also sets every attached
  // passage/part to the test's new is_premium in the same transaction.
  cascade_premium?: boolean;
};

export type PracticeTestPatchPayload = Partial<PracticeTestCreatePayload>;

export type ListeningPartPayload = {
  part_number: string;
  title: string;
  transcript_text: string;
  max_questions: number;
  time_limit_seconds: number | null;
  is_active: boolean;
  is_premium?: boolean;
  audio_file?: File | null;
  remove_audio?: boolean;
};

export type ReadingPassagePayload = {
  passage_number: string | number;
  title: string;
  passage_text: string;
  max_questions: number;
  time_limit_seconds: number;
  is_active: boolean;
  is_premium?: boolean;
};

export type QuestionGroupPayload = {
  variant_set?: AdminEntityId | null;
  question_type: string;
  group_order: number;
  instructions: string;
  question_number_start: number;
  question_number_end: number;
  word_limit?: number | null;
  number_allowed?: boolean | null;
  group_content_json?: unknown;
  is_active: boolean;
  listening_part?: AdminEntityId | null;
  reading_passage?: AdminEntityId | null;
};

export type QuestionBulkItemPayload = {
  question_number: number;
  question_order?: number;
  question_text?: string;
  prompt?: string;
  options_json?: unknown;
  correct_answer_json?: unknown;
  explanation?: string;
  evidence_text?: string;
  answer_evidence_json?: unknown;
  is_active?: boolean;
};

export type QuestionBulkPayload = {
  questions: QuestionBulkItemPayload[];
};

export type QuestionPayload = {
  question_group: AdminEntityId;
  question_number: number;
  question_order?: number;
  question_text?: string;
  prompt?: string;
  options_json?: unknown;
  correct_answer_json?: unknown;
  explanation?: string;
  evidence_text?: string;
  answer_evidence_json?: unknown;
  is_active?: boolean;
};

export type AdminMarathonDifficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | string;
export type AdminMarathonCategory = "READING_FOCUS" | "LISTENING_FOCUS" | "MIXED" | string;
export type AdminMarathonEnrollmentStatus = "ENROLLED" | "ACTIVE" | "COMPLETED" | "ABANDONED" | string;

export type AdminMarathonSeriesRecord = {
  id: AdminEntityId;
  name: string;
  description: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type AdminMarathonRecord = {
  id: AdminEntityId;
  title: string;
  description: string;
  marathon_days: number;
  total_days?: number;
  difficulty: AdminMarathonDifficulty;
  difficulty_display?: string;
  category: AdminMarathonCategory;
  category_display?: string;
  target_band: string | null;
  streak_goal_days: number;
  is_visible: boolean;
  for_premium_users: boolean;
  make_three_days_free?: boolean;
  packages?: AdminEntityId[];
  max_enrollments: number | null;
  external_link: string;
  external_link_title: string;
  series: AdminEntityId | null;
  series_name?: string | null;
  enrollments_count?: number | null;
  created_by?: AdminEntityId | null;
  created_at?: string;
  updated_at?: string;
};

export type AdminMarathonDayRecord = {
  id: AdminEntityId;
  day_number: number;
  title: string;
  content?: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | string | null;
  estimated_minutes: number | null;
  is_bonus_day: boolean;
  is_completable?: boolean;
  external_links_count?: number;
  reading_passages_count?: number;
  listening_parts_count?: number;
};

export type AdminMarathonExternalLinkRecord = {
  id: AdminEntityId;
  title: string;
  url: string;
  order: number;
  created_at?: string;
  updated_at?: string;
};

export type AdminMarathonReadingPassageRecord = {
  id: AdminEntityId;
  passage_number?: string | null;
  title: string;
  passage_text: string;
  difficulty_level: string;
  topic?: string | null;
  estimated_time_minutes: number | null;
  max_questions: number;
  time_limit_seconds: number | null;
  is_active: boolean;
  is_premium?: boolean;
  source?: string | null;
  question_groups_count?: number | null;
  external_link?: AdminMarathonContentLinkRecord | null;
  created_at?: string;
  updated_at?: string;
};

export type AdminMarathonContentLinkRecord = {
  id: AdminEntityId;
  reading_passage?: AdminEntityId | null;
  listening_part?: AdminEntityId | null;
  title: string;
  url: string;
  created_at?: string;
  updated_at?: string;
};

export type AdminMarathonContentLinkPayload = {
  title?: string;
  url: string;
};

export type AdminMarathonListeningPartRecord = {
  id: AdminEntityId;
  title: string;
  part_number?: string | null;
  transcript_text: string;
  difficulty_level: string;
  estimated_time_minutes: number | null;
  max_questions: number;
  time_limit_seconds: number | null;
  audio_file_url?: string | null;
  audio_url?: string | null;
  is_active: boolean;
  is_premium?: boolean;
  source?: string | null;
  question_groups_count?: number | null;
  external_link?: AdminMarathonContentLinkRecord | null;
  created_at?: string;
  updated_at?: string;
};

export type AdminMarathonDayDetailRecord = AdminMarathonDayRecord & {
  external_links: AdminMarathonExternalLinkRecord[];
  reading_passages: AdminMarathonReadingPassageRecord[];
  listening_parts: AdminMarathonListeningPartRecord[];
};

export type AdminMarathonEnrollmentRecord = {
  id: AdminEntityId;
  student: AdminEntityId | null;
  student_full_name: string;
  student_email: string;
  status: AdminMarathonEnrollmentStatus;
  enrolled_at: string | null;
  last_activity_at: string | null;
  completed_at: string | null;
  is_finished_marathon: boolean;
  current_streak: number;
  longest_streak: number;
  days_missed: number;
  total_score: string | null;
  total_time_seconds: number;
  current_day_number: number;
  days_completed: number;
  progress_percentage: number;
};

export type AdminMarathonLeaderboardEntry = {
  rank: number;
  student_full_name: string;
  total_score: string | null;
  current_streak: number;
  is_finished_marathon: boolean;
  days_completed: number;
};

export type AdminMarathonPayload = {
  title: string;
  description?: string;
  marathon_days: number;
  difficulty: AdminMarathonDifficulty;
  category: AdminMarathonCategory;
  target_band?: string | null;
  streak_goal_days?: number;
  is_visible?: boolean;
  for_premium_users?: boolean;
  make_three_days_free?: boolean;
  packages?: AdminEntityId[];
  max_enrollments?: number | null;
  external_link?: string;
  external_link_title?: string;
  series?: AdminEntityId | null;
  // Per-request action flag: cascades for_premium_users to every passage/part
  // assigned to any day of the marathon in the same transaction.
  cascade_premium?: boolean;
};

export type AdminMarathonSeriesPayload = {
  name: string;
  description?: string;
  is_active?: boolean;
};

export type AdminMarathonDayPayload = {
  title?: string;
  content?: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD" | string | null;
  estimated_minutes?: number | null;
  is_bonus_day?: boolean;
};

export type AdminMarathonExternalLinkPayload = {
  title: string;
  url: string;
  order?: number;
};

export type AdminMarathonReadingPassagePayload = {
  passage_number?: string | null;
  title: string;
  passage_text: string;
  difficulty_level: string;
  topic?: string;
  estimated_time_minutes?: number | null;
  max_questions: number;
  time_limit_seconds?: number | null;
  is_active?: boolean;
  is_premium?: boolean;
};

export type AdminMarathonListeningPartPayload = {
  part_number?: string | null;
  title: string;
  transcript_text: string;
  difficulty_level: string;
  estimated_time_minutes?: number | null;
  max_questions: number;
  time_limit_seconds?: number | null;
  is_active?: boolean;
  is_premium?: boolean;
  audio_file?: File | null;
  remove_audio?: boolean;
};

export type MistakeReasonModule = "READING" | "LISTENING" | "BOTH";
export type MistakeReasonCategory = "fully_incorrect" | "blank_answer" | "misspelled";

export type MistakeReasonRecord = {
  id: AdminEntityId;
  reason: string;
  module: MistakeReasonModule;
  mistake_category: MistakeReasonCategory;
  mistake_category_display: string;
  general_solution: string;
  solution_1: string;
  solution_2: string;
  solution_3: string;
  is_file_consists: boolean;
  file_url: string | null;
  link_url: string | null;
  resource_type: "file" | "link" | null;
  resource_url: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type MistakeReasonPayload = {
  reason: string;
  module: MistakeReasonModule;
  mistake_category: MistakeReasonCategory;
  general_solution?: string;
  solution_1?: string;
  solution_2?: string;
  solution_3?: string;
  link_url?: string;
  is_file_consists?: boolean;
  file?: File | null;
};
