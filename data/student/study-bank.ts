import type {
  StudentModuleKey,
  StudentSavedQuestion,
  StudentStudyBankDifficulty,
  StudentStudyBankQuestionTypeKey,
  StudentStudyBankSortKey
} from "@/types/student";

export const STUDY_BANK_MODULE_OPTIONS: {value: "all" | StudentModuleKey; labelKey: string}[] = [
  {value: "all", labelKey: "filters.module.all"},
  {value: "reading", labelKey: "filters.module.reading"},
  {value: "listening", labelKey: "filters.module.listening"},
  {value: "writing", labelKey: "filters.module.writing"},
  {value: "speaking", labelKey: "filters.module.speaking"}
];

export const STUDY_BANK_QUESTION_TYPE_OPTIONS: {value: "all" | StudentStudyBankQuestionTypeKey; labelKey: string}[] = [
  {value: "all", labelKey: "filters.questionType.all"},
  {value: "matchingHeadings", labelKey: "filters.questionType.matchingHeadings"},
  {value: "trueFalseNotGiven", labelKey: "filters.questionType.trueFalseNotGiven"},
  {value: "multipleChoice", labelKey: "filters.questionType.multipleChoice"},
  {value: "sentenceCompletion", labelKey: "filters.questionType.sentenceCompletion"},
  {value: "noteCompletion", labelKey: "filters.questionType.noteCompletion"},
  {value: "task1Report", labelKey: "filters.questionType.task1Report"},
  {value: "task2Essay", labelKey: "filters.questionType.task2Essay"}
];

export const STUDY_BANK_DIFFICULTY_OPTIONS: {value: "all" | StudentStudyBankDifficulty; labelKey: string}[] = [
  {value: "all", labelKey: "filters.difficulty.all"},
  {value: "easy", labelKey: "filters.difficulty.easy"},
  {value: "medium", labelKey: "filters.difficulty.medium"},
  {value: "hard", labelKey: "filters.difficulty.hard"}
];

export const STUDY_BANK_SORT_OPTIONS: {value: StudentStudyBankSortKey; labelKey: string}[] = [
  {value: "newest", labelKey: "filters.sort.newest"},
  {value: "oldest", labelKey: "filters.sort.oldest"},
  {value: "difficulty", labelKey: "filters.sort.difficulty"},
  {value: "module", labelKey: "filters.sort.module"}
];

export const STUDENT_SAVED_QUESTIONS: StudentSavedQuestion[] = [
  {
    id: "saved-reading-mh-1",
    module: "reading",
    questionType: "matchingHeadings",
    difficulty: "medium",
    sourceLabel: "Cambridge IELTS 18 / Test 2 / Passage 1",
    snippet:
      "The primary purpose of the environmental assessment was to determine the level of noise pollution in urban districts before redevelopment.",
    context:
      "While the 19th-century industrial revolution focused on mechanical production, the 21st-century digital shift centers on the seamless flow of data.",
    question: "Which paragraph contains information about the core differences between the industrial and digital revolutions?",
    options: ["Paragraph A", "Paragraph B", "Paragraph C", "Paragraph D"],
    correctAnswer: "Paragraph C",
    previousAnswer: "Paragraph B",
    explanation:
      "Paragraph C explicitly contrasts mechanical production in the 19th century with data-flow systems in the current era. Paragraph B focuses on data security only.",
    savedAt: "2026-03-10T10:10:00.000Z",
    savedAgoKey: "days3",
    reviewReasons: ["wrong", "saved", "weakArea", "flagged"],
    isWeakArea: true,
    isNew: true,
    linkedPracticePath: "/reading",
    reference: {
      collection: "reading-tests",
      testId: "cambridge-18-test-2",
      questionId: "r18t2q07"
    }
  },
  {
    id: "saved-listening-mcq-1",
    module: "listening",
    questionType: "multipleChoice",
    difficulty: "hard",
    sourceLabel: "Official Guide / Practice Test 4 / Section 3",
    snippet: "What does the tutor suggest regarding the student's initial proposal for the engineering project?",
    context:
      "The tutor notes that the first draft is promising but lacks a measurable timeline and specific material constraints for testing.",
    question: "What is the tutor's main recommendation before the student submits the final proposal?",
    options: [
      "Change the project topic completely",
      "Add a staged timeline with testing criteria",
      "Delay submission by two weeks",
      "Use only qualitative feedback"
    ],
    correctAnswer: "Add a staged timeline with testing criteria",
    previousAnswer: "Change the project topic completely",
    explanation:
      "The tutor does not request a full topic change. The feedback focuses on improving structure and measurable milestones in the current proposal.",
    savedAt: "2026-03-06T15:40:00.000Z",
    savedAgoKey: "week1",
    reviewReasons: ["wrong", "saved", "weakArea", "flagged"],
    isWeakArea: true,
    isNew: true,
    linkedPracticePath: "/listening",
    reference: {
      collection: "listening-tests",
      testId: "l-006",
      questionId: "l6-s3-q24"
    }
  },
  {
    id: "saved-writing-task2-1",
    module: "writing",
    questionType: "task2Essay",
    difficulty: "medium",
    sourceLabel: "Recent Actual / 12 Oct 2023",
    snippet:
      "Some people believe that it is best to accept a bad situation, such as an unsatisfactory job or shortage of money.",
    context: "You should discuss both views and give your own opinion with clear supporting examples.",
    question: "Write an essay response with a clear position and at least two developed supporting arguments.",
    correctAnswer: "Balanced discussion with clear opinion and examples",
    previousAnswer: "One-sided argument without examples",
    explanation:
      "Task 2 responses need a clear position, balanced development, and concrete examples. The previous attempt lacked support and paragraph cohesion.",
    savedAt: "2026-03-01T13:00:00.000Z",
    savedAgoKey: "weeks2",
    reviewReasons: ["saved", "weakArea"],
    isWeakArea: true,
    isNew: false,
    linkedPracticePath: "/dashboard",
    reference: {
      collection: "writing-bank",
      testId: "writing-task2-actual-2023-10-12",
      questionId: "w2-q01"
    }
  },
  {
    id: "saved-reading-tfng-1",
    module: "reading",
    questionType: "trueFalseNotGiven",
    difficulty: "easy",
    sourceLabel: "Cambridge IELTS 16 / Test 2 / Passage 2",
    snippet: "The report states that all pilot cities achieved the same reduction in transport emissions.",
    context:
      "A comparative section in the passage shows different outcomes across cities based on infrastructure and policy implementation speed.",
    question: "The statement says all pilot cities reduced emissions equally. Is this true, false, or not given?",
    options: ["True", "False", "Not Given"],
    correctAnswer: "False",
    previousAnswer: "Not Given",
    explanation: "The passage gives specific contrasting percentages for several cities, so the claim of equal reduction is clearly false.",
    savedAt: "2026-03-08T09:10:00.000Z",
    savedAgoKey: "days5",
    reviewReasons: ["wrong", "saved", "flagged"],
    isWeakArea: false,
    isNew: true,
    linkedPracticePath: "/reading",
    reference: {
      collection: "reading-tests",
      testId: "cambridge-16-test-2",
      questionId: "r16t2q14"
    }
  },
  {
    id: "saved-listening-note-1",
    module: "listening",
    questionType: "noteCompletion",
    difficulty: "medium",
    sourceLabel: "Cambridge IELTS 19 Listening Test 2 / Part 4",
    snippet: "Complete the notes about how urban wetlands improve local climate resilience.",
    context:
      "The lecture explains temperature regulation, flood buffering, and biodiversity support in restored wetland zones.",
    question: "Complete the notes with ONE WORD ONLY for each gap.",
    correctAnswer: "Retention ponds",
    previousAnswer: "Drainage tunnels",
    explanation:
      "The speaker refers specifically to retention ponds as the key intervention. Drainage tunnels were discussed as a separate legacy system.",
    savedAt: "2026-03-04T18:30:00.000Z",
    savedAgoKey: "days9",
    reviewReasons: ["wrong", "saved"],
    isWeakArea: false,
    isNew: false,
    linkedPracticePath: "/listening",
    reference: {
      collection: "listening-tests",
      testId: "cambridge-19-listening-2",
      questionId: "l19t2p4q36"
    }
  }
];


