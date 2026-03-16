"use client";

import {MessageSquareMore, Save} from "lucide-react";
import {useTranslations} from "next-intl";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {TeacherReviewCriteriaScores, TeacherReviewSubmission} from "@/data/teacher/selectors";

type TeacherReviewDetailsPanelProps = {
  submission: TeacherReviewSubmission | null;
  selectedBand: number | null;
  criteria: TeacherReviewCriteriaScores;
  feedback: string;
  onSelectBand: (band: number) => void;
  onChangeCriteria: (key: keyof TeacherReviewCriteriaScores, value: number) => void;
  onChangeFeedback: (value: string) => void;
  onSaveDraft: () => void;
  onSubmitReview: () => void;
  onMessageStudent: () => void;
};

const bandOptions = [5.5, 6.0, 6.5, 7.0, 7.5, 8.0];

const criteriaFields: Array<{key: keyof TeacherReviewCriteriaScores; i18nKey: string}> = [
  {key: "taskResponse", i18nKey: "taskResponse"},
  {key: "coherence", i18nKey: "coherenceCohesion"},
  {key: "lexical", i18nKey: "lexicalResource"},
  {key: "grammar", i18nKey: "grammaticalAccuracy"}
];

function criteriaTone(value: number) {
  if (value < 55) {
    return "bg-rose-400";
  }

  if (value < 75) {
    return "bg-amber-400";
  }

  return "bg-emerald-400";
}

function formatRelativeTime(t: ReturnType<typeof useTranslations>, isoDate: string) {
  const diffMinutes = Math.max(1, Math.round((Date.now() - new Date(isoDate).getTime()) / (1000 * 60)));

  if (diffMinutes < 60) {
    return t("relative.minutesAgo", {value: diffMinutes});
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return t("relative.hoursAgo", {value: diffHours});
  }

  if (diffHours < 48) {
    return t("relative.yesterday");
  }

  return t("relative.daysAgo", {value: Math.round(diffHours / 24)});
}

export function TeacherReviewDetailsPanel({
  submission,
  selectedBand,
  criteria,
  feedback,
  onSelectBand,
  onChangeCriteria,
  onChangeFeedback,
  onSaveDraft,
  onSubmitReview,
  onMessageStudent
}: TeacherReviewDetailsPanelProps) {
  const t = useTranslations("teacherReviews");

  if (!submission) {
    return (
      <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
        <CardContent className="p-6 text-sm text-muted-foreground">{t("noSubmissionSelected")}</CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="border-b border-border/65 pt-6 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Avatar>
              <AvatarFallback className="bg-primary/18 text-primary">{submission.studentAvatarFallback}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <CardTitle className="truncate text-xl">{submission.studentName}</CardTitle>
              <p className="mt-0.5 text-sm text-muted-foreground">{formatRelativeTime(t, submission.submittedAt)}</p>
            </div>
          </div>

          <Button type="button" variant="outline" className="rounded-xl border-border/70 bg-background/45" onClick={onMessageStudent}>
            <MessageSquareMore className="size-4" />
            {t("messageStudent")}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-5">
        <section className="space-y-1.5">
          <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("activeAssignment")}</p>
          <p className="text-base font-medium">{submission.assignmentTitle}</p>
        </section>

        <section className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("submissionContent")}</p>
          <div className="max-h-55 overflow-y-auto rounded-xl border border-border/70 bg-background/45 p-3 text-sm leading-relaxed whitespace-pre-line">
            {submission.content}
          </div>
        </section>

        <section className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("estimatedBandScore")}</p>
          <div className="grid grid-cols-3 gap-2">
            {bandOptions.map((band) => {
              const active = selectedBand === band;

              return (
                <Button
                  key={band}
                  type="button"
                  variant={active ? "default" : "outline"}
                  className="h-9 rounded-lg"
                  onClick={() => onSelectBand(band)}
                >
                  {band.toFixed(1)}
                </Button>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("criteriaBreakdown")}</p>
          {criteriaFields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span>{t(field.i18nKey)}</span>
                <span className="font-semibold">{criteria[field.key]}%</span>
              </div>
              <div className="group relative">
                <div className="h-2 rounded-full bg-muted/70">
                  <div
                    className={`h-2 rounded-full ${criteriaTone(criteria[field.key])}`}
                    style={{width: `${criteria[field.key]}%`}}
                    aria-hidden="true"
                  />
                </div>
                <span className="pointer-events-none absolute -top-7 right-0 hidden rounded-md border border-border/70 bg-card px-2 py-0.5 text-[11px] font-semibold shadow-md group-hover:block max-sm:px-1.5 max-sm:py-0.5 max-sm:text-[10px]">
                  {criteria[field.key]}%
                </span>
              </div>
              <input
                type="range"
                min={35}
                max={95}
                step={1}
                value={criteria[field.key]}
                onChange={(event) => onChangeCriteria(field.key, Number(event.target.value))}
                className="h-1.5 w-full accent-primary"
              />
            </div>
          ))}
        </section>

        <section className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("teacherFeedback")}</p>
          <textarea
            value={feedback}
            onChange={(event) => onChangeFeedback(event.target.value)}
            rows={4}
            placeholder={t("feedbackPlaceholder")}
            className="w-full resize-none rounded-xl border border-border/70 bg-background/45 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary/55"
          />
        </section>

        <div className="flex flex-wrap justify-end gap-2.5 pt-1">
          <Button type="button" variant="secondary" className="rounded-xl" onClick={onSaveDraft}>
            <Save className="size-4" />
            {t("saveDraft")}
          </Button>
          <Button type="button" className="rounded-xl" onClick={onSubmitReview}>
            {t("submitReview")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
