"use client";

import {useEffect, useState} from "react";
import {Loader2, MessageSquareText, X} from "lucide-react";
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
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true">
          <Card className="w-full max-w-xl overflow-hidden rounded-3xl border-border/70 bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <CardContent className="p-0">
              <div className="border-b border-border/70 bg-linear-to-br from-blue-600/12 via-cyan-500/8 to-background px-5 py-5 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-[0.18em] text-blue-600 uppercase dark:text-blue-300">{t("eyebrow")}</p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">{t("title")}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/70 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-60"
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
                  <span className="text-sm font-semibold text-foreground">{t("label")}</span>
                  <textarea
                    value={message}
                    onChange={(event) => {
                      setMessage(event.target.value);
                      if (error) setError(null);
                    }}
                    maxLength={MAX_FEEDBACK_LENGTH}
                    placeholder={t("placeholder")}
                    className="mt-2 min-h-36 w-full resize-y rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm leading-relaxed text-foreground outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
                  />
                </label>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">{t("counter", {count: message.trim().length, max: MAX_FEEDBACK_LENGTH})}</p>
                  {error ? <p className="text-right text-xs font-medium text-rose-500">{error}</p> : null}
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" className="rounded-xl" onClick={closeModal} disabled={isSubmitting}>
                    {t("cancel")}
                  </Button>
                  <Button type="button" className="rounded-xl bg-blue-600 text-white hover:bg-blue-600/90" onClick={() => void handleSubmit()} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <MessageSquareText className="size-4" aria-hidden="true" />}
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
