"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ListeningEvidenceStatus = "correct" | "incorrect" | "skipped";

export type ListeningTranscriptEvidence = {
  questionId: string;
  questionNumber: number;
  prompt: string;
  quote: string;
  timeRange?: [number, number];
  status: ListeningEvidenceStatus;
};

export type ListeningReviewSection = {
  sectionId: string;
  label: string;
  title: string;
  instructions: string;
  nowPlayingLabel: string;
  audioTitle: string;
  transcriptText?: string;
  evidenceItems: ListeningTranscriptEvidence[];
};

type ListeningTranscriptReviewPanelProps = {
  sections: ListeningReviewSection[];
  activeSectionId: string;
  highlightedQuestionId: string | null;
  onSectionChange: (sectionId: string) => void;
  onGoToQuestion?: (questionId: string) => void;
  className?: string;
};

function normalizeForSearch(value: string) {
  return value
    .toLowerCase()
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

type TranscriptLine = {
  speaker: string | null;
  text: string;
};

function parseTranscriptLines(transcriptText: string): TranscriptLine[] {
  const rawLines = transcriptText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const knownSpeakers = new Set(["MAN", "WOMAN", "NARRATOR", "HOST", "GUEST"]);
  const out: TranscriptLine[] = [];

  for (const line of rawLines) {
    const colonMatch = line.match(/^([A-Z][A-Z0-9 ]{1,18})\s*:\s*(.+)$/);
    if (colonMatch) {
      out.push({ speaker: colonMatch[1].trim(), text: colonMatch[2].trim() });
      continue;
    }

    const spaceMatch = line.match(/^([A-Z][A-Z0-9 ]{1,18})\s+(.+)$/);
    if (spaceMatch) {
      const maybeSpeaker = spaceMatch[1].trim();
      const rest = spaceMatch[2].trim();
      const isKnown = knownSpeakers.has(maybeSpeaker) || /^SPEAKER\s*\d+$/i.test(maybeSpeaker);
      const isShort = maybeSpeaker.length <= 10;
      if (isKnown || isShort) {
        out.push({ speaker: maybeSpeaker, text: rest });
        continue;
      }
    }

    out.push({ speaker: null, text: line });
  }

  return out;
}

function renderHighlightedText(text: string, needle: string) {
  const normalizedNeedle = normalizeForSearch(needle);
  if (!normalizedNeedle) return { node: text, hit: false };

  const normalizedText = normalizeForSearch(text);
  const idx = normalizedText.indexOf(normalizedNeedle);
  if (idx < 0) return { node: text, hit: false };

  // Best-effort mapping back to original string: highlight by a simple case-insensitive search.
  const lower = text.toLowerCase();
  const rawNeedleLower = needle.toLowerCase().trim();
  const rawIdx = rawNeedleLower ? lower.indexOf(rawNeedleLower) : -1;
  if (rawIdx < 0) {
    // We found a normalized match but can't map indices back reliably.
    // Highlight the full line so the user still gets a visible "evidence" cue.
    return {
      node: (
        <mark className="rounded-sm bg-emerald-200/70 px-0.5 text-foreground dark:bg-emerald-500/20">
          {text}
        </mark>
      ),
      hit: true,
    };
  }

  const before = text.slice(0, rawIdx);
  const match = text.slice(rawIdx, rawIdx + rawNeedleLower.length);
  const after = text.slice(rawIdx + rawNeedleLower.length);
  return {
    node: (
      <>
        {before}
        <mark className="rounded-sm bg-emerald-200/70 px-0.5 text-foreground dark:bg-emerald-500/20">
          {match}
        </mark>
        {after}
      </>
    ),
    hit: true,
  };
}

export function ListeningTranscriptReviewPanel({
  sections,
  activeSectionId,
  highlightedQuestionId,
  onSectionChange,
  onGoToQuestion,
  className,
}: ListeningTranscriptReviewPanelProps) {
  const t = useTranslations("listeningResult");
  const activeSection = sections.find((section) => section.sectionId === activeSectionId) ?? sections[0];
  const transcriptRef = useRef<HTMLDivElement | null>(null);

  if (!activeSection) return null;

  const transcriptLines = parseTranscriptLines(activeSection.transcriptText ?? "");
  const evidenceItems = [...(activeSection.evidenceItems ?? [])]
    .filter((item) => normalizeForSearch(item.quote))
    // Prefer longer quotes first so we hit the most specific match per line.
    .sort((a, b) => b.quote.length - a.quote.length);

  useEffect(() => {
    if (!highlightedQuestionId) return;
    window.setTimeout(() => {
      const node = document.getElementById(`transcript-hit-${highlightedQuestionId}`);
      node?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }, [highlightedQuestionId, activeSection.sectionId]);

  return (
    <Card
      className={cn(
        "flex h-[80vh] min-h-0 w-full max-w-full flex-col overflow-hidden rounded-3xl border-slate-200/85 bg-white/95 py-0 shadow-sm shadow-slate-200/50 dark:border-border/75 dark:bg-card/75 dark:shadow-none xl:h-[85vh]",
        className
      )}
    >
      <div className="min-h-0 min-w-0 max-w-full flex-1 overflow-y-auto px-4 pb-5 pt-4 [scrollbar-width:thin] sm:px-6">
        {transcriptLines.length ? (
          <div
            ref={transcriptRef}
            className="space-y-3 text-[15px] leading-7 text-foreground/95"
            aria-label={t("transcript")}
          >
            {(() => {
              const anchorsAssigned = new Set<string>();
              return transcriptLines.map((line, index) => {
                let matchedEvidence: ListeningTranscriptEvidence | null = null;
                let highlighted: { node: ReactNode; hit: boolean } = { node: line.text, hit: false };

                for (const evidence of evidenceItems) {
                  const attempt = renderHighlightedText(line.text, evidence.quote);
                  if (attempt.hit) {
                    matchedEvidence = evidence;
                    highlighted = attempt;
                    break;
                  }
                }

                const matchedQuestionId = matchedEvidence?.questionId ?? null;
                const anchorId =
                  matchedQuestionId && !anchorsAssigned.has(matchedQuestionId)
                    ? `transcript-hit-${matchedQuestionId}`
                    : undefined;

                if (matchedQuestionId && anchorId) {
                  anchorsAssigned.add(matchedQuestionId);
                }

                return (
                  <div
                    key={`transcript-line-${index}`}
                    id={anchorId}
                    className={cn(
                      "grid grid-cols-[88px_minmax(0,1fr)] gap-3",
                      matchedQuestionId &&
                        highlightedQuestionId === matchedQuestionId &&
                        "rounded-lg bg-emerald-500/10 px-2 py-1 ring-2 ring-emerald-400/50 ring-offset-1 ring-offset-background"
                    )}
                  >
                    <div className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                      {line.speaker ? (
                        <span className="inline-flex rounded-full border border-border/70 bg-muted/30 px-2 py-1 text-[11px] text-foreground/80">
                          {line.speaker}
                        </span>
                      ) : (
                        <span />
                      )}
                    </div>
                    <p className="wrap-break-word">{highlighted.node}</p>
                  </div>
                );
              });
            })()}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("notAvailable")}</p>
        )}
      </div>
    </Card>
  );
}
