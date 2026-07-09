import type {ReadingAnswerMeta} from "@/data/reading-answer-keys";
import type {ReviewPassage} from "@/data/review-reading";
import {normalizeEvidenceLookupText} from "@/lib/evidence-text";
import {
  formatMatchingInfoOptionsAsPlainLines,
  parseMatchingInfoOptionsFromInstructions
} from "@/lib/matching-info-instructions";
import type {ReadingQuestion} from "@/data/reading-tests";
import type {StudentAttemptReviewResponse} from "@/src/services/student/types";

type ReadingAnswerValue = string | string[] | null;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function toStringSafe(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function toNumberSafe(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toParagraphIndexFromValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, value);
  }

  const text = toStringSafe(value, "").trim().toUpperCase();
  if (!text) return Number.NaN;

  if (/^\d+$/.test(text)) {
    const parsed = Number(text);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : Number.NaN;
  }

  const match = text.match(/[A-Z]/);
  if (!match) return Number.NaN;
  return Math.max(0, match[0].charCodeAt(0) - 65);
}

function toReadingPassageId(index: number): "p1" | "p2" | "p3" {
  if (index <= 0) return "p1";
  if (index === 1) return "p2";
  return "p3";
}

function toMappedPassageId(rawValue: unknown, fallback: "p1" | "p2" | "p3") {
  const raw = toStringSafe(rawValue, "").trim().toLowerCase();
  if (!raw) return fallback;
  const match = raw.match(/[1-3]/);
  if (!match) return fallback;
  return (`p${match[0]}` as "p1" | "p2" | "p3");
}

function normalizeLookupText(value: string) {
  return normalizeEvidenceLookupText(value);
}

function normalizeLookupTextLoose(value: string) {
  return normalizeLookupText(value).replace(/[^a-z0-9 ]+/g, "");
}

function toLookupTokens(value: string) {
  return normalizeLookupTextLoose(value)
    .split(" ")
    .filter((token) => token.length >= 3);
}

function findBestMatchingExcerpt(paragraph: string, phrase: string) {
  const candidates = paragraph.match(/[^.!?]+[.!?]?/g)?.map((item) => item.trim()).filter(Boolean) ?? [paragraph];
  const phraseTokens = new Set(toLookupTokens(phrase));
  if (phraseTokens.size === 0) return {text: "", score: 0, matches: 0};

  return candidates.reduce(
    (best, candidate) => {
      const candidateTokens = new Set(toLookupTokens(candidate));
      const matches = [...phraseTokens].filter((token) => candidateTokens.has(token)).length;
      const score = matches / phraseTokens.size;
      return score > best.score ? {text: candidate, score, matches} : best;
    },
    {text: "", score: 0, matches: 0}
  );
}

function resolveEvidenceLocation(paragraphs: string[], phrase: string, fallback: number) {
  const normalizedPhrase = normalizeLookupText(phrase);
  if (normalizedPhrase) {
    const strictIndex = paragraphs.findIndex((paragraph) => normalizeLookupText(paragraph).includes(normalizedPhrase));
    if (strictIndex >= 0) return {paragraphIndex: strictIndex, phrase};
  }

  const loosePhrase = normalizeLookupTextLoose(phrase);
  if (loosePhrase) {
    const looseIndex = paragraphs.findIndex((paragraph) => normalizeLookupTextLoose(paragraph).includes(loosePhrase));
    if (looseIndex >= 0) return {paragraphIndex: looseIndex, phrase};
  }

  const fuzzyMatch = paragraphs.reduce(
    (best, paragraph, paragraphIndex) => {
      const excerpt = findBestMatchingExcerpt(paragraph, phrase);
      return excerpt.score > best.score ? {...excerpt, paragraphIndex} : best;
    },
    {text: "", score: 0, matches: 0, paragraphIndex: Math.max(0, fallback)}
  );

  if (fuzzyMatch.matches >= 2 && fuzzyMatch.score >= 0.18) {
    return {paragraphIndex: fuzzyMatch.paragraphIndex, phrase: fuzzyMatch.text};
  }

  return {paragraphIndex: Math.max(0, fallback), phrase};
}

function getEvidenceEntries(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  const record = asRecord(value);
  if (!record) {
    return value == null ? [] : [value];
  }

  const nestedCollections = [record.evidence, record.spans, record.highlights, record.items].filter(Array.isArray) as unknown[][];
  const entries = nestedCollections.flatMap((collection) => collection);
  if (entries.length > 0) {
    return entries;
  }

  if (Array.isArray(record.quotes) && record.quotes.length > 0) {
    return record.quotes;
  }

  return [record];
}

function parseAnswerValue(value: unknown): ReadingAnswerValue {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const normalized = value
      .map((item) => (typeof item === "string" ? item.trim() : String(item ?? "").trim()))
      .filter(Boolean);
    return normalized.length ? normalized : null;
  }

  const record = asRecord(value);
  if (!record) return null;
  const direct = record.answer;
  if (typeof direct === "string") return direct;
  if (Array.isArray(record.answers)) {
    return (record.answers as unknown[])
      .map((item) => (typeof item === "string" ? item.trim() : String(item ?? "").trim()))
      .filter(Boolean);
  }

  return null;
}

function parseOptionTexts(optionsJson: unknown) {
  if (Array.isArray(optionsJson)) {
    return optionsJson
      .map((item, index) => {
        if (typeof item === "string") return item.trim();
        const option = asRecord(item);
        if (!option) return "";
        const key = toStringSafe(option.key, String.fromCharCode(65 + index));
        const text = toStringSafe(option.text, "");
        return text ? `${key}. ${text}` : "";
      })
      .filter(Boolean);
  }

  const record = asRecord(optionsJson);
  if (!record || !Array.isArray(record.options)) return [];
  return parseOptionTexts(record.options);
}

function parseSharedOptionTexts(groupContent: unknown) {
  const record = asRecord(groupContent);
  if (!record) return [];

  const rows = Array.isArray(record.choices)
    ? record.choices
    : Array.isArray(record.options)
      ? record.options
      : Array.isArray(record.labels)
        ? record.labels
        : Array.isArray(record.categories)
          ? record.categories
          : [];

  return rows
    .map((item, index) => {
      if (typeof item === "string") return item.trim();
      const row = asRecord(item);
      if (!row) return "";
      const key = toStringSafe(row.key, String.fromCharCode(65 + index)).trim();
      const text = toStringSafe(row.text, "").trim() || toStringSafe(row.label, "").trim();
      return text ? (key ? `${key}. ${text}` : text) : key;
    })
    .filter(Boolean);
}

function parseSharedHeadingTexts(groupContent: unknown) {
  const record = asRecord(groupContent);
  if (!record || !Array.isArray(record.headings)) return [];

  return record.headings
    .map((item, index) => {
      if (typeof item === "string") return item.trim();
      const row = asRecord(item);
      if (!row) return "";
      const key = toStringSafe(row.key, `h${index + 1}`).trim();
      const text = toStringSafe(row.text, "").trim() || toStringSafe(row.label, "").trim();
      return text ? `${key} ${text}` : key;
    })
    .filter(Boolean);
}

function generateRangeOptions(startRaw: string, endRaw: string): string[] {
  const start = startRaw.trim();
  const end = endRaw.trim();
  if (!start || !end) return [];

  if (/^[A-Z]$/.test(start) && /^[A-Z]$/.test(end)) {
    const from = start.charCodeAt(0);
    const to = end.charCodeAt(0);
    const step = from <= to ? 1 : -1;
    const result: string[] = [];
    for (let code = from; step > 0 ? code <= to : code >= to; code += step) {
      result.push(String.fromCharCode(code));
    }
    return result;
  }

  return [];
}

function extractLetterOptionsFromInstructionText(text: string): string[] {
  const source = String(text ?? "");
  if (!source) return [];

  const options: string[] = [];
  const seen = new Set<string>();
  const lineRegex = /^\s*(?:[-*]\s*)?(?:\*\*)?([A-Z])(?:\*\*)?\s*[\)\].:\-]\s+\S.+$/gm;
  let match: RegExpExecArray | null;

  while ((match = lineRegex.exec(source))) {
    const key = String(match[1] ?? "").trim().toUpperCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const fullText = String(match[0] ?? "").replace(/^\s*[-*]\s*/, "").replace(/\*\*/g, "").trim();
    options.push(fullText || key);
  }

  return options.length >= 2 ? options : [];
}

function extractMatchingOptionsFromInstructions(text: string): string[] {
  const source = String(text ?? "");
  if (!source) return [];

  const parsedFromMarkers = parseMatchingInfoOptionsFromInstructions(source);
  if (parsedFromMarkers.length) return formatMatchingInfoOptionsAsPlainLines(parsedFromMarkers);

  const explicit = extractLetterOptionsFromInstructionText(source);
  if (explicit.length) return explicit;

  const range = source.match(/\b([A-Z])\s*[-–—]\s*([A-Z])\b/);
  if (!range) return [];
  return generateRangeOptions(range[1] ?? "", range[2] ?? "");
}

function normalizeQuestionType(value: string): ReadingQuestion["type"] {
  const normalized = value.toLowerCase();
  if (
    normalized.includes("tfng")
    || normalized.includes("ynng")
    || normalized.includes("not_given")
    || normalized.includes("true_false")
  ) {
    return "tfng";
  }
  if (normalized.includes("heading")) return "matchingHeadings";
  if (normalized.includes("matching")) return "matchingInfo";
  if (normalized.includes("mcq") || normalized.includes("multiple")) return "mcq";
  if (normalized.includes("table")) return "tableCompletion";
  if (normalized.includes("summary")) return "summaryCompletion";
  return "sentenceCompletion";
}

function parseEvidenceSpans(
  evidence: unknown,
  fallbackPassageId: "p1" | "p2" | "p3",
  fallbackParagraphIndex: number,
  fallbackPhrase: string,
  paragraphs: string[]
) {
  const source = getEvidenceEntries(evidence);
  const spans = source
    .map((entry) => {
      if (typeof entry === "string") {
        const phrase = entry.trim() || fallbackPhrase;
        const resolved = resolveEvidenceLocation(paragraphs, phrase, fallbackParagraphIndex);
        return {
          passageId: fallbackPassageId,
          ...resolved
        };
      }

      const record = asRecord(entry);
      if (!record) return null;
      const phrase = toStringSafe(
        record.quote ??
          record.text_snippet ??
          record.phrase ??
          record.text ??
          record.evidence ??
          record.evidence_text ??
          record.start_quote ??
          record.startQuote,
        ""
      ).trim() || fallbackPhrase;
      const paragraphIndex = toParagraphIndexFromValue(
        record.paragraph_index ??
          record.paragraphIndex ??
          record.paragraph ??
          record.paragraph_letter ??
          record.paragraphLetter ??
          record.paragraph_number ??
          record.paragraphNumber
      );
      const resolved = Number.isFinite(paragraphIndex)
        ? {
            paragraphIndex: Math.max(0, paragraphIndex),
            phrase: resolveEvidenceLocation(
              [paragraphs[Math.max(0, paragraphIndex)] ?? ""],
              phrase,
              0
            ).phrase
          }
        : resolveEvidenceLocation(paragraphs, phrase, fallbackParagraphIndex);
      const mappedPassage = toMappedPassageId(record.passage_id ?? record.passageId ?? record.passage, fallbackPassageId);
      return {
        passageId: mappedPassage as "p1" | "p2" | "p3",
        ...resolved
      };
    })
    .filter((item): item is {passageId: "p1" | "p2" | "p3"; paragraphIndex: number; phrase: string} => Boolean(item));

  return spans.length
    ? spans
    : [
        {
          passageId: fallbackPassageId,
          paragraphIndex: fallbackParagraphIndex,
          phrase: fallbackPhrase
        }
      ];
}

function toAcceptableAnswers(correctAnswer: string | string[]) {
  if (Array.isArray(correctAnswer)) {
    return correctAnswer.map((item) => item.toLowerCase());
  }
  return [correctAnswer.toLowerCase(), correctAnswer.toUpperCase()];
}

export type AdaptedReadingBackendReview = {
  questions: ReadingQuestion[];
  answers: Record<string, ReadingAnswerValue>;
  passages: ReviewPassage[];
  answerMeta: ReadingAnswerMeta[];
  stats: {
    correct: number;
    incorrect: number;
    unanswered: number;
    total: number;
    scorePercent: number;
  };
};

export function adaptReadingBackendReview(review: StudentAttemptReviewResponse): AdaptedReadingBackendReview {
  const passages = (review.passages ?? []).slice(0, 3).map((passage, index) => {
    const passageId = toReadingPassageId(index);
    const text = toStringSafe(passage.passage_text, "");
    const paragraphs = text.split("\n\n").filter((item) => item.trim().length > 0);
    return {
      source: passage,
      passageId,
      index,
      text,
      paragraphs
    };
  });

  const questions: ReadingQuestion[] = [];
  const answers: Record<string, ReadingAnswerValue> = {};
  const answerMeta: ReadingAnswerMeta[] = [];
  let fallbackQuestionNumber = 1;

  passages.forEach((passageInfo) => {
    const orderedGroups = [...passageInfo.source.question_groups].sort((a, b) =>
      toNumberSafe(a.question_number_start ?? 0) - toNumberSafe(b.question_number_start ?? 0)
    );

    orderedGroups.forEach((group) => {
      const groupQuestions = [...group.questions].sort((a, b) => a.question_number - b.question_number);
      const groupTitle = `Questions ${toNumberSafe(group.question_number_start ?? groupQuestions[0]?.question_number ?? fallbackQuestionNumber)}-${toNumberSafe(
        group.question_number_end ?? groupQuestions[groupQuestions.length - 1]?.question_number ?? fallbackQuestionNumber
      )}`;

      groupQuestions.forEach((question, questionIndex) => {
        const questionNumber = toNumberSafe(question.question_number, fallbackQuestionNumber);
        fallbackQuestionNumber = Math.max(fallbackQuestionNumber, questionNumber + 1);
        const questionType = normalizeQuestionType(toStringSafe(question.question_type, "sentence_completion"));
        const prompt = toStringSafe(question.question_text, `Question ${questionNumber}`);
        const userAnswer = parseAnswerValue(question.student_answer);
        const correctAnswerValue = parseAnswerValue(question.correct_answer_json);
        const correctAnswer =
          correctAnswerValue && (typeof correctAnswerValue === "string" || Array.isArray(correctAnswerValue))
            ? correctAnswerValue
            : "";

        const options = parseOptionTexts(question.options_json);
        const sharedOptions = parseSharedOptionTexts(group.group_content_json);
        const instructionOptions = extractMatchingOptionsFromInstructions(group.instructions ?? "");
        const evidenceSpans = parseEvidenceSpans(
          question.answer_evidence_json,
          passageInfo.passageId,
          questionIndex,
          prompt.slice(0, 60),
          passageInfo.paragraphs
        );

        let readingQuestion: ReadingQuestion;
        if (questionType === "tfng") {
          const rawType = toStringSafe(question.question_type, "").toUpperCase();
          const tfngOptions: ["TRUE", "FALSE", "NOT GIVEN"] | ["YES", "NO", "NOT GIVEN"] =
            rawType === "YNNG"
              ? ["YES", "NO", "NOT GIVEN"]
              : ["TRUE", "FALSE", "NOT GIVEN"];
          readingQuestion = {
            id: question.id,
            number: questionNumber,
            passageId: passageInfo.passageId,
            type: "tfng",
            prompt,
            groupTitle,
            groupInstruction: group.instructions ?? undefined,
            options: tfngOptions,
            correctAnswer: typeof correctAnswer === "string" ? correctAnswer : correctAnswer[0] ?? "",
            acceptableAnswers: toAcceptableAnswers(typeof correctAnswer === "string" ? correctAnswer : correctAnswer[0] ?? ""),
            explanation: toStringSafe(question.explanation, ""),
            evidenceSpans
          };
        } else if (questionType === "matchingHeadings") {
          const headingOptions = parseSharedHeadingTexts(group.group_content_json);
          readingQuestion = {
            id: question.id,
            number: questionNumber,
            passageId: passageInfo.passageId,
            type: "matchingHeadings",
            prompt,
            target: prompt,
            groupTitle,
            groupInstruction: group.instructions ?? undefined,
            headingOptions: headingOptions.length ? headingOptions : ["i", "ii", "iii", "iv", "v"],
            correctAnswer: typeof correctAnswer === "string" ? correctAnswer : correctAnswer[0] ?? "",
            acceptableAnswers: toAcceptableAnswers(typeof correctAnswer === "string" ? correctAnswer : correctAnswer[0] ?? ""),
            explanation: toStringSafe(question.explanation, ""),
            evidenceSpans
          };
        } else if (questionType === "matchingInfo") {
          const paragraphOptions = sharedOptions.length
            ? sharedOptions
            : instructionOptions.length
              ? instructionOptions
              : ["A", "B", "C", "D", "E", "F"];
          const rawQType = toStringSafe(question.question_type, "").toUpperCase();
          const matchingSubtype: "info" | "features" =
            rawQType.includes("FEAT") || rawQType.includes("CLASSIF") ? "features" : "info";
          readingQuestion = {
            id: question.id,
            number: questionNumber,
            passageId: passageInfo.passageId,
            type: "matchingInfo",
            matchingSubtype,
            prompt,
            groupTitle,
            groupInstruction: group.instructions ?? undefined,
            paragraphOptions,
            correctAnswer: typeof correctAnswer === "string" ? correctAnswer : correctAnswer[0] ?? "",
            acceptableAnswers: toAcceptableAnswers(typeof correctAnswer === "string" ? correctAnswer : correctAnswer[0] ?? ""),
            explanation: toStringSafe(question.explanation, ""),
            evidenceSpans
          };
        } else if (questionType === "mcq") {
          readingQuestion = {
            id: question.id,
            number: questionNumber,
            passageId: passageInfo.passageId,
            type: "mcq",
            prompt,
            groupTitle,
            groupInstruction: group.instructions ?? undefined,
            options: options.length ? options : ["A", "B", "C", "D"],
            correctAnswer: typeof correctAnswer === "string" ? correctAnswer : correctAnswer[0] ?? "",
            acceptableAnswers: toAcceptableAnswers(typeof correctAnswer === "string" ? correctAnswer : correctAnswer[0] ?? ""),
            explanation: toStringSafe(question.explanation, ""),
            evidenceSpans
          };
        } else if (questionType === "summaryCompletion") {
          const content = asRecord(group.group_content_json);
          const summaryText = toStringSafe(content?.summary_text, "").trim();
          const wordBankRaw = Array.isArray(content?.word_bank) ? content.word_bank : null;
          const wordBank = wordBankRaw
            ? (wordBankRaw as unknown[]).map((item) => toStringSafe(item).trim()).filter(Boolean)
            : null;

          readingQuestion = {
            id: question.id,
            number: questionNumber,
            passageId: passageInfo.passageId,
            type: "summaryCompletion",
            prompt,
            groupTitle,
            groupInstruction: group.instructions ?? undefined,
            summaryText: summaryText || prompt,
            wordBank: wordBank && wordBank.length ? wordBank : null,
            correctAnswer: typeof correctAnswer === "string" ? correctAnswer : correctAnswer,
            acceptableAnswers: toAcceptableAnswers(typeof correctAnswer === "string" ? correctAnswer : correctAnswer.join(", ")),
            explanation: toStringSafe(question.explanation, ""),
            evidenceSpans
          };
        } else if (questionType === "tableCompletion") {
          const content = asRecord(group.group_content_json);
          const columns = (Array.isArray(content?.columns) ? content.columns : [])
            .map((item) => toStringSafe(item).trim())
            .filter(Boolean);
          const rows = (Array.isArray(content?.rows) ? content.rows : [])
            .map((row) => (Array.isArray(row) ? row : []))
            .map((row) => row.map((cell) => toStringSafe(cell).trim()).filter(Boolean))
            .filter((row) => row.length > 0);

          readingQuestion = {
            id: question.id,
            number: questionNumber,
            passageId: passageInfo.passageId,
            type: "tableCompletion",
            prompt,
            groupTitle,
            groupInstruction: group.instructions ?? undefined,
            tableColumns: columns.length ? columns : ["Field", "Value"],
            tableRows: rows.length ? rows : [[prompt, `{${questionNumber}}`]],
            correctAnswer: typeof correctAnswer === "string" ? correctAnswer : correctAnswer,
            acceptableAnswers: toAcceptableAnswers(typeof correctAnswer === "string" ? correctAnswer : correctAnswer.join(", ")),
            explanation: toStringSafe(question.explanation, ""),
            evidenceSpans
          };
        } else {
          readingQuestion = {
            id: question.id,
            number: questionNumber,
            passageId: passageInfo.passageId,
            type: "sentenceCompletion",
            prompt,
            groupTitle,
            groupInstruction: group.instructions ?? undefined,
            blanks: 1,
            correctAnswer: typeof correctAnswer === "string" ? correctAnswer : correctAnswer,
            acceptableAnswers: toAcceptableAnswers(typeof correctAnswer === "string" ? correctAnswer : correctAnswer.join(", ")),
            explanation: toStringSafe(question.explanation, ""),
            evidenceSpans
          };
        }

        questions.push(readingQuestion);
        answers[readingQuestion.id] = userAnswer;
        answerMeta.push({
          questionId: readingQuestion.id,
          questionNumber: readingQuestion.number,
          type: readingQuestion.type,
          correctAnswer: readingQuestion.correctAnswer,
          acceptableAnswers: readingQuestion.acceptableAnswers,
          explanation: readingQuestion.explanation || "No explanation provided by backend.",
          evidence: {
            passageId: readingQuestion.passageId,
            paragraphIndex: readingQuestion.evidenceSpans[0]?.paragraphIndex ?? 0,
            startQuote: readingQuestion.evidenceSpans[0]?.phrase
          }
        });
      });
    });
  });

  const reviewPassages: ReviewPassage[] = passages.map((passageInfo) => {
    const highlightsByParagraph = new Map<number, Array<{questionNumber: number; text: string}>>();
    questions
      .filter((question) => question.passageId === passageInfo.passageId)
      .forEach((question) => {
        question.evidenceSpans.forEach((span) => {
          if (span.passageId !== passageInfo.passageId) return;
          const list = highlightsByParagraph.get(span.paragraphIndex) ?? [];
          list.push({
            questionNumber: question.number,
            text: span.phrase || question.prompt
          });
          highlightsByParagraph.set(span.paragraphIndex, list);
        });
      });

    const paragraphs = passageInfo.paragraphs.length ? passageInfo.paragraphs : [passageInfo.text || "No passage text provided."];
    return {
      id: passageInfo.passageId,
      title: toStringSafe(passageInfo.source.title, `Passage ${passageInfo.index + 1}`),
      label: `Passage ${passageInfo.index + 1}`,
      paragraphs: paragraphs.map((paragraphText, paragraphIndex) => ({
        id: `review-para-${passageInfo.passageId}-${paragraphIndex}`,
        label: String.fromCharCode(65 + paragraphIndex),
        text: paragraphText,
        highlights: highlightsByParagraph.get(paragraphIndex)
      }))
    };
  });

  const total = review.total_questions ?? questions.length;
  const correct = review.correct_count ?? questions.filter((question) => {
    const sourceQuestion = (review.passages ?? [])
      .flatMap((passage) => passage.question_groups.flatMap((group) => group.questions))
      .find((item) => item.id === question.id);
    return sourceQuestion?.is_correct;
  }).length;
  const unanswered = review.unanswered_count ?? questions.filter((question) => !answers[question.id]).length;
  const incorrect = review.incorrect_count ?? Math.max(0, total - correct - unanswered);
  const scorePercent = total > 0 ? Math.round((correct / total) * 100) : 0;

  return {
    questions: [...questions].sort((a, b) => a.number - b.number),
    answers,
    passages: reviewPassages,
    answerMeta,
    stats: {
      correct,
      incorrect,
      unanswered,
      total,
      scorePercent
    }
  };
}
