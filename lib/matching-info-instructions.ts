// Shared parsing/formatting for the "matching_information" question type's option list.
//
// Admins author the option list directly inside the group's free-text Instructions
// field, one option per line, each wrapped in `#`, e.g. `#A. Marcel#`. This is the
// single source of truth used by the admin builders (Test Builder, Marathon Builder)
// and by the student-facing reading/listening pages and review screens, so the format
// must stay identical everywhere it's produced or consumed.
//
// Older content saved before this convention existed may still have plain, unmarked
// lines like "A. Marcel" or "A) Marcel" — those are recognized as a fallback so
// existing tests keep working without needing a data migration.

export type MatchingInfoOption = {
  key: string;
  label: string;
};

const MARKED_OPTION_LINE = /#\s*([A-Za-z]{1,2})\s*(?:[.)\]:\-]\s*)?([^#]*?)\s*#/g;

// Kept in sync with MARKED_OPTION_LINE above, anchored to a whole line: used to tell an
// option line (`#A. Marcel#`) apart from any other `#...#`-wrapped annotation line (an
// "NB" note, a "List of People" heading, etc.) when deciding what to strip for display.
const MARKED_OPTION_WHOLE_LINE = /^\s*#\s*([A-Za-z]{1,2})\s*(?:[.)\]:\-]\s*)?[^#]*#\s*$/;

const LEGACY_BULLET_LINE = /^\s*(?:[-*]\s*)?(?:\*\*)?([A-Z])(?:\*\*)?\s*[)\].:\-]\s+\S.+$/gm;

function extractMarkedOptions(source: string): MatchingInfoOption[] {
  const options: MatchingInfoOption[] = [];
  const seen = new Set<string>();
  const regex = new RegExp(MARKED_OPTION_LINE);
  let match: RegExpExecArray | null;

  while ((match = regex.exec(source))) {
    const key = String(match[1] ?? "").trim().toUpperCase();
    const label = String(match[2] ?? "").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    options.push({key, label});
  }

  return options;
}

function extractLegacyBulletOptions(source: string): MatchingInfoOption[] {
  const options: MatchingInfoOption[] = [];
  const seen = new Set<string>();
  const regex = new RegExp(LEGACY_BULLET_LINE);
  let match: RegExpExecArray | null;

  while ((match = regex.exec(source))) {
    const line = String(match[0] ?? "")
      .replace(/^\s*[-*]\s*/, "")
      .replace(/\*\*/g, "")
      .trim();
    const keyMatch = line.match(/^([A-Z])/i);
    const key = keyMatch ? keyMatch[1].toUpperCase() : "";
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const label = line.replace(/^\s*([A-Z])(?:[)\].:\-]\s*|\s+)/i, "").trim();
    options.push({key, label});
  }

  return options.length >= 2 ? options : [];
}

/** Extracts the admin-authored option list out of a group's Instructions text. */
export function parseMatchingInfoOptionsFromInstructions(text: string): MatchingInfoOption[] {
  const source = String(text ?? "");
  if (!source) return [];

  const marked = extractMarkedOptions(source);
  if (marked.length) return marked;

  return extractLegacyBulletOptions(source);
}

/** Formats a single option back into the `#A. Marcel#` authoring convention. */
export function formatMatchingInfoOptionLine(key: string, label: string) {
  const trimmedKey = key.trim().toUpperCase();
  const trimmedLabel = label.trim();
  return trimmedLabel ? `#${trimmedKey}. ${trimmedLabel}#` : `#${trimmedKey}#`;
}

/** Formats a full option list into one `#...#` line per option, ready to append to Instructions. */
export function buildMatchingInfoInstructionsBlock(options: MatchingInfoOption[]) {
  return options
    .map(({key, label}) => formatMatchingInfoOptionLine(key, label))
    .join("\n");
}

/** Converts parsed options into the plain "A. Marcel" strings expected by the rest of the app. */
export function formatMatchingInfoOptionsAsPlainLines(options: MatchingInfoOption[]) {
  return options.map(({key, label}) => (label ? `${key}. ${label}` : key));
}

/**
 * Cleans up `#...#`-marked lines for student-facing display. Option lines (`#A. Marcel#`)
 * are dropped entirely — they're already rendered via the dedicated option-list widget.
 * Any other `#...#`-wrapped line (an "NB" note, a "List of People" heading, etc.) is kept,
 * with only the `#` wrapper removed, so it still displays as normal instruction text.
 */
export function stripMatchingInfoMarkersForDisplay(text: string) {
  const source = String(text ?? "");
  if (!source.includes("#")) return source;

  const kept: string[] = [];
  for (const line of source.split("\n")) {
    const wholeLineMatch = line.match(/^(\s*)#([^#]*)#(\s*)$/);
    if (!wholeLineMatch) {
      kept.push(line);
      continue;
    }

    if (MARKED_OPTION_WHOLE_LINE.test(line)) {
      continue;
    }

    kept.push(`${wholeLineMatch[1]}${wholeLineMatch[2].trim()}${wholeLineMatch[3]}`);
  }

  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Like stripMatchingInfoMarkersForDisplay, but drops every `#...#`-wrapped line
 * unconditionally — including the "NB" note and heading lines. Use this wherever those
 * annotations are already being rendered separately (e.g. the reading option-list bank),
 * so they don't also show up a second time in the plain instructions paragraph.
 */
export function stripAllMatchingInfoMarkedLinesForDisplay(text: string) {
  const source = String(text ?? "");
  if (!source.includes("#")) return source;

  const kept = source
    .split("\n")
    .filter((line) => !/^\s*#[^#]*#\s*$/.test(line));

  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export type MatchingInfoAnnotations = {
  note?: string;
  heading?: string;
};

function stripNbPrefix(inner: string): string | null {
  const match = inner.match(/^\s*\*{0,2}\s*NB\s*\*{0,2}\s*[.:\-]?\s*(.*)$/i);
  return match ? match[1].trim() : null;
}

/**
 * Extracts the optional "NB" note (e.g. "You may use any letter more than once.") and
 * the optional heading (e.g. "List of People") the admin authored as extra `#...#`-marked
 * lines in Instructions, alongside the lettered options. Both are plain text that may
 * still contain `**bold**` markup, meant to be rendered through InlineBoldText.
 */
export function extractMatchingInfoAnnotations(text: string): MatchingInfoAnnotations {
  const source = String(text ?? "");
  if (!source.includes("#")) return {};

  let note: string | undefined;
  let heading: string | undefined;

  for (const line of source.split("\n")) {
    if (note !== undefined && heading !== undefined) break;

    const wholeLineMatch = line.match(/^\s*#([^#]*)#\s*$/);
    if (!wholeLineMatch) continue;
    if (MARKED_OPTION_WHOLE_LINE.test(line)) continue;

    const inner = wholeLineMatch[1].trim();
    if (!inner) continue;

    if (note === undefined) {
      const nbBody = stripNbPrefix(inner);
      if (nbBody !== null) {
        note = nbBody || inner;
        continue;
      }
    }

    if (heading === undefined) {
      heading = inner;
    }
  }

  return {note, heading};
}

/** Derives a short option key (e.g. "A") from a choice string like "A. Marcel", or falls back positionally. */
export function extractKeyFromChoiceLabel(value: string, fallbackIndex: number) {
  const trimmed = String(value ?? "").trim();
  const prefixed = trimmed.match(/^([A-Za-z]{1,2})(?:[)\].:\-]|\s+)/);
  if (prefixed) return prefixed[1].toUpperCase();
  if (/^[A-Za-z]{1,2}$/.test(trimmed)) return trimmed.toUpperCase();

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return alphabet[fallbackIndex % alphabet.length] ?? "A";
}
