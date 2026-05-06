"use client";

import {useState} from "react";
import Link from "next/link";
import {useLocale, useTranslations} from "next-intl";
import {AlertTriangle, MailCheck, ShieldCheck} from "lucide-react";

import {authApi} from "@/lib/api/auth";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {cn} from "@/lib/utils";

import {AuthFlowShell} from "../auth/components/AuthFlowShell";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus(null);
    setStatusType(null);

    setIsSubmitting(true);

    try {
      const response = await authApi.forgotPassword({email: email.trim().toLowerCase()});

      if (!response.ok) {
        setStatus(response.detail ?? t("messages.genericError"));
        setStatusType("error");
        return;
      }

      setStatus(response.detail ?? t("forgotPassword.success"));
      setStatusType("success");
      setSentEmail(email.trim().toLowerCase());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthFlowShell
      heading={t("forgotPassword.title")}
      description={t("forgotPassword.subtitle")}
      sideBadge={t("forgotPassword.badge")}
      sideTitle={t("forgotPassword.sideTitle")}
      sideDescription={t("forgotPassword.sideDescription")}
      sidePoints={[t("forgotPassword.sidePoint1"), t("forgotPassword.sidePoint2"), t("forgotPassword.sidePoint3")]}
    >
      {statusType === "success" ? (
        <div className="rounded-3xl border border-blue-200/80 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-5 shadow-sm dark:border-blue-500/25 dark:from-blue-950/30 dark:via-slate-950/40 dark:to-cyan-950/20">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <MailCheck className="size-6" />
            </div>
            <div className="min-w-0 space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-foreground">{t("forgotPassword.emailSentTitle")}</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                {t("forgotPassword.emailSentDescription", {email: sentEmail || email.trim().toLowerCase()})}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-amber-300/80 bg-gradient-to-br from-amber-50 via-orange-50 to-background p-4 shadow-sm shadow-amber-500/10 dark:border-amber-500/35 dark:from-amber-500/15 dark:via-orange-500/10 dark:to-background/60">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/25">
                <AlertTriangle className="size-5" />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-extrabold tracking-tight text-amber-950 dark:text-amber-100">
                  {t("forgotPassword.spamWarningTitle")}
                </p>
                <p className="text-sm leading-6 text-amber-900/90 dark:text-amber-100/85">
                  {t("forgotPassword.spamWarningDescription")}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-border/70 bg-background/80 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-500" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">{t("forgotPassword.nextStepTitle")}</p>
                <p className="text-sm leading-6 text-muted-foreground">{t("forgotPassword.nextStepDescription")}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              className="h-11 rounded-xl bg-blue-600 px-5 text-base font-semibold hover:bg-blue-600/90"
              onClick={() => {
                setStatus(null);
                setStatusType(null);
              }}
            >
              {t("forgotPassword.tryDifferentEmail")}
            </Button>
            <Button asChild variant="outline" className="h-11 rounded-xl border-border/70">
              <Link href={`/${locale}/login`}>{t("forgotPassword.backToLogin")}</Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("fields.email")}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("placeholders.email")}
                className="h-11 rounded-xl"
              />
            </div>

            <Button
              type="submit"
              className="h-11 w-full rounded-xl bg-blue-600 text-base font-semibold hover:bg-blue-600/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? t("common.submitting") : t("forgotPassword.submit")}
            </Button>
          </form>

          {status ? (
            <p className={cn("mt-4 text-sm", statusType === "error" ? "text-destructive" : "text-emerald-600")}>{status}</p>
          ) : null}

          <Button asChild variant="link" className="mt-2 h-auto justify-start px-0">
            <Link href={`/${locale}/login`}>{t("forgotPassword.backToLogin")}</Link>
          </Button>
        </>
      )}
    </AuthFlowShell>
  );
}
