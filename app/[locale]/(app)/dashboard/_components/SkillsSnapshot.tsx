"use client";

import {useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Progress} from "@/components/ui/progress";
import type {DashboardUserSummary, SkillItem} from "@/data/student/dashboard";

type SkillsSnapshotProps = {
  skills: SkillItem[];
  summary: DashboardUserSummary;
  overallJourneyPct: number;
  id?: string;
};

export function SkillsSnapshot({skills, summary, overallJourneyPct, id}: SkillsSnapshotProps) {
  const t = useTranslations("dashboard");

  return (
    <div id={id} className="min-w-0 space-y-4">
      <Card className="rounded-2xl border-border/70 bg-card/70">
        <CardHeader>
          <CardTitle>{t("skillsSnapshot.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {skills.map((item) => (
            <div key={item.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">{t(`skills.${item.key}`)}</p>
                <p className="font-medium">{item.band.toFixed(1)}</p>
              </div>
              <Progress value={(item.band / 9) * 100} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-blue-500/35 bg-blue-500/10">
        <CardHeader>
          <CardTitle className="text-blue-300">{t("targetGoal.title", {band: summary.goalBand.toFixed(1)})}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("targetGoal.description")}</p>
          <div className="mt-3 flex items-center justify-between text-xs">
            <Badge>{t("targetGoal.overallJourney")}</Badge>
            <span>{overallJourneyPct}%</span>
          </div>
          <Progress className="mt-2" value={overallJourneyPct} />
        </CardContent>
      </Card>
    </div>
  );
}
