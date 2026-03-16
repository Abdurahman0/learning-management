"use client";

import {useTranslations} from "next-intl";

import {Card, CardContent} from "@/components/ui/card";

type TeacherProfileStatusCardProps = {
  verified: boolean;
  profileCompletion: number;
};

export function TeacherProfileStatusCard({verified, profileCompletion}: TeacherProfileStatusCardProps) {
  const t = useTranslations("teacherProfile");

  return (
    <Card className="rounded-2xl border-border/70 bg-linear-to-br from-primary/25 via-card/88 to-card/78 py-0 shadow-[0_14px_40px_-24px_rgba(59,130,246,0.75)]">
      <CardContent className="space-y-3 p-5">
        <p className="text-xl font-semibold">
          {t("teacherStatus")}: {verified ? t("verified") : t("notVerified")}
        </p>
        <p className="text-sm text-muted-foreground">{t("statusMessage")}</p>
        <div className="space-y-1.5">
          <div className="h-2 rounded-full bg-background/55">
            <div className="h-2 rounded-full bg-primary" style={{width: `${profileCompletion}%`}} />
          </div>
          <p className="text-xs text-muted-foreground">{t("profileCompletion")}: {profileCompletion}%</p>
        </div>
      </CardContent>
    </Card>
  );
}
