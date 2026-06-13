type NormalizedText = {
  text: string;
  starts: number[];
  ends: number[];
};

function escapedWhitespaceLength(value: string, index: number) {
  if (value[index] !== "\\") return 0;
  const next = value[index + 1]?.toLowerCase();
  return next === "n" || next === "r" || next === "t" ? 2 : 0;
}

function canonicalCharacter(value: string) {
  if (/[\u2018\u2019\u02bc]/.test(value)) return "'";
  if (/[\u201c\u201d]/.test(value)) return "\"";
  if (/[\u2012\u2013\u2014\u2015]/.test(value)) return "-";
  return value.toLowerCase();
}

function buildNormalizedText(value: string): NormalizedText {
  const textParts: string[] = [];
  const starts: number[] = [];
  const ends: number[] = [];
  let index = 0;

  while (index < value.length) {
    const escapedLength = escapedWhitespaceLength(value, index);
    if (escapedLength || /\s/.test(value[index] ?? "")) {
      const whitespaceStart = index;
      index += escapedLength || 1;

      while (index < value.length) {
        const nextEscapedLength = escapedWhitespaceLength(value, index);
        if (nextEscapedLength) {
          index += nextEscapedLength;
          continue;
        }
        if (!/\s/.test(value[index] ?? "")) break;
        index += 1;
      }

      if (textParts.length > 0 && textParts[textParts.length - 1] !== " ") {
        textParts.push(" ");
        starts.push(whitespaceStart);
        ends.push(index);
      }
      continue;
    }

    const normalizedCharacter = canonicalCharacter(value[index] ?? "");
    for (const character of normalizedCharacter) {
      textParts.push(character);
      starts.push(index);
      ends.push(index + 1);
    }
    index += 1;
  }

  while (textParts[textParts.length - 1] === " ") {
    textParts.pop();
    starts.pop();
    ends.pop();
  }

  return {text: textParts.join(""), starts, ends};
}

export function normalizeEvidenceLookupText(value: string) {
  return buildNormalizedText(value).text;
}

export function findEvidenceTextRange(source: string, phrase: string) {
  const normalizedSource = buildNormalizedText(source);
  const normalizedPhrase = normalizeEvidenceLookupText(phrase);
  if (!normalizedPhrase) return null;

  const normalizedStart = normalizedSource.text.indexOf(normalizedPhrase);
  if (normalizedStart < 0) return null;

  const normalizedEnd = normalizedStart + normalizedPhrase.length - 1;
  const start = normalizedSource.starts[normalizedStart];
  const end = normalizedSource.ends[normalizedEnd];
  if (start == null || end == null || end <= start) return null;

  return {start, end};
}
