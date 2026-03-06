export type QuestionBankItem = {
  id: string;
  module: "reading" | "listening";
  type: string;
  prompt: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  sourceTestId: string;
};

export const QUESTION_BANK_ITEMS: QuestionBankItem[] = [
  {
    id: "qb-1",
    module: "reading",
    type: "Matching Headings",
    prompt: "Choose the heading that best matches paragraph C.",
    difficulty: "intermediate",
    sourceTestId: "cam-18-r-1"
  },
  {
    id: "qb-2",
    module: "listening",
    type: "Form Completion",
    prompt: "Enter the student registration number.",
    difficulty: "beginner",
    sourceTestId: "guide-l-4"
  },
  {
    id: "qb-3",
    module: "reading",
    type: "TFNG",
    prompt: "The passage states that urban farming is fully government-funded.",
    difficulty: "advanced",
    sourceTestId: "cam-19-r-3"
  }
];
