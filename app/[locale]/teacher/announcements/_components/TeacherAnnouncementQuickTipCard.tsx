"use client";

import {Lightbulb} from "lucide-react";
import {useTranslations} from "next-intl";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";

export function TeacherAnnouncementQuickTipCard() {
  const t = useTranslations("teacherAnnouncements");

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="pt-6 pb-2">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Lightbulb className="size-5 text-amber-400" />
          {t("quickTip")}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-5 text-sm text-muted-foreground">{t("quickTipContent")}</CardContent>
    </Card>
  );
}
