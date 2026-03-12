"use client";

import Link from "next/link";
import {Clock3} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {TeacherProfileActivityItem, TeacherStudentsLastActivity} from "@/data/teacher/selectors";

type TeacherProfileRecentActivityCardProps = {
  items: TeacherProfileActivityItem[];
};

function formatRelative(t: ReturnType<typeof useTranslations>, value: TeacherStudentsLastActivity) {
  if (typeof value.value === "number") {
    return t(`relative.${value.key}`, {value: value.value});
  }

  return t(`relative.${value.key}`);
}

export function TeacherProfileRecentActivityCard({items}: TeacherProfileRecentActivityCardProps) {
  const t = useTranslations("teacherProfile");
  const locale = useLocale();

  return (
    <Card className="rounded-2xl border-border/70 bg-card/80 py-0 shadow-[0_10px_36px_-30px_rgba(59,130,246,0.6)]">
      <CardHeader className="pt-6 pb-3">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Clock3 className="size-5 text-primary" />
          {t("recentActivity")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pb-5">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-border/65 bg-background/35 px-3 py-2.5 transition-colors hover:bg-background/50">
            <p className="text-sm font-medium">{t(`activityLabels.${item.activityKey}`)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {item.location ? `${item.location} - ` : ""}{item.detail}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{formatRelative(t, item.relative)}</p>
          </div>
        ))}
        <Link
          href={`/${locale}/teacher/analytics?source=profile-activity`}
          className="inline-flex text-sm font-medium text-primary transition hover:text-primary/80"
        >
          {t("viewFullActivityLog")}
        </Link>
      </CardContent>
    </Card>
  );
}
