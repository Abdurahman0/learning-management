import type { ListeningBlock, ListeningSectionFull } from "@/data/listening-tests-full";

export type FlattenedListeningQuestion = {
  id: string;
  number: number;
  sectionId: ListeningSectionFull["id"];
  sectionTitle: string;
  prompt: string;
  type: "mcq" | "text" | "matching";
};

export function getQuestionNumbersFromListeningBlock(block: ListeningBlock) {
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

export function flattenListeningQuestions(
  testId: string,
  sections: ListeningSectionFull[]
): FlattenedListeningQuestion[] {
  const items: FlattenedListeningQuestion[] = [];

  for (const section of sections) {
    for (const block of section.blocks) {
      if (block.type === "mcqGroup") {
        for (const question of block.questions) {
          items.push({
            id: `${testId}-q${question.questionNumber}`,
            number: question.questionNumber,
            sectionId: section.id,
            sectionTitle: section.title,
            prompt: question.prompt,
            type: "mcq",
          });
        }
        continue;
      }

      if (block.type === "matching") {
        for (const item of block.items) {
          items.push({
            id: `${testId}-q${item.questionNumber}`,
            number: item.questionNumber,
            sectionId: section.id,
            sectionTitle: section.title,
            prompt: item.prompt,
            type: "matching",
          });
        }
        continue;
      }

      if (block.type === "diagramLabeling") {
        for (const item of block.items) {
          items.push({
            id: `${testId}-q${item.questionNumber}`,
            number: item.questionNumber,
            sectionId: section.id,
            sectionTitle: section.title,
            prompt: item.label,
            type: "matching",
          });
        }
        continue;
      }

      if (block.type === "noteForm") {
        for (const field of block.fields) {
          items.push({
            id: `${testId}-q${field.questionNumber}`,
            number: field.questionNumber,
            sectionId: section.id,
            sectionTitle: section.title,
            prompt: field.label,
            type: "text",
          });
        }
        continue;
      }

      if (block.type === "tableCompletion") {
        for (const row of block.rows) {
          items.push({
            id: `${testId}-q${row.questionNumber}`,
            number: row.questionNumber,
            sectionId: section.id,
            sectionTitle: section.title,
            prompt: row.values.slice(0, 2).join(" - "),
            type: "text",
          });
        }
        continue;
      }

      if (block.type === "summaryCompletion") {
        for (const line of block.lines) {
          items.push({
            id: `${testId}-q${line.questionNumber}`,
            number: line.questionNumber,
            sectionId: section.id,
            sectionTitle: section.title,
            prompt: `${line.before} _____ ${line.after}`,
            type: "text",
          });
        }
      }
    }
  }

  return items.sort((a, b) => a.number - b.number);
}
