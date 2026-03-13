import type {
  StudentAssignment,
  StudentAssignmentAttachmentConfig,
  StudentAssignmentQuestionSetConfig,
  StudentAssignmentSubmissionConfig,
  StudentAssignmentSortKey,
  StudentAssignmentStatus,
  StudentAssignmentTeacher,
  StudentAssignmentWritingConfig,
  StudentModuleKey
} from "@/types/student";

export const STUDENT_ASSIGNMENT_TEACHERS: Record<string, StudentAssignmentTeacher> = {
  sarahJohnson: {
    id: "sarahJohnson",
    name: "Sarah Johnson",
    role: "Senior IELTS Tutor"
  },
  davidChen: {
    id: "davidChen",
    name: "David Chen",
    role: "Listening & Speaking Mentor"
  }
};

const WRITING_ATTACHMENT_CONFIG: StudentAssignmentAttachmentConfig = {
  enabled: true,
  maxFiles: 3,
  maxSizeMb: 5,
  acceptedExtensions: ["pdf", "doc", "docx", "txt"]
};

const SPEAKING_ATTACHMENT_CONFIG: StudentAssignmentAttachmentConfig = {
  enabled: true,
  maxFiles: 2,
  maxSizeMb: 8,
  acceptedExtensions: ["mp3", "wav", "m4a"]
};

const QUESTION_SET_ATTACHMENT_CONFIG: StudentAssignmentAttachmentConfig = {
  enabled: true,
  maxFiles: 2,
  maxSizeMb: 5,
  acceptedExtensions: ["pdf", "docx", "png", "jpg"]
};

const MIXED_ATTACHMENT_CONFIG: StudentAssignmentAttachmentConfig = {
  enabled: true,
  maxFiles: 4,
  maxSizeMb: 8,
  acceptedExtensions: ["pdf", "doc", "docx", "mp3", "wav", "m4a"]
};

const WRITING_TASK2_CONFIG: StudentAssignmentWritingConfig = {
  goalMinWords: 250,
  goalMaxWords: 300,
  minimumWords: 120,
  placeholderKey: "workspace.writing.placeholderTask2"
};

const WRITING_TASK1_CONFIG: StudentAssignmentWritingConfig = {
  goalMinWords: 150,
  goalMaxWords: 200,
  minimumWords: 90,
  placeholderKey: "workspace.writing.placeholderTask1"
};

const DEFAULT_QUESTION_SET_CONFIG: StudentAssignmentQuestionSetConfig = {
  minAnswered: 2,
  questions: [
    {
      id: "q-1",
      promptKey: "workspace.questionSet.defaults.q1Prompt",
      inputType: "shortText",
      placeholderKey: "workspace.questionSet.defaults.shortAnswerPlaceholder"
    },
    {
      id: "q-2",
      promptKey: "workspace.questionSet.defaults.q2Prompt",
      inputType: "multipleChoice",
      options: [
        {value: "A", labelKey: "workspace.questionSet.defaults.options.a"},
        {value: "B", labelKey: "workspace.questionSet.defaults.options.b"},
        {value: "C", labelKey: "workspace.questionSet.defaults.options.c"},
        {value: "D", labelKey: "workspace.questionSet.defaults.options.d"}
      ]
    },
    {
      id: "q-3",
      promptKey: "workspace.questionSet.defaults.q3Prompt",
      inputType: "sentenceCompletion",
      placeholderKey: "workspace.questionSet.defaults.sentencePlaceholder"
    }
  ]
};

const MATCHING_HEADINGS_CONFIG: StudentAssignmentQuestionSetConfig = {
  minAnswered: 3,
  questions: [
    {
      id: "mh-1",
      promptKey: "workspace.questionSet.matchingHeadings.q1Prompt",
      inputType: "shortText",
      placeholderKey: "workspace.questionSet.matchingHeadings.headingPlaceholder"
    },
    {
      id: "mh-2",
      promptKey: "workspace.questionSet.matchingHeadings.q2Prompt",
      inputType: "shortText",
      placeholderKey: "workspace.questionSet.matchingHeadings.headingPlaceholder"
    },
    {
      id: "mh-3",
      promptKey: "workspace.questionSet.matchingHeadings.q3Prompt",
      inputType: "shortText",
      placeholderKey: "workspace.questionSet.matchingHeadings.headingPlaceholder"
    },
    {
      id: "mh-4",
      promptKey: "workspace.questionSet.matchingHeadings.q4Prompt",
      inputType: "noteCompletion",
      placeholderKey: "workspace.questionSet.matchingHeadings.eliminationPlaceholder"
    }
  ]
};

const TFNG_CONFIG: StudentAssignmentQuestionSetConfig = {
  minAnswered: 3,
  questions: [
    {
      id: "tfng-1",
      promptKey: "workspace.questionSet.tfng.q1Prompt",
      inputType: "multipleChoice",
      options: [
        {value: "true", labelKey: "workspace.questionSet.tfng.options.true"},
        {value: "false", labelKey: "workspace.questionSet.tfng.options.false"},
        {value: "notGiven", labelKey: "workspace.questionSet.tfng.options.notGiven"}
      ]
    },
    {
      id: "tfng-2",
      promptKey: "workspace.questionSet.tfng.q2Prompt",
      inputType: "multipleChoice",
      options: [
        {value: "true", labelKey: "workspace.questionSet.tfng.options.true"},
        {value: "false", labelKey: "workspace.questionSet.tfng.options.false"},
        {value: "notGiven", labelKey: "workspace.questionSet.tfng.options.notGiven"}
      ]
    },
    {
      id: "tfng-3",
      promptKey: "workspace.questionSet.tfng.q3Prompt",
      inputType: "multipleChoice",
      options: [
        {value: "true", labelKey: "workspace.questionSet.tfng.options.true"},
        {value: "false", labelKey: "workspace.questionSet.tfng.options.false"},
        {value: "notGiven", labelKey: "workspace.questionSet.tfng.options.notGiven"}
      ]
    }
  ]
};

const DEFAULT_SUBMISSION_BY_MODULE: Record<StudentModuleKey, StudentAssignmentSubmissionConfig> = {
  writing: {
    assignmentType: "writing",
    instructionsKey: "content.instructions.writingDefault",
    teacherNoteKey: "content.teacherNotes.writingDefault",
    quickTipKeys: ["tips.writing.1", "tips.writing.2", "tips.writing.3"],
    attachment: WRITING_ATTACHMENT_CONFIG,
    writingConfig: WRITING_TASK2_CONFIG
  },
  speaking: {
    assignmentType: "speaking",
    instructionsKey: "content.instructions.speakingDefault",
    teacherNoteKey: "content.teacherNotes.speakingDefault",
    quickTipKeys: ["tips.speaking.1", "tips.speaking.2", "tips.speaking.3"],
    attachment: SPEAKING_ATTACHMENT_CONFIG,
    speakingConfig: {
      promptKey: "workspace.speaking.defaultPrompt",
      checklistKeys: ["workspace.speaking.checklist.intro", "workspace.speaking.checklist.examples", "workspace.speaking.checklist.closing"],
      recordingLimitSeconds: 140,
      notesPlaceholderKey: "workspace.speaking.notesPlaceholder"
    }
  },
  reading: {
    assignmentType: "questionSet",
    instructionsKey: "content.instructions.questionSetDefault",
    teacherNoteKey: "content.teacherNotes.questionSetDefault",
    quickTipKeys: ["tips.questionSet.1", "tips.questionSet.2", "tips.questionSet.3"],
    attachment: QUESTION_SET_ATTACHMENT_CONFIG,
    questionSetConfig: DEFAULT_QUESTION_SET_CONFIG
  },
  listening: {
    assignmentType: "questionSet",
    instructionsKey: "content.instructions.questionSetDefault",
    teacherNoteKey: "content.teacherNotes.questionSetDefault",
    quickTipKeys: ["tips.questionSet.1", "tips.questionSet.2", "tips.questionSet.3"],
    attachment: QUESTION_SET_ATTACHMENT_CONFIG,
    questionSetConfig: DEFAULT_QUESTION_SET_CONFIG
  }
};

const STUDENT_ASSIGNMENT_SUBMISSION_OVERRIDES: Record<string, Partial<StudentAssignmentSubmissionConfig>> = {
  "assignment-writing-tech-essay": {
    instructionsKey: "content.instructions.writingTechEssay",
    teacherNoteKey: "content.teacherNotes.writingTechEssay",
    writingConfig: WRITING_TASK2_CONFIG,
    existingDraft:
      "Technology can improve communication speed and access, but it can also reduce the quality of face-to-face interaction in some contexts."
  },
  "assignment-writing-task1-report": {
    instructionsKey: "content.instructions.writingTask1Report",
    teacherNoteKey: "content.teacherNotes.writingTask1Report",
    writingConfig: WRITING_TASK1_CONFIG
  },
  "assignment-speaking-mock": {
    instructionsKey: "content.instructions.speakingMock",
    teacherNoteKey: "content.teacherNotes.speakingMock",
    speakingConfig: {
      promptKey: "workspace.speaking.prompts.mockPart2",
      checklistKeys: ["workspace.speaking.checklist.intro", "workspace.speaking.checklist.examples", "workspace.speaking.checklist.closing"],
      recordingLimitSeconds: 120,
      notesPlaceholderKey: "workspace.speaking.notesPlaceholder"
    }
  },
  "assignment-speaking-fluency-journal": {
    instructionsKey: "content.instructions.speakingJournal",
    teacherNoteKey: "content.teacherNotes.speakingJournal",
    speakingConfig: {
      promptKey: "workspace.speaking.prompts.fluencyJournal",
      checklistKeys: ["workspace.speaking.checklist.intro", "workspace.speaking.checklist.transition", "workspace.speaking.checklist.selfReview"],
      recordingLimitSeconds: 150,
      notesPlaceholderKey: "workspace.speaking.notesPlaceholder"
    }
  },
  "assignment-reading-matching-headings": {
    instructionsKey: "content.instructions.readingMatchingHeadings",
    teacherNoteKey: "content.teacherNotes.readingMatchingHeadings",
    questionSetConfig: MATCHING_HEADINGS_CONFIG,
    existingAnswers: {
      "mh-1": "iv",
      "mh-2": "i"
    }
  },
  "assignment-reading-tfng-accuracy": {
    instructionsKey: "content.instructions.readingTfng",
    teacherNoteKey: "content.teacherNotes.readingTfng",
    questionSetConfig: TFNG_CONFIG
  },
  "assignment-listening-section4-lecture": {
    instructionsKey: "content.instructions.listeningSection4",
    teacherNoteKey: "content.teacherNotes.listeningSection4"
  },
  "assignment-listening-note-completion": {
    instructionsKey: "content.instructions.listeningNoteCompletion",
    teacherNoteKey: "content.teacherNotes.listeningNoteCompletion",
    questionSetConfig: {
      minAnswered: 2,
      questions: [
        {
          id: "ln-1",
          promptKey: "workspace.questionSet.listeningNotes.q1Prompt",
          inputType: "noteCompletion",
          placeholderKey: "workspace.questionSet.listeningNotes.answerPlaceholder"
        },
        {
          id: "ln-2",
          promptKey: "workspace.questionSet.listeningNotes.q2Prompt",
          inputType: "noteCompletion",
          placeholderKey: "workspace.questionSet.listeningNotes.answerPlaceholder"
        },
        {
          id: "ln-3",
          promptKey: "workspace.questionSet.listeningNotes.q3Prompt",
          inputType: "noteCompletion",
          placeholderKey: "workspace.questionSet.listeningNotes.answerPlaceholder"
        }
      ]
    }
  },
  "assignment-vocabulary-quiz": {
    assignmentType: "mixed",
    instructionsKey: "content.instructions.vocabularyMixed",
    teacherNoteKey: "content.teacherNotes.vocabularyMixed",
    quickTipKeys: ["tips.mixed.1", "tips.mixed.2", "tips.mixed.3"],
    attachment: MIXED_ATTACHMENT_CONFIG,
    mixedWritingConfig: {
      goalMinWords: 80,
      goalMaxWords: 130,
      minimumWords: 50,
      placeholderKey: "workspace.mixed.reflectionPlaceholder"
    },
    mixedQuestionSetConfig: {
      minAnswered: 2,
      questions: [
        {
          id: "mx-1",
          promptKey: "workspace.mixed.questions.q1Prompt",
          inputType: "multipleChoice",
          options: [
            {value: "a", labelKey: "workspace.mixed.questions.options.a"},
            {value: "b", labelKey: "workspace.mixed.questions.options.b"},
            {value: "c", labelKey: "workspace.mixed.questions.options.c"}
          ]
        },
        {
          id: "mx-2",
          promptKey: "workspace.mixed.questions.q2Prompt",
          inputType: "shortText",
          placeholderKey: "workspace.mixed.questions.shortPlaceholder"
        },
        {
          id: "mx-3",
          promptKey: "workspace.mixed.questions.q3Prompt",
          inputType: "sentenceCompletion",
          placeholderKey: "workspace.mixed.questions.sentencePlaceholder"
        }
      ]
    }
  }
};

const STUDENT_ASSIGNMENTS_BASE: StudentAssignment[] = [
  {
    id: "assignment-writing-tech-essay",
    title: "Writing Task 2 - Technology Essay",
    module: "writing",
    status: "reviewed",
    teacherId: "sarahJohnson",
    description:
      "Write a balanced Task 2 essay discussing whether technology improves learning outcomes. Focus on argument clarity and examples.",
    dueAt: "2026-03-10T14:00:00.000Z",
    assignedAt: "2026-03-06T08:00:00.000Z",
    estimatedMinutes: 50,
    metaKey: "essayDraft",
    practicePath: "/dashboard"
  },
  {
    id: "assignment-listening-section4-lecture",
    title: "Listening Section 4 - Academic Lecture",
    module: "listening",
    status: "overdue",
    teacherId: "davidChen",
    description:
      "Complete one Section 4 set and submit answers with short notes on distractors you missed.",
    dueAt: "2026-03-11T10:30:00.000Z",
    assignedAt: "2026-03-07T08:30:00.000Z",
    estimatedMinutes: 35,
    metaKey: "audioRequired",
    practicePath: "/listening"
  },
  {
    id: "assignment-reading-matching-headings",
    title: "Reading Practice Set - Matching Headings",
    module: "reading",
    status: "reviewed",
    teacherId: "sarahJohnson",
    description:
      "Reattempt a Matching Headings set and highlight why each eliminated option is incorrect.",
    dueAt: "2026-03-08T09:00:00.000Z",
    assignedAt: "2026-03-03T10:00:00.000Z",
    estimatedMinutes: 30,
    metaKey: "timedPractice",
    practicePath: "/reading"
  },
  {
    id: "assignment-speaking-mock",
    title: "Speaking Mock - Part 2 Fluency",
    module: "speaking",
    status: "pending",
    teacherId: "davidChen",
    description:
      "Record one 2-minute cue-card response and self-evaluate fluency, coherence, and filler word usage.",
    dueAt: "2026-03-18T10:30:00.000Z",
    assignedAt: "2026-03-12T09:20:00.000Z",
    estimatedMinutes: 25,
    metaKey: "speakingRecording",
    practicePath: "/dashboard"
  },
  {
    id: "assignment-vocabulary-quiz",
    title: "Vocabulary Quiz - Academic Collocations",
    module: "reading",
    status: "submitted",
    teacherId: "sarahJohnson",
    description:
      "Submit the collocation quiz and a short reflection on the words you guessed incorrectly.",
    dueAt: "2026-03-20T23:59:00.000Z",
    assignedAt: "2026-03-14T11:00:00.000Z",
    estimatedMinutes: 20,
    isAnytime: true,
    practicePath: "/reading"
  },
  {
    id: "assignment-reading-tfng-accuracy",
    title: "Reading TFNG Accuracy Drill",
    module: "reading",
    status: "reviewed",
    teacherId: "sarahJohnson",
    description:
      "Complete 20 TFNG questions and explain why each Not Given answer is truly unsupported.",
    dueAt: "2026-03-05T13:00:00.000Z",
    assignedAt: "2026-02-28T09:00:00.000Z",
    estimatedMinutes: 28,
    metaKey: "timedPractice",
    practicePath: "/reading"
  },
  {
    id: "assignment-writing-task1-report",
    title: "Writing Task 1 - Data Report",
    module: "writing",
    status: "pending",
    teacherId: "sarahJohnson",
    description:
      "Write a Task 1 report from a line chart and emphasize trend language with accurate comparisons.",
    dueAt: "2026-03-21T16:00:00.000Z",
    assignedAt: "2026-03-15T09:40:00.000Z",
    estimatedMinutes: 40,
    metaKey: "essayDraft",
    practicePath: "/dashboard"
  },
  {
    id: "assignment-listening-note-completion",
    title: "Listening Note Completion Workshop",
    module: "listening",
    status: "submitted",
    teacherId: "davidChen",
    description:
      "Submit one Note Completion attempt and mark where spelling or plural errors reduced your score.",
    dueAt: "2026-03-22T12:30:00.000Z",
    assignedAt: "2026-03-16T10:10:00.000Z",
    estimatedMinutes: 30,
    metaKey: "audioRequired",
    practicePath: "/listening"
  },
  {
    id: "assignment-reading-summary-completion",
    title: "Reading Summary Completion Sprint",
    module: "reading",
    status: "reviewed",
    teacherId: "sarahJohnson",
    description:
      "Practice summary completion using synonym tracking and word-limit validation before finalizing answers.",
    dueAt: "2026-03-02T08:45:00.000Z",
    assignedAt: "2026-02-26T08:45:00.000Z",
    estimatedMinutes: 26,
    metaKey: "timedPractice",
    practicePath: "/reading"
  },
  {
    id: "assignment-writing-cohesion-revision",
    title: "Writing Cohesion Revision Sheet",
    module: "writing",
    status: "submitted",
    teacherId: "sarahJohnson",
    description:
      "Revise linking devices and paragraph transitions from your previous Task 2 response and resubmit.",
    dueAt: "2026-03-24T15:15:00.000Z",
    assignedAt: "2026-03-18T09:00:00.000Z",
    estimatedMinutes: 35,
    metaKey: "essayDraft",
    practicePath: "/dashboard"
  },
  {
    id: "assignment-listening-mcq-retest",
    title: "Listening Multiple Choice Retest",
    module: "listening",
    status: "pending",
    teacherId: "davidChen",
    description:
      "Retake one MCQ set and explain how you ruled out distractors in each wrong attempt.",
    dueAt: "2026-03-25T09:45:00.000Z",
    assignedAt: "2026-03-19T08:25:00.000Z",
    estimatedMinutes: 32,
    metaKey: "audioRequired",
    practicePath: "/listening"
  },
  {
    id: "assignment-speaking-fluency-journal",
    title: "Speaking Fluency Journal",
    module: "speaking",
    status: "overdue",
    teacherId: "davidChen",
    description:
      "Submit a 3-day fluency journal and record one response daily with reduced hesitation markers.",
    dueAt: "2026-03-10T18:00:00.000Z",
    assignedAt: "2026-03-05T12:00:00.000Z",
    estimatedMinutes: 18,
    metaKey: "speakingRecording",
    practicePath: "/dashboard"
  }
];

const mergeQuestionSetConfig = (
  baseConfig: StudentAssignmentQuestionSetConfig | undefined,
  overrideConfig: StudentAssignmentQuestionSetConfig | undefined
): StudentAssignmentQuestionSetConfig | undefined => {
  if (!baseConfig && !overrideConfig) {
    return undefined;
  }

  if (!baseConfig) {
    return overrideConfig;
  }

  if (!overrideConfig) {
    return baseConfig;
  }

  return {
    minAnswered: overrideConfig.minAnswered,
    questions: overrideConfig.questions.length ? overrideConfig.questions : baseConfig.questions
  };
};

const resolveStudentAssignmentSubmission = (assignment: StudentAssignment): StudentAssignmentSubmissionConfig => {
  const base = DEFAULT_SUBMISSION_BY_MODULE[assignment.module];
  const override = STUDENT_ASSIGNMENT_SUBMISSION_OVERRIDES[assignment.id] ?? {};

  return {
    ...base,
    ...override,
    attachment: override.attachment ?? base.attachment,
    quickTipKeys: override.quickTipKeys ?? base.quickTipKeys,
    writingConfig: override.writingConfig ?? base.writingConfig,
    speakingConfig: override.speakingConfig ?? base.speakingConfig,
    questionSetConfig: mergeQuestionSetConfig(base.questionSetConfig, override.questionSetConfig),
    mixedQuestionSetConfig: mergeQuestionSetConfig(base.mixedQuestionSetConfig, override.mixedQuestionSetConfig),
    mixedWritingConfig: override.mixedWritingConfig ?? base.mixedWritingConfig,
    existingDraft: override.existingDraft ?? base.existingDraft,
    existingAnswers: {
      ...(base.existingAnswers ?? {}),
      ...(override.existingAnswers ?? {})
    },
    existingUploadedFiles: [...(base.existingUploadedFiles ?? []), ...(override.existingUploadedFiles ?? [])]
  };
};

export const STUDENT_ASSIGNMENTS: StudentAssignment[] = STUDENT_ASSIGNMENTS_BASE.map((assignment) => ({
  ...assignment,
  submission: resolveStudentAssignmentSubmission(assignment)
}));

export const getStudentAssignmentById = (assignmentId: string) =>
  STUDENT_ASSIGNMENTS.find((assignment) => assignment.id === assignmentId) ?? null;

export const STUDENT_ASSIGNMENT_MODULE_FILTERS: {value: "all" | StudentModuleKey; labelKey: string}[] = [
  {value: "all", labelKey: "filters.module.all"},
  {value: "reading", labelKey: "filters.module.reading"},
  {value: "listening", labelKey: "filters.module.listening"},
  {value: "writing", labelKey: "filters.module.writing"},
  {value: "speaking", labelKey: "filters.module.speaking"}
];

export const STUDENT_ASSIGNMENT_STATUS_FILTERS: {value: "all" | StudentAssignmentStatus; labelKey: string}[] = [
  {value: "all", labelKey: "filters.status.all"},
  {value: "pending", labelKey: "status.pending"},
  {value: "submitted", labelKey: "status.submitted"},
  {value: "reviewed", labelKey: "status.reviewed"},
  {value: "overdue", labelKey: "status.overdue"}
];

export const STUDENT_ASSIGNMENT_SORT_OPTIONS: {value: StudentAssignmentSortKey; labelKey: string}[] = [
  {value: "urgent", labelKey: "filters.sort.urgent"},
  {value: "deadlineAsc", labelKey: "filters.sort.deadlineAsc"},
  {value: "deadlineDesc", labelKey: "filters.sort.deadlineDesc"}
];
