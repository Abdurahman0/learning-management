"use client";

import {Suspense, useMemo, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {useLocale, useTranslations} from "next-intl";

import {authApi} from "@/lib/api/auth";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {cn} from "@/lib/utils";

import {AuthFlowShell} from "../auth/components/AuthFlowShell";

function VerifyResetCodePageContent() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = useMemo(() => searchParams.get("email") ?? "", [searchParams]);
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus(null);
    setStatusType(null);

    setIsSubmitting(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const response = await authApi.verifyResetCode({email: normalizedEmail, code: code.trim()});

      if (!response.ok) {
        setStatus(response.detail ?? t("messages.genericError"));
        setStatusType("error");
        return;
      }

      setStatus(response.detail ?? t("verifyResetCode.success"));
      setStatusType("success");

      const params = new URLSearchParams({email: normalizedEmail});
      router.replace(`/${locale}/reset-password?${params.toString()}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthFlowShell
      heading={t("verifyResetCode.title")}
      description={t("verifyResetCode.subtitle")}
      sideBadge={t("verifyResetCode.badge")}
      sideTitle={t("verifyResetCode.sideTitle")}
      sideDescription={t("verifyResetCode.sideDescription")}
      sidePoints={[t("verifyResetCode.sidePoint1"), t("verifyResetCode.sidePoint2"), t("verifyResetCode.sidePoint3")]}
    >
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

        <div className="space-y-2">
          <Label htmlFor="resetCode">{t("verifyResetCode.codeLabel")}</Label>
          <Input
            id="resetCode"
            autoComplete="one-time-code"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder={t("verifyResetCode.codePlaceholder")}
            className="h-11 rounded-xl tracking-[0.2em] uppercase"
          />
        </div>

        <Button
          type="submit"
          className="h-11 w-full rounded-xl bg-blue-600 text-base font-semibold hover:bg-blue-600/90"
          disabled={isSubmitting}
        >
          {isSubmitting ? t("common.submitting") : t("verifyResetCode.submit")}
        </Button>
      </form>

      {status ? (
        <p className={cn("mt-4 text-sm", statusType === "error" ? "text-destructive" : "text-emerald-600")}>{status}</p>
      ) : null}
    </AuthFlowShell>
  );
}

export default function VerifyResetCodePage() {
  return (
    <Suspense fallback={null}>
      <VerifyResetCodePageContent />
    </Suspense>
  );
}
