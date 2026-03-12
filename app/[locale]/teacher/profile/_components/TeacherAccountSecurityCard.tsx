"use client";

import {ShieldCheck} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";

type SecurityFormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type TeacherAccountSecurityCardProps = {
  value: SecurityFormState;
  onChange: (value: SecurityFormState) => void;
  onSubmit: () => void;
  canSubmit: boolean;
  errorMessage?: string | null;
};
const inputClassName =
  "h-11 w-full rounded-xl border border-border/70 bg-background/45 px-3 text-sm shadow-sm outline-none transition-[border-color,box-shadow,background-color] focus:border-primary/55 focus:bg-background/60 focus:shadow-primary/10 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.14)]";
const labelClassName = "text-sm font-medium text-foreground/90";

export function TeacherAccountSecurityCard({
  value,
  onChange,
  onSubmit,
  canSubmit,
  errorMessage
}: TeacherAccountSecurityCardProps) {
  const t = useTranslations("teacherProfile");

  const update = <K extends keyof SecurityFormState>(key: K, nextValue: SecurityFormState[K]) => {
    onChange({...value, [key]: nextValue});
  };

  return (
    <Card className="rounded-2xl border-border/70 bg-card/80 py-0 shadow-[0_10px_36px_-26px_rgba(59,130,246,0.65)]">
      <CardHeader className="border-b border-border/65 pt-6 pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <ShieldCheck className="size-5 text-primary" />
          {t("accountSecurity")}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 pt-5 pb-5">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <span className={labelClassName}>{t("currentPassword")}</span>
            <input
              type="password"
              value={value.currentPassword}
              onChange={(event) => update("currentPassword", event.target.value)}
              className={inputClassName}
            />
          </label>
          <label className="space-y-2">
            <span className={labelClassName}>{t("newPassword")}</span>
            <input
              type="password"
              value={value.newPassword}
              onChange={(event) => update("newPassword", event.target.value)}
              className={inputClassName}
            />
          </label>
          <label className="space-y-2">
            <span className={labelClassName}>{t("confirmPassword")}</span>
            <input
              type="password"
              value={value.confirmPassword}
              onChange={(event) => update("confirmPassword", event.target.value)}
              className={inputClassName}
            />
          </label>
        </div>

        {errorMessage ? <p className="text-sm text-rose-400">{errorMessage}</p> : null}

        <div className="flex justify-end">
          <Button type="button" className="rounded-xl" disabled={!canSubmit} onClick={onSubmit}>
            {t("updatePassword")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
