export type QuestionTypeForGrading =
  | "tfng"
  | "mcq"
  | "listSelection"
  | "matchingHeadings"
  | "matchingInfo"
  | "sentenceCompletion"
  | "summaryCompletion"
  | "tableCompletion"
  | "text"
  | "matching";

export type UserAnswer = string | string[] | null | undefined;

export type GradeableQuestion = {
  id: string;
  number: number;
  type: QuestionTypeForGrading;
  correctAnswer?: string | string[] | null;
  acceptableAnswers?: string[];
};

export type GradeResult = {
  isCorrect: boolean;
  earned: number;
  max: number;
  isUngraded: boolean;
  normalizedUser?: string;
  normalizedCorrect?: string;
};

export type GradeTestResult = {
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  total: number;
  scorePercent: number;
  byQuestion: Record<string, GradeResult>;
};

export function normalizeTextAnswer(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:]+$/g, "")
    .replace(/\s+/g, " ");
}

function normalizeChoice(value: string) {
  const normalized = normalizeTextAnswer(value);
  const letter = normalized.match(/^[a-z](?:$|[\s.)\]:-])/i)?.[0]?.trim().replace(/[.)\]:-]$/, "");
  return letter ? letter.toUpperCase() : normalized;
}

function normalizeTfng(value: string) {
  const normalized = normalizeTextAnswer(value).replace(/\s+/g, "_");
  if (normalized === "not_given") return "NOT_GIVEN";
  if (normalized === "true") return "TRUE";
  if (normalized === "false") return "FALSE";
  return normalized.toUpperCase();
}

function normalizeMatchingHeading(value: string) {
  const normalized = normalizeTextAnswer(value);
  const roman = normalized.match(/^([ivxlcdm]+)\b/i)?.[1];
  return roman ? roman.toLowerCase() : normalized;
}

function toComparable(questionType: QuestionTypeForGrading, value: string) {
  if (questionType === "mcq" || questionType === "listSelection") return normalizeChoice(value);
  if (questionType === "tfng") return normalizeTfng(value);
  if (questionType === "matchingHeadings") return normalizeMatchingHeading(value);
  // Both matching variants are graded by option key, so "C. Renaissance" and "C"
  // must reduce to the same comparable value ("C").
  if (questionType === "matching" || questionType === "matchingInfo") return normalizeChoice(value);
  return normalizeTextAnswer(value);
}

export function gradeQuestion(question: GradeableQuestion, userAnswer: UserAnswer): GradeResult {
  const max = 1;
  const isMissing = userAnswer == null || (typeof userAnswer === "string" && normalizeTextAnswer(userAnswer) === "");
  const hasAnswerKey = question.correctAnswer != null;

  if (!hasAnswerKey) {
    return {
      isCorrect: false,
      earned: 0,
      max,
      isUngraded: true,
      normalizedUser: typeof userAnswer === "string" ? toComparable(question.type, userAnswer) : undefined,
    };
  }

  const normalizedUser = isMissing
    ? ""
    : toComparable(question.type, Array.isArray(userAnswer) ? userAnswer.join(",") : userAnswer);

  const accepted = new Set<string>();
  const baseAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer];
  baseAnswers.filter(Boolean).forEach((answer) => accepted.add(toComparable(question.type, String(answer))));
  question.acceptableAnswers?.forEach((answer) => accepted.add(toComparable(question.type, answer)));

  const isCorrect = !isMissing && accepted.has(normalizedUser);

  return {
    isCorrect,
    earned: isCorrect ? 1 : 0,
    max,
    isUngraded: false,
    normalizedUser: normalizedUser || undefined,
    normalizedCorrect: [...accepted][0],
  };
}

export function gradeTest(questions: GradeableQuestion[], answers: Record<string, UserAnswer>): GradeTestResult {
  const byQuestion: Record<string, GradeResult> = {};
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  for (const question of questions) {
    const userAnswer = answers[question.id];
    const result = gradeQuestion(question, userAnswer);
    byQuestion[question.id] = result;

    const isUnanswered = userAnswer == null || (typeof userAnswer === "string" && normalizeTextAnswer(userAnswer) === "");
    if (isUnanswered) unansweredCount += 1;
    if (!result.isUngraded && result.isCorrect) correctCount += 1;
    if (!result.isUngraded && !result.isCorrect && !isUnanswered) incorrectCount += 1;
  }

  const total = questions.length;
  const scorePercent = total ? Math.round((correctCount / total) * 100) : 0;

  return {
    correctCount,
    incorrectCount,
    unansweredCount,
    total,
    scorePercent,
    byQuestion,
  };
}

export type BackendGradedVerdict = {
  questionId: string;
  questionNumber?: number;
  isCorrect: boolean;
  isSkipped: boolean;
  /** Extra IDs this verdict should also be reachable under (e.g. runtime question IDs). */
  aliasQuestionIds?: string[];
};

/**
 * Builds a GradeTestResult straight from backend-graded verdicts (is_correct /
 * is_skipped on the attempt review), so review screens display exactly what the
 * backend graded instead of re-grading answers in the frontend.
 */
export function gradeTestFromBackendVerdicts(verdicts: BackendGradedVerdict[]): GradeTestResult {
  const byQuestion: Record<string, GradeResult> = {};
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  for (const verdict of verdicts) {
    const result: GradeResult = {
      isCorrect: verdict.isCorrect,
      earned: verdict.isCorrect ? 1 : 0,
      max: 1,
      isUngraded: false,
      // Consumers treat a missing normalizedUser as "skipped".
      normalizedUser: verdict.isSkipped ? undefined : "answered",
    };
    byQuestion[verdict.questionId] = result;
    for (const alias of verdict.aliasQuestionIds ?? []) {
      if (alias && !(alias in byQuestion)) {
        byQuestion[alias] = result;
      }
    }

    if (verdict.isSkipped) unansweredCount += 1;
    if (verdict.isCorrect) correctCount += 1;
    if (!verdict.isCorrect && !verdict.isSkipped) incorrectCount += 1;
  }

  const total = verdicts.length;
  const scorePercent = total ? Math.round((correctCount / total) * 100) : 0;

  return {
    correctCount,
    incorrectCount,
    unansweredCount,
    total,
    scorePercent,
    byQuestion,
  };
}

// Lightweight dev self-checks for grading behavior.
if (process.env.NODE_ENV === "development") {
  const sample = gradeQuestion(
    {
      id: "sample-1",
      number: 1,
      type: "tfng",
      correctAnswer: "NOT_GIVEN",
    },
    "not given"
  );
  if (!sample.isCorrect) {
    console.warn("[grading] TFNG self-check failed");
  }
}
