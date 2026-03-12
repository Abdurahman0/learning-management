"use client";

import {useTranslations} from "next-intl";

import {Card, CardContent} from "@/components/ui/card";
import type {TeacherProfileStatItem} from "@/data/teacher/selectors";

type TeacherProfileStatsGridProps = {
  items: TeacherProfileStatItem[];
};

export function TeacherProfileStatsGrid({items}: TeacherProfileStatsGridProps) {
  const t = useTranslations("teacherProfile");

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <Card
          key={item.id}
          className="rounded-2xl border-border/70 bg-card/80 py-0 shadow-[0_10px_36px_-30px_rgba(59,130,246,0.7)] transition-colors hover:bg-card/90"
        >
          <CardContent className="space-y-1 p-4">
            <p className="text-xs tracking-[0.06em] text-muted-foreground uppercase">{t(item.id)}</p>
            <p className="text-3xl font-semibold tracking-tight text-primary">{item.value.toLocaleString()}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
