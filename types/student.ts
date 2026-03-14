export type StudentProgressRangeKey = "last6Tests" | "last12Tests";

export type StudentModuleKey = "reading" | "listening" | "writing" | "speaking";

export type StudentQuestionTypeKey =
  | "matchingHeadings"
  | "multipleChoice"
  | "sentenceCompletion"
  | "task2Essay"
  | "task1Report"
  | "noteCompletion"
  | "trueFalseNotGiven";

export type StudentInsightTone = "positive" | "neutral" | "warning";

export type StudentProgressSummary = {
  currentBandEstimate: number;
  currentBandDelta: number;
  targetBand: number;
  practiceSessions: number;
  averageAccuracy: number;
  accuracyDelta: number;
};

export type StudentBandProgressPoint = {
  id: string;
  labelKey: "test1" | "test2" | "test3" | "test4" | "test5" | "recent" | "test6" | "test7" | "test8" | "test9" | "test10" | "test11";
  band: number;
};

export type StudentModulePerformance = {
  module: StudentModuleKey;
  percentage: number;
};

export type StudentAccuracyPoint = {
  id: string;
  labelKey: "w1" | "w2" | "w3" | "w4" | "w5" | "w6";
  percentage: number;
};

export type StudentWeeklyStudyPoint = {
  id: string;
  labelKey: "w1" | "w2" | "w3" | "w4";
  sessions: number;
};

export type StudentLearningInsight = {
  id: "readingImproved" | "listeningConsistent" | "writingWeakest" | "band7WritingNote";
  tone: StudentInsightTone;
};

export type StudentPracticeActivity = {
  id: string;
  dateKey: "today1045" | "yesterday" | "oct22";
  module: StudentModuleKey;
  questionType: StudentQuestionTypeKey;
  accuracy: number;
  durationMinutes: number;
  action: "navigate" | "toast";
  href?: "/reading" | "/listening" | "/dashboard";
};

export type StudentProfile = {
  id: string;
  name: string;
  targetBand: number;
};

export type StudentTestRecord = {
  id: string;
  studentId: string;
  testName: string;
  module: StudentModuleKey;
  completedAt: string;
  correctAnswers: number;
  totalQuestions: number;
  estimatedBand: number;
};

export type StudentStreakConfig = {
  initialStreakDays: number;
  windowStartDate: string;
};

export type StudentDailyStreakPoint = {
  date: string;
  hasTest: boolean;
  streakAfterDay: number;
};

export type StudentStreakResult = {
  currentStreakDays: number;
  completedTestToday: boolean;
  timeline: StudentDailyStreakPoint[];
};

export type StudentOneToOneSessionStatus = "scheduled" | "completed" | "cancelled" | "pending";

export type StudentOneToOneMeetingType = "zoom" | "googleMeet" | "inPlatform";

export type StudentOneToOneSession = {
  id: string;
  studentId: string;
  teacherId: StudentAssignmentTeacherId;
  title: string;
  startsAt: string;
  endsAt: string;
  status: StudentOneToOneSessionStatus;
  meetingType: StudentOneToOneMeetingType;
  purpose: string;
  note?: string;
};

export type StudentOneToOneAvailabilitySlot = {
  id: string;
  teacherId: StudentAssignmentTeacherId;
  startsAt: string;
  endsAt: string;
  meetingType: StudentOneToOneMeetingType;
  available: boolean;
};

export type StudentStudyBankQuestionTypeKey =
  | "matchingHeadings"
  | "trueFalseNotGiven"
  | "multipleChoice"
  | "sentenceCompletion"
  | "noteCompletion"
  | "task1Report"
  | "task2Essay";

export type StudentStudyBankDifficulty = "easy" | "medium" | "hard";

export type StudentStudyBankSortKey = "newest" | "oldest" | "difficulty" | "module";

export type StudentSavedQuestion = {
  id: string;
  module: StudentModuleKey;
  questionType: StudentStudyBankQuestionTypeKey;
  difficulty: StudentStudyBankDifficulty;
  sourceLabel: string;
  snippet: string;
  context: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  previousAnswer: string;
  explanation: string;
  savedAt: string;
  savedAgoKey: "days3" | "week1" | "weeks2" | "days5" | "days9";
  reviewReasons: StudentReviewReason[];
  isWeakArea: boolean;
  isNew: boolean;
  linkedPracticePath: "/reading" | "/listening" | "/dashboard";
  reference: {
    collection: "reading-tests" | "listening-tests" | "writing-bank";
    testId: string;
    questionId: string;
  };
};

export type StudentReviewReason = "wrong" | "saved" | "flagged" | "weakArea";

export type StudentCoachMessageRole = "student" | "assistant";

export type StudentCoachMessage = {
  id: string;
  role: StudentCoachMessageRole;
  content: string;
  createdAt: string;
  meta?: {
    isSeed?: boolean;
  };
};

export type StudentCoachAccuracyType = "matchingHeadings" | "trueFalseNotGiven" | "multipleChoice" | "sentenceCompletion";

export type StudentCoachAccuracyRow = {
  id: string;
  type: StudentCoachAccuracyType;
  accuracy: number;
};

export type StudentCoachStrategyCard = {
  id: "dailyReadingRhythm" | "writingTaskFeedback" | "consolidateStrengths";
  tone: "amber" | "indigo" | "emerald";
  action: "navigate" | "toast";
  href?: "/reading" | "/dashboard" | "/listening";
};

export type StudentCoachRecommendation = {
  id: "practiceMatchingHeadings" | "focusTask2Structure" | "reviewTfngStrategy" | "revisitStudyBank";
  tag: "reading" | "writing" | "listening" | "studyBank";
  action: "navigate" | "toast";
  href?: "/reading" | "/dashboard" | "/listening" | "/study-bank" | "/review-center";
};

export type StudentAssignmentStatus = "pending" | "submitted" | "reviewed" | "overdue";

export type StudentAssignmentSortKey = "urgent" | "deadlineAsc" | "deadlineDesc";

export type StudentAssignmentTeacherId = "sarahJohnson" | "davidChen";

export type StudentAssignmentTeacher = {
  id: StudentAssignmentTeacherId;
  name: string;
  role: string;
};

export type StudentAssignmentMetaKey = "audioRequired" | "essayDraft" | "timedPractice" | "speakingRecording";

export type StudentAssignmentSubmissionType = "writing" | "speaking" | "questionSet" | "mixed";

export type StudentAssignmentQuestionInputType = "shortText" | "multipleChoice" | "sentenceCompletion" | "noteCompletion";

export type StudentAssignmentQuestionOption = {
  value: string;
  labelKey: string;
};

export type StudentAssignmentQuestionItem = {
  id: string;
  promptKey: string;
  inputType: StudentAssignmentQuestionInputType;
  placeholderKey?: string;
  options?: StudentAssignmentQuestionOption[];
};

export type StudentAssignmentWritingConfig = {
  goalMinWords: number;
  goalMaxWords: number;
  minimumWords: number;
  placeholderKey: string;
};

export type StudentAssignmentSpeakingConfig = {
  promptKey: string;
  checklistKeys: string[];
  recordingLimitSeconds: number;
  notesPlaceholderKey: string;
};

export type StudentAssignmentQuestionSetConfig = {
  questions: StudentAssignmentQuestionItem[];
  minAnswered: number;
};

export type StudentAssignmentAttachmentConfig = {
  enabled: boolean;
  maxFiles: number;
  maxSizeMb: number;
  acceptedExtensions: string[];
};

export type StudentAssignmentUploadedFile = {
  id: string;
  name: string;
  sizeKb: number;
  source: "existing" | "new";
};

export type StudentAssignmentSubmissionConfig = {
  assignmentType: StudentAssignmentSubmissionType;
  instructionsKey: string;
  teacherNoteKey?: string;
  quickTipKeys: string[];
  attachment: StudentAssignmentAttachmentConfig;
  writingConfig?: StudentAssignmentWritingConfig;
  speakingConfig?: StudentAssignmentSpeakingConfig;
  questionSetConfig?: StudentAssignmentQuestionSetConfig;
  mixedWritingConfig?: StudentAssignmentWritingConfig;
  mixedQuestionSetConfig?: StudentAssignmentQuestionSetConfig;
  existingDraft?: string;
  existingAnswers?: Record<string, string>;
  existingUploadedFiles?: StudentAssignmentUploadedFile[];
};

export type StudentAssignment = {
  id: string;
  title: string;
  module: StudentModuleKey;
  status: StudentAssignmentStatus;
  teacherId: StudentAssignmentTeacherId;
  description: string;
  dueAt: string;
  assignedAt: string;
  estimatedMinutes: number;
  isAnytime?: boolean;
  metaKey?: StudentAssignmentMetaKey;
  practicePath: "/reading" | "/listening" | "/dashboard";
  submission?: StudentAssignmentSubmissionConfig;
};

export type StudentTeacherFeedbackTimeKey = "today" | "yesterday" | "days2" | "days3" | "days5" | "week1";

export type StudentTeacherFeedbackCriteriaTone = "strong" | "mid" | "focus";

export type StudentTeacherFeedbackCriterion = {
  id: "taskResponse" | "coherenceCohesion" | "lexicalResource" | "grammaticalRange" | "pronunciation" | "fluency";
  labelKey: string;
  score: number;
  tone: StudentTeacherFeedbackCriteriaTone;
};

export type StudentTeacherFeedbackSection = {
  id: string;
  titleKey: string;
  feedbackKey: string;
  highlightKey?: string;
};

export type StudentTeacherFeedbackAction = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  ctaKey: string;
  action: "navigate" | "toast";
  href?: string;
};

export type StudentTeacherFeedbackRecord = {
  id: string;
  assignmentId: string;
  assignmentType: StudentAssignmentSubmissionType;
  module: StudentModuleKey;
  teacherId: StudentAssignmentTeacherId;
  status: "reviewed";
  submittedAt: string;
  reviewedAt: string;
  submittedRelativeKey: StudentTeacherFeedbackTimeKey;
  reviewedRelativeKey: StudentTeacherFeedbackTimeKey;
  overallBand: number;
  overallAssessmentKey: string;
  promptKey: string;
  submissionPreviewKey: string;
  fullSubmissionKey: string;
  wordCount: number;
  criteriaNoteKey: string;
  criteria: StudentTeacherFeedbackCriterion[];
  sections: StudentTeacherFeedbackSection[];
  actions: StudentTeacherFeedbackAction[];
};

export type StudentMessageAttachmentType = "pdf" | "essay" | "audio" | "image";

export type StudentMessageAttachment = {
  id: string;
  type: StudentMessageAttachmentType;
  name: string;
  sizeKb: number;
};

export type StudentMessageSender = "student" | "teacher";

export type StudentTeacherConversation = {
  id: string;
  teacherId: StudentAssignmentTeacherId;
  assignmentIds: string[];
  lastMessagePreview?: string;
  lastMessagePreviewKey?: string;
  lastMessageAt: string;
  unreadCount: number;
  topicKey: string;
};

export type StudentTeacherMessage = {
  id: string;
  conversationId: string;
  sender: StudentMessageSender;
  text?: string;
  textKey?: string;
  createdAt: string;
  attachments?: StudentMessageAttachment[];
};

export type StudentTeacherProfileCard = {
  teacherId: StudentAssignmentTeacherId;
  roleKey: string;
  studentsCount: number;
  reviewsCompleted: number;
  expertiseKey: string;
};
