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
  listening_parts_count: number;
  reading_passages_count: number;
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
  test_format: string;
  total_questions: number;
  time_limit_seconds: number | null;
  is_active: boolean;
};

export type PracticeTestPatchPayload = Partial<PracticeTestCreatePayload>;

export type ListeningPartPayload = {
  part_number: string;
  title: string;
  transcript_text: string;
  max_questions: number;
  time_limit_seconds: number | null;
  is_active: boolean;
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
