export type ListeningReviewActionKey =
  | "practiceWeakPart"
  | "practiceWeakType"
  | "reviewSkippedQuestions"
  | "startSimilarListening"
  | "openAiCoach"
  | "openReviewCenter";

export type ListeningReviewAction = {
  id: string;
  kind: "primary" | "secondary";
  actionKey: ListeningReviewActionKey;
};

export const LISTENING_REVIEW_ACTIONS: ListeningReviewAction[] = [
  { id: "practice-weak-part", kind: "primary", actionKey: "practiceWeakPart" },
  { id: "practice-weak-type", kind: "primary", actionKey: "practiceWeakType" },
  {
    id: "review-skipped-questions",
    kind: "secondary",
    actionKey: "reviewSkippedQuestions",
  },
  {
    id: "start-similar-listening",
    kind: "secondary",
    actionKey: "startSimilarListening",
  },
  { id: "open-ai-coach", kind: "secondary", actionKey: "openAiCoach" },
  { id: "open-review-center", kind: "secondary", actionKey: "openReviewCenter" },
];

