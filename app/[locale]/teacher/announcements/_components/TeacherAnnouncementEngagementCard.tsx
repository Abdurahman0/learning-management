"use client";

import Link from "next/link";
import {ArrowRight} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {TeacherAnnouncementsPageData} from "@/data/teacher/selectors";

type TeacherAnnouncementEngagementCardProps = {
  engagement: TeacherAnnouncementsPageData["engagement"];
};

type EngagementRow = {
  id: keyof TeacherAnnouncementsPageData["engagement"];
  toneClassName: string;
  barClassName: string;
};

const rows: EngagementRow[] = [
  {id: "totalViewsPercent", toneClassName: "text-primary", barClassName: "bg-primary"},
  {id: "resourceClicksPercent", toneClassName: "text-emerald-400", barClassName: "bg-emerald-400"},
  {id: "unreadPercent", toneClassName: "text-amber-400", barClassName: "bg-amber-400"}
];

export function TeacherAnnouncementEngagementCard({engagement}: TeacherAnnouncementEngagementCardProps) {
  const t = useTranslations("teacherAnnouncements");
  const locale = useLocale();

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="pt-7 pb-3">
        <CardTitle className="text-2xl">{t("engagementOverview")}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 pb-5">
        {rows.map((row) => {
          const value = engagement[row.id];

          return (
            <div key={row.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">{t(`engagement.${row.id}`)}</p>
                <p className={`font-semibold ${row.toneClassName}`}>{value}%</p>
              </div>
              <div className="h-2 rounded-full bg-background/70">
                <div className={`h-2 rounded-full ${row.barClassName}`} style={{width: `${value}%`}} />
              </div>
            </div>
          );
        })}

        <Button asChild variant="secondary" className="mt-1 h-11 w-full rounded-xl">
          <Link href={`/${locale}/teacher/analytics?source=announcements`}>
            {t("viewDetailedReport")}
            <ArrowRight className="ml-1 size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
