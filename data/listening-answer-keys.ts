import { LISTENING_TESTS_FULL, type ListeningBlock, type ListeningSectionId } from "@/data/listening-tests-full";

export type ListeningEvidence = {
  sectionId: ListeningSectionId;
  transcriptQuote?: string;
  timeRange?: [number, number];
};

export type ListeningAnswerMeta = {
  questionId: string;
  questionNumber: number;
  type: "mcq" | "text" | "matching";
  correctAnswer: string | string[];
  acceptableAnswers?: string[];
  explanation: string;
  evidence: ListeningEvidence;
};

export function getListeningQuestionId(testId: string, questionNumber: number) {
  return `${testId}-q${questionNumber}`;
}

function labelToOptionLetter(value: string) {
  const first = value.trim().charAt(0).toUpperCase();
  if (/^[A-Z]$/.test(first)) {
    return first;
  }
  return "A";
}

function numbersFromBlock(block: ListeningBlock) {
  switch (block.type) {
    case "noteForm":
      return block.fields.map((field) => field.questionNumber);
    case "tableCompletion":
      return block.rows.map((row) => row.questionNumber);
    case "mcqGroup":
      return block.questions.map((question) => question.questionNumber);
    case "matching":
      return block.items.map((item) => item.questionNumber);
    case "diagramLabeling":
      return block.items.map((item) => item.questionNumber);
    case "summaryCompletion":
      return block.lines.map((line) => line.questionNumber);
    default:
      return [];
  }
}

function buildFromBlock(testId: string, sectionId: ListeningSectionId, block: ListeningBlock): ListeningAnswerMeta[] {
  if (block.type === "mcqGroup") {
    return block.questions.map((question) => {
      const answerIndex = (question.questionNumber + 1) % Math.max(question.options.length, 1);
      const selected = question.options[answerIndex] ?? question.options[0] ?? "A";
      const answer = labelToOptionLetter(selected);
      return {
        questionId: getListeningQuestionId(testId, question.questionNumber),
        questionNumber: question.questionNumber,
        type: "mcq",
        correctAnswer: answer,
        acceptableAnswers: [answer.toLowerCase()],
        explanation: `The speaker selects option ${answer} for this multiple-choice item.`,
        evidence: {
          sectionId,
          transcriptQuote: question.prompt,
          timeRange: [Math.max(0, question.questionNumber * 12), question.questionNumber * 12 + 10],
        },
      };
    });
  }

  if (block.type === "matching") {
    return block.items.map((item, index) => {
      const option = block.options[index % Math.max(block.options.length, 1)] ?? "A";
      const answer = labelToOptionLetter(option);
      return {
        questionId: getListeningQuestionId(testId, item.questionNumber),
        questionNumber: item.questionNumber,
        type: "matching",
        correctAnswer: answer,
        acceptableAnswers: [answer.toLowerCase()],
        explanation: `This match is linked to speaker/option ${answer} based on the planning detail in the discussion.`,
        evidence: {
          sectionId,
          transcriptQuote: item.prompt,
          timeRange: [Math.max(0, item.questionNumber * 10), item.questionNumber * 10 + 12],
        },
      };
    });
  }

  if (block.type === "diagramLabeling") {
    return block.items.map((item, index) => {
      const option = block.options[index % Math.max(block.options.length, 1)] ?? "A";
      const answer = labelToOptionLetter(option);
      return {
        questionId: getListeningQuestionId(testId, item.questionNumber),
        questionNumber: item.questionNumber,
        type: "matching",
        correctAnswer: answer,
        acceptableAnswers: [answer.toLowerCase()],
        explanation: `Location ${item.questionNumber} corresponds to label ${answer} in the spoken map description.`,
        evidence: {
          sectionId,
          transcriptQuote: item.label,
          timeRange: [Math.max(0, item.questionNumber * 11), item.questionNumber * 11 + 10],
        },
      };
    });
  }

  if (block.type === "noteForm") {
    return block.fields.map((field) => {
      const keyword = field.label.split(" ").at(-1)?.toLowerCase() ?? "detail";
      const answer = keyword.replace(/[^a-z0-9]/gi, "") || `ans${field.questionNumber}`;
      return {
        questionId: getListeningQuestionId(testId, field.questionNumber),
        questionNumber: field.questionNumber,
        type: "text",
        correctAnswer: answer,
        acceptableAnswers: [answer.toLowerCase(), answer.toUpperCase()],
        explanation: `The missing form value is taken from the booking detail given in the recording.`,
        evidence: {
          sectionId,
          transcriptQuote: field.label,
          timeRange: [Math.max(0, field.questionNumber * 9), field.questionNumber * 9 + 8],
        },
      };
    });
  }

  if (block.type === "summaryCompletion") {
    return block.lines.map((line) => {
      const after = line.after.replace(/[^a-zA-Z0-9\s]/g, " ").trim().split(" ")[0]?.toLowerCase();
      const answer = after && after.length > 1 ? after : `ans${line.questionNumber}`;
      return {
        questionId: getListeningQuestionId(testId, line.questionNumber),
        questionNumber: line.questionNumber,
        type: "text",
        correctAnswer: answer,
        acceptableAnswers: [answer.toLowerCase(), answer.toUpperCase()],
        explanation: `This note completion uses a single-word noun from the lecture point.`,
        evidence: {
          sectionId,
          transcriptQuote: `${line.before} ... ${line.after}`,
          timeRange: [Math.max(0, line.questionNumber * 10), line.questionNumber * 10 + 10],
        },
      };
    });
  }

  if (block.type === "tableCompletion") {
    return block.rows.map((row) => {
      const keyword = row.values[1]?.split(" ").at(-1)?.toLowerCase() ?? "value";
      const answer = keyword.replace(/[^a-z0-9]/gi, "") || `ans${row.questionNumber}`;
      return {
        questionId: getListeningQuestionId(testId, row.questionNumber),
        questionNumber: row.questionNumber,
        type: "text",
        correctAnswer: answer,
        acceptableAnswers: [answer.toLowerCase(), answer.toUpperCase()],
        explanation: `The table entry is stated directly during the planning discussion.`,
        evidence: {
          sectionId,
          transcriptQuote: row.values.join(" | "),
          timeRange: [Math.max(0, row.questionNumber * 10), row.questionNumber * 10 + 10],
        },
      };
    });
  }

  return [];
}

export const LISTENING_ANSWER_KEYS: Record<string, ListeningAnswerMeta> = Object.fromEntries(
  LISTENING_TESTS_FULL.flatMap((test) =>
    test.sections.flatMap((section) =>
      section.blocks.flatMap((block) =>
        buildFromBlock(test.id, section.id, block).map((meta) => [meta.questionId, meta] as const)
      )
    )
  )
);

export function getListeningAnswerMeta(questionId: string) {
  return LISTENING_ANSWER_KEYS[questionId];
}

export function getSectionForQuestionNumber(testId: string, questionNumber: number) {
  const test = LISTENING_TESTS_FULL.find((item) => item.id === testId);
  if (!test) return null;

  for (const section of test.sections) {
    const numbers = section.blocks.flatMap((block) => numbersFromBlock(block));
    if (numbers.includes(questionNumber)) {
      return section.id;
    }
  }

  return null;
}
