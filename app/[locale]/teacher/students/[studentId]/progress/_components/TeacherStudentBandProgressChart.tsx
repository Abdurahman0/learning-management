"use client";

import {useMemo} from "react";
import {TrendingUp} from "lucide-react";
import {useTranslations} from "next-intl";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {TeacherStudentProgressBandPoint} from "@/data/teacher/selectors";

type TeacherStudentBandProgressChartProps = {
  points: TeacherStudentProgressBandPoint[];
};

export function TeacherStudentBandProgressChart({points}: TeacherStudentBandProgressChartProps) {
  const t = useTranslations("teacherStudentProgress");

  const bars = useMemo(() => {
    const values = points.map((item) => item.band);
    const min = Math.floor((Math.min(...values) - 0.3) * 2) / 2;
    const max = Math.ceil((Math.max(...values) + 0.3) * 2) / 2;
    const range = Math.max(0.6, max - min);

    return points.map((item) => ({
      ...item,
      heightPercent: Math.max(16, ((item.band - min) / range) * 100)
    }));
  }, [points]);

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pt-7 pb-3">
        <CardTitle className="inline-flex items-center gap-2 text-xl">
          <TrendingUp className="size-4.5 text-primary" />
          {t("bandScoreProgression")}
        </CardTitle>
        <span className="inline-flex rounded-full border border-border/70 bg-background/45 px-2.5 py-1 text-xs text-muted-foreground">
          {t("last6Months")}
        </span>
      </CardHeader>

      <CardContent className="pb-5">
        <div className="relative h-[250px] rounded-xl border border-border/60 bg-background/35 p-4">
          {[0, 1, 2, 3].map((step) => (
            <div
              key={step}
              className="absolute right-4 left-4 border-t border-dashed border-border/35"
              style={{bottom: `${20 + step * 23}%`}}
            />
          ))}

          <div className="relative z-[1] flex h-full items-end justify-around gap-3">
            {bars.map((point, index) => (
              <div key={point.id} className="flex h-full w-[22%] max-w-[110px] flex-col items-center justify-end">
                <div className="flex h-[72%] w-full items-end justify-center">
                  <div
                    className={`w-11 rounded-t-xl shadow-[0_0_18px_rgba(59,130,246,0.25)] ${
                      index === bars.length - 1
                        ? "bg-gradient-to-t from-blue-700 to-blue-500"
                        : "bg-gradient-to-t from-indigo-800/85 to-indigo-500/90"
                    }`}
                    style={{height: `${point.heightPercent}%`}}
                  />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{t(`tests.${point.label}`)}</p>
                <p className="text-sm font-semibold">{point.band.toFixed(1)}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
