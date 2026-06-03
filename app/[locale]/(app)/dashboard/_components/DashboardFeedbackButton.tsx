"use client";

import {useEffect, useState} from "react";
import {Loader2, MessageSquareText, SendHorizontal, X} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {StudentApiError} from "@/src/services/student/types";
import {studentFeedbackService} from "@/src/services/feedback.service";
import {cn} from "@/lib/utils";

type FeedbackNotice = {
  title: string;
  description: string;
  tone: "success" | "error";
};

type DashboardFeedbackButtonProps = {
  className?: string;
  onNotice: (notice: FeedbackNotice) => void;
};

const MAX_FEEDBACK_LENGTH = 1200;

export function DashboardFeedbackButton({className, onNotice}: DashboardFeedbackButtonProps) {
  const t = useTranslations("dashboard.feedbackModal");
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, open]);

  const closeModal = () => {
    if (isSubmitting) return;
    setOpen(false);
    setError(null);
  };

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      setError(t("errors.required"));
      return;
    }
    if (trimmed.length > MAX_FEEDBACK_LENGTH) {
      setError(t("errors.tooLong", {max: MAX_FEEDBACK_LENGTH}));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await studentFeedbackService.create(trimmed);
      setMessage("");
      setOpen(false);
      onNotice({
        title: t("success.title"),
        description: t("success.description"),
        tone: "success"
      });
    } catch (requestError) {
      const fieldMessage =
        requestError instanceof StudentApiError
          ? requestError.fieldErrors.feedback_text?.[0]
          : "";
      const description =
        fieldMessage ||
        (requestError instanceof Error ? requestError.message : t("errors.submit"));
      setError(description);
      onNotice({
        title: t("errors.title"),
        description,
        tone: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={cn("h-11 rounded-xl border-border/70 bg-background/40 px-4 hover:bg-muted/40", className)}
        onClick={() => setOpen(true)}
      >
        <MessageSquareText className="size-4" aria-hidden="true" />
        {t("button")}
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-md animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <Card
            className="w-full max-w-2xl overflow-hidden rounded-[2rem] border-slate-200/80 bg-white shadow-[0_30px_90px_-45px_rgba(15,23,42,0.65)] animate-in zoom-in-95 duration-200 dark:border-border/70 dark:bg-card dark:shadow-black/40"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <CardContent className="p-0">
              <div className="relative overflow-hidden border-b border-slate-200/80 bg-linear-to-br from-blue-50 via-cyan-50/70 to-white px-5 py-5 dark:border-border/70 dark:from-blue-950/35 dark:via-cyan-950/15 dark:to-card sm:px-6">
                <div className="pointer-events-none absolute -top-16 -right-12 size-40 rounded-full bg-blue-400/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 left-10 size-44 rounded-full bg-cyan-400/20 blur-3xl" />
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-blue-700 uppercase shadow-sm dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
                      <MessageSquareText className="size-3.5" aria-hidden="true" />
                      {t("eyebrow")}
                    </span>
                    <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 dark:text-foreground">{t("title")}</h2>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-muted-foreground">{t("description")}</p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-500 shadow-sm transition-colors hover:bg-white hover:text-slate-950 disabled:pointer-events-none disabled:opacity-60 dark:border-border/70 dark:bg-background/70 dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground"
                    onClick={closeModal}
                    disabled={isSubmitting}
                    aria-label={t("close")}
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 px-5 py-5 sm:px-6">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-900 dark:text-foreground">{t("label")}</span>
                  <textarea
                    value={message}
                    onChange={(event) => {
                      setMessage(event.target.value);
                      if (error) setError(null);
                    }}
                    maxLength={MAX_FEEDBACK_LENGTH}
                    placeholder={t("placeholder")}
                    className="mt-2 min-h-40 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm leading-relaxed text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/15 dark:border-border/70 dark:bg-background/70 dark:text-foreground dark:placeholder:text-muted-foreground dark:focus:bg-background"
                  />
                </label>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">{t("counter", {count: message.trim().length, max: MAX_FEEDBACK_LENGTH})}</p>
                  {error ? <p className="text-right text-xs font-medium text-rose-500">{error}</p> : null}
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" className="h-10 rounded-xl border-slate-200 bg-white hover:bg-slate-50 dark:border-border/70 dark:bg-background/35" onClick={closeModal} disabled={isSubmitting}>
                    {t("cancel")}
                  </Button>
                  <Button type="button" className="h-10 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-cyan-400" onClick={() => void handleSubmit()} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <SendHorizontal className="size-4" aria-hidden="true" />}
                    {isSubmitting ? t("submitting") : t("submit")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}
