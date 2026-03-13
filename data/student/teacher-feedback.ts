import type {StudentTeacherFeedbackRecord} from "@/types/student";

export const STUDENT_TEACHER_FEEDBACK: StudentTeacherFeedbackRecord[] = [
  {
    id: "feedback-writing-tech-essay",
    assignmentId: "assignment-writing-tech-essay",
    assignmentType: "writing",
    module: "writing",
    teacherId: "sarahJohnson",
    status: "reviewed",
    submittedAt: "2026-03-10T10:45:00.000Z",
    reviewedAt: "2026-03-13T09:20:00.000Z",
    submittedRelativeKey: "days3",
    reviewedRelativeKey: "today",
    overallBand: 6.5,
    overallAssessmentKey: "entries.writingTech.assessment",
    promptKey: "entries.writingTech.prompt",
    submissionPreviewKey: "entries.writingTech.preview",
    fullSubmissionKey: "entries.writingTech.fullSubmission",
    wordCount: 284,
    criteriaNoteKey: "entries.writingTech.criteriaNote",
    criteria: [
      {id: "taskResponse", labelKey: "criteria.taskResponse", score: 7.0, tone: "strong"},
      {id: "coherenceCohesion", labelKey: "criteria.coherenceCohesion", score: 6.5, tone: "mid"},
      {id: "lexicalResource", labelKey: "criteria.lexicalResource", score: 6.0, tone: "focus"},
      {id: "grammaticalRange", labelKey: "criteria.grammaticalRange", score: 6.0, tone: "focus"}
    ],
    sections: [
      {
        id: "introThesis",
        titleKey: "entries.writingTech.sections.introThesis.title",
        feedbackKey: "entries.writingTech.sections.introThesis.feedback",
        highlightKey: "entries.writingTech.sections.introThesis.highlight"
      },
      {
        id: "bodyPositive",
        titleKey: "entries.writingTech.sections.bodyPositive.title",
        feedbackKey: "entries.writingTech.sections.bodyPositive.feedback",
        highlightKey: "entries.writingTech.sections.bodyPositive.highlight"
      },
      {
        id: "bodyNegative",
        titleKey: "entries.writingTech.sections.bodyNegative.title",
        feedbackKey: "entries.writingTech.sections.bodyNegative.feedback",
        highlightKey: "entries.writingTech.sections.bodyNegative.highlight"
      },
      {
        id: "conclusion",
        titleKey: "entries.writingTech.sections.conclusion.title",
        feedbackKey: "entries.writingTech.sections.conclusion.feedback"
      },
      {
        id: "vocabularyGrammar",
        titleKey: "entries.writingTech.sections.vocabularyGrammar.title",
        feedbackKey: "entries.writingTech.sections.vocabularyGrammar.feedback",
        highlightKey: "entries.writingTech.sections.vocabularyGrammar.highlight"
      }
    ],
    actions: [
      {
        id: "practiceSimilarTask",
        titleKey: "entries.writingTech.actions.practiceSimilarTask.title",
        descriptionKey: "entries.writingTech.actions.practiceSimilarTask.description",
        ctaKey: "entries.writingTech.actions.practiceSimilarTask.cta",
        action: "navigate",
        href: "/reading"
      },
      {
        id: "reviewMistakes",
        titleKey: "entries.writingTech.actions.reviewMistakes.title",
        descriptionKey: "entries.writingTech.actions.reviewMistakes.description",
        ctaKey: "entries.writingTech.actions.reviewMistakes.cta",
        action: "navigate",
        href: "/mistake-analysis"
      },
      {
        id: "openAiCoach",
        titleKey: "entries.writingTech.actions.openAiCoach.title",
        descriptionKey: "entries.writingTech.actions.openAiCoach.description",
        ctaKey: "entries.writingTech.actions.openAiCoach.cta",
        action: "navigate",
        href: "/ai-coach"
      }
    ]
  },
  {
    id: "feedback-reading-matching-headings",
    assignmentId: "assignment-reading-matching-headings",
    assignmentType: "questionSet",
    module: "reading",
    teacherId: "sarahJohnson",
    status: "reviewed",
    submittedAt: "2026-03-08T08:10:00.000Z",
    reviewedAt: "2026-03-09T13:30:00.000Z",
    submittedRelativeKey: "days5",
    reviewedRelativeKey: "days3",
    overallBand: 6.0,
    overallAssessmentKey: "entries.readingMatching.assessment",
    promptKey: "entries.readingMatching.prompt",
    submissionPreviewKey: "entries.readingMatching.preview",
    fullSubmissionKey: "entries.readingMatching.fullSubmission",
    wordCount: 94,
    criteriaNoteKey: "entries.readingMatching.criteriaNote",
    criteria: [
      {id: "taskResponse", labelKey: "criteria.accuracy", score: 6.0, tone: "mid"},
      {id: "coherenceCohesion", labelKey: "criteria.strategyUse", score: 6.0, tone: "mid"},
      {id: "lexicalResource", labelKey: "criteria.paraphraseControl", score: 5.5, tone: "focus"},
      {id: "grammaticalRange", labelKey: "criteria.timeManagement", score: 6.5, tone: "strong"}
    ],
    sections: [
      {
        id: "instructionControl",
        titleKey: "entries.readingMatching.sections.instructionControl.title",
        feedbackKey: "entries.readingMatching.sections.instructionControl.feedback"
      },
      {
        id: "eliminationProcess",
        titleKey: "entries.readingMatching.sections.eliminationProcess.title",
        feedbackKey: "entries.readingMatching.sections.eliminationProcess.feedback",
        highlightKey: "entries.readingMatching.sections.eliminationProcess.highlight"
      },
      {
        id: "paraphraseRecognition",
        titleKey: "entries.readingMatching.sections.paraphraseRecognition.title",
        feedbackKey: "entries.readingMatching.sections.paraphraseRecognition.feedback"
      }
    ],
    actions: [
      {
        id: "runReadingDrill",
        titleKey: "entries.readingMatching.actions.runReadingDrill.title",
        descriptionKey: "entries.readingMatching.actions.runReadingDrill.description",
        ctaKey: "entries.readingMatching.actions.runReadingDrill.cta",
        action: "navigate",
        href: "/reading"
      },
      {
        id: "openCoachPlan",
        titleKey: "entries.readingMatching.actions.openCoachPlan.title",
        descriptionKey: "entries.readingMatching.actions.openCoachPlan.description",
        ctaKey: "entries.readingMatching.actions.openCoachPlan.cta",
        action: "navigate",
        href: "/ai-coach"
      }
    ]
  }
];

export const getStudentTeacherFeedbackByAssignmentId = (assignmentId: string) =>
  STUDENT_TEACHER_FEEDBACK.find((entry) => entry.assignmentId === assignmentId) ?? null;
