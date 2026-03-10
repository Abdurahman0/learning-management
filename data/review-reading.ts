import type { ReadingFullTest, ReadingPassage } from "@/data/reading-tests";

export type ReviewQuestionStatus = "correct" | "incorrect" | "skipped";

export type ReviewQuestion = {
  id: string;
  number: number;
  type: string;
  prompt: string;
  userAnswer?: string;
  correctAnswer: string;
  status: ReviewQuestionStatus;
  explanation: string;
  evidenceLabel?: string;
  evidenceText?: string;
  passageId: string;
};

export type ReviewPassage = {
  id: string;
  title: string;
  label: string;
  paragraphs: {
    id: string;
    label: string;
    text: string;
    highlights?: {
      questionNumber: number;
      text: string;
    }[];
  }[];
};

export type VideoLesson = {
  id: string;
  title: string;
  description: string;
  duration: string;
  instructor: string;
  tag: string;
  thumbnailLabel?: string;
  timestamps?: { label: string; time: string }[];
};

export type AiCoachData = {
  score: string;
  accuracy: string;
  timeUsed: string;
  weakestQuestionType: string;
  weakestPassage: string;
  insights: string[];
  plan: string[];
};

export type PassageHeatmapItem = {
  passageId: string;
  label: string;
  level: "excellent" | "average" | "critical";
  answeredCorrectly: number;
  total: number;
};

export type MistakeBreakdownItem = {
  id: string;
  label: string;
  successRate: number;
};

export type NextAction = {
  id: string;
  kind: "primary" | "secondary";
  actionKey:
    | "startPracticeSession"
    | "generateSimilarTest"
    | "practiceWeakAreas"
    | "takeSimilarTest"
    | "returnToDashboard"
    | "downloadReviewPdf"
    | "saveToStudyBank";
};

export type ReviewReadingData = {
  videoLesson: VideoLesson;
  aiCoach: AiCoachData;
  mistakeBreakdown: MistakeBreakdownItem[];
  heatmap: PassageHeatmapItem[];
  nextActions: NextAction[];
};

const DEFAULT_VIDEO_LESSON: VideoLesson = {
  id: "reading-strategy-lesson",
  title: "Reading Strategy Debrief: Evidence and Elimination",
  description:
    "A focused walkthrough of how to locate supporting lines faster, eliminate distractors, and handle passage transitions under time pressure.",
  duration: "12:40",
  instructor: "IELTS MASTER Coach",
  tag: "Reading Band 7+",
  thumbnailLabel: "Lesson Preview",
  timestamps: [
    { label: "Passage Overview", time: "00:45" },
    { label: "Matching Headings Strategy", time: "03:10" },
    { label: "Multiple Choice Tips", time: "06:25" },
    { label: "Time Management Fixes", time: "09:30" },
  ],
};

const DEFAULT_AI_COACH: AiCoachData = {
  score: "27/40",
  accuracy: "67%",
  timeUsed: "54m",
  weakestQuestionType: "Matching Headings",
  weakestPassage: "Passage 3",
  insights: [
    "You locate explicit facts quickly but lose accuracy when selecting paragraph-level themes.",
    "Your error pattern increases in the final passage, suggesting cognitive load and timing pressure.",
    "Most incorrect responses were close distractors, which indicates elimination strategy needs tightening.",
  ],
  plan: [
    "Drill Matching Headings for 30 minutes with timed sets.",
    "Practice paragraph main-idea identification before checking options.",
    "Review topic vocabulary clusters for environment and public policy passages.",
  ],
};

const DEFAULT_BREAKDOWN: MistakeBreakdownItem[] = [
  { id: "matchingHeadings", label: "Matching Headings", successRate: 40 },
  { id: "tfng", label: "True / False / Not Given", successRate: 63 },
  { id: "mcq", label: "Multiple Choice", successRate: 75 },
  { id: "sentenceCompletion", label: "Sentence Completion", successRate: 80 },
];

const DEFAULT_HEATMAP: PassageHeatmapItem[] = [
  { passageId: "p1", label: "P1", level: "excellent", answeredCorrectly: 9, total: 13 },
  { passageId: "p2", label: "P2", level: "average", answeredCorrectly: 7, total: 13 },
  { passageId: "p3", label: "P3", level: "critical", answeredCorrectly: 3, total: 14 },
];

const DEFAULT_NEXT_ACTIONS: NextAction[] = [
  { id: "practice-weak-areas", kind: "primary", actionKey: "practiceWeakAreas" },
  { id: "start-practice-session", kind: "primary", actionKey: "startPracticeSession" },
  { id: "take-similar-test", kind: "secondary", actionKey: "takeSimilarTest" },
  { id: "return-dashboard", kind: "secondary", actionKey: "returnToDashboard" },
  { id: "download-review-pdf", kind: "secondary", actionKey: "downloadReviewPdf" },
  { id: "save-study-bank", kind: "secondary", actionKey: "saveToStudyBank" },
];

const REVIEW_READING_BY_TEST: Record<string, ReviewReadingData> = {
  "cambridge-18-test-2": {
    videoLesson: {
      ...DEFAULT_VIDEO_LESSON,
      id: "c18t2-video",
      title: "Urban Gardens: Matching Headings and Evidence Linking",
      tag: "Academic Reading",
    },
    aiCoach: {
      ...DEFAULT_AI_COACH,
      weakestPassage: "Passage 2",
    },
    mistakeBreakdown: DEFAULT_BREAKDOWN,
    heatmap: DEFAULT_HEATMAP,
    nextActions: DEFAULT_NEXT_ACTIONS,
  },
};

export function getReadingReviewData(testId: string): ReviewReadingData {
  return REVIEW_READING_BY_TEST[testId] ?? {
    videoLesson: DEFAULT_VIDEO_LESSON,
    aiCoach: DEFAULT_AI_COACH,
    mistakeBreakdown: DEFAULT_BREAKDOWN,
    heatmap: DEFAULT_HEATMAP,
    nextActions: DEFAULT_NEXT_ACTIONS,
  };
}

function toParagraphLabel(index: number) {
  return String.fromCharCode(65 + index);
}

export function buildReviewPassages(test: ReadingFullTest): ReviewPassage[] {
  return test.passages.map((passage: ReadingPassage, passageIndex) => {
    const paragraphs = passage.text.split("\n\n");
    const highlightsByParagraph = new Map<number, Array<{ questionNumber: number; text: string }>>();

    test.questions.forEach((question) => {
      question.evidenceSpans
        .filter((span) => span.passageId === passage.id)
        .forEach((span) => {
          const list = highlightsByParagraph.get(span.paragraphIndex) ?? [];
          list.push({
            questionNumber: question.number,
            text: span.phrase === "__AUTO_PHRASE__" ? question.prompt : span.phrase,
          });
          highlightsByParagraph.set(span.paragraphIndex, list);
        });
    });

    return {
      id: passage.id,
      title: passage.title,
      label: `Passage ${passageIndex + 1}`,
      paragraphs: paragraphs.map((text, paragraphIndex) => ({
        id: `review-para-${passage.id}-${paragraphIndex}`,
        label: toParagraphLabel(paragraphIndex),
        text,
        highlights: highlightsByParagraph.get(paragraphIndex),
      })),
    };
  });
}
