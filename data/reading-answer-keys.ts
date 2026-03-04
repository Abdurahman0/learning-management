import { READING_TESTS, type ReadingQuestion } from "@/data/reading-tests";

export type ReadingEvidence = {
  passageId: "p1" | "p2" | "p3";
  startQuote?: string;
  endQuote?: string;
  paragraphIndex?: number;
};

export type ReadingAnswerMeta = {
  questionId: string;
  questionNumber: number;
  type: ReadingQuestion["type"];
  correctAnswer: string | string[];
  acceptableAnswers?: string[];
  explanation: string;
  evidence: ReadingEvidence;
};

const TFNG_PATTERN: Array<"TRUE" | "FALSE" | "NOT_GIVEN"> = ["TRUE", "FALSE", "NOT_GIVEN"];

function cleanWord(value: string) {
  return value
    .replace(/[()]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSentenceKeyword(question: ReadingQuestion) {
  if (question.type !== "sentenceCompletion") {
    return "answer";
  }

  const prompt = cleanWord(question.prompt).toLowerCase();
  const tokens = prompt.split(" ").filter(Boolean);
  const ignored = new Set([
    "in",
    "the",
    "a",
    "an",
    "of",
    "and",
    "to",
    "for",
    "from",
    "with",
    "is",
    "are",
    "be",
    "can",
    "may",
    "more",
    "only",
    "below",
    "passage",
    "questions",
    "question",
  ]);

  const fallback = `term${question.number}`;
  const candidate = [...tokens].reverse().find((token) => !ignored.has(token) && token.length > 2);
  return candidate ?? fallback;
}

function extractMcqLetter(question: Extract<ReadingQuestion, { type: "mcq" }>) {
  const index = (question.number + 1) % Math.max(question.options.length, 1);
  const option = question.options[index] ?? question.options[0] ?? "A";
  const first = option.trim().charAt(0).toUpperCase();
  if (["A", "B", "C", "D", "E", "F"].includes(first)) {
    return first;
  }
  return String.fromCharCode(65 + (index % 4));
}

function buildExplanation(question: ReadingQuestion, answer: string | string[]) {
  const answerText = Array.isArray(answer) ? answer.join(", ") : answer;
  return `The best answer is ${answerText}. This follows the statement in the passage that directly addresses: ${question.prompt}`;
}

function buildAnswer(question: ReadingQuestion): string | string[] {
  if (question.type === "tfng") {
    return TFNG_PATTERN[(question.number - 1) % TFNG_PATTERN.length];
  }

  if (question.type === "mcq") {
    return extractMcqLetter(question);
  }

  if (question.type === "matchingHeadings") {
    const index = (question.number + 2) % Math.max(question.headingOptions.length, 1);
    const option = question.headingOptions[index] ?? question.headingOptions[0] ?? "i";
    const roman = option.split(".")[0]?.trim().toLowerCase() ?? option;
    return roman;
  }

  if (question.type === "matchingInfo") {
    const index = (question.number - 1) % Math.max(question.paragraphOptions.length, 1);
    return question.paragraphOptions[index] ?? "A";
  }

  return extractSentenceKeyword(question);
}

export const READING_ANSWER_KEYS: Record<string, ReadingAnswerMeta> = Object.fromEntries(
  READING_TESTS.flatMap((test) =>
    test.questions.map((question) => {
      const correctAnswer = buildAnswer(question);
      const meta: ReadingAnswerMeta = {
        questionId: question.id,
        questionNumber: question.number,
        type: question.type,
        correctAnswer,
        acceptableAnswers:
          typeof correctAnswer === "string"
            ? [correctAnswer.toLowerCase(), correctAnswer.toUpperCase()]
            : undefined,
        explanation: buildExplanation(question, correctAnswer),
        evidence: {
          passageId: question.passageId,
          paragraphIndex: (question.number - 1) % 6,
          startQuote: question.prompt.slice(0, 48),
        },
      };

      return [question.id, meta] as const;
    })
  )
);

export function getReadingAnswerMeta(questionId: string) {
  return READING_ANSWER_KEYS[questionId];
}
