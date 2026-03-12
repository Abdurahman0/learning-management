"use client";

import {useMemo} from "react";
import {useTranslations} from "next-intl";

import {ChartContainer} from "@/components/ui/chart";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {TeacherClassProgressPoint} from "@/data/teacher/selectors";

type TeacherClassProgressOverviewProps = {
  points: TeacherClassProgressPoint[];
};

function roundToOne(value: number) {
  return Math.round(value * 10) / 10;
}

export function TeacherClassProgressOverview({points}: TeacherClassProgressOverviewProps) {
  const t = useTranslations("teacherStudents");

  const chart = useMemo(() => {
    const width = 760;
    const height = 332;
    const left = 38;
    const right = 12;
    const top = 16;
    const bottom = 44;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const baseline = top + plotHeight;
    const maxValue = Math.max(...points.map((point) => Math.max(point.currentMonth, point.target)), 8);
    const paddedMax = maxValue + 0.4;

    const groupWidth = plotWidth / Math.max(1, points.length);
    const barWidth = Math.min(38, groupWidth * 0.28);

    const mapY = (value: number) => top + (1 - value / paddedMax) * plotHeight;

    return {
      width,
      height,
      left,
      right,
      top,
      baseline,
      plotHeight,
      groupWidth,
      barWidth,
      paddedMax,
      mapY
    };
  }, [points]);

  const averageCurrent = roundToOne(points.reduce((sum, point) => sum + point.currentMonth, 0) / Math.max(1, points.length));
  const averageTarget = roundToOne(points.reduce((sum, point) => sum + point.target, 0) / Math.max(1, points.length));

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="flex flex-wrap items-start justify-between gap-3 pt-5 pb-2">
        <div>
          <CardTitle className="text-xl">{t("classProgressOverview")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("classProgressSubtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-primary">
            <span className="size-2 rounded-full bg-primary" />
            {t("legend.currentMonth")}: {averageCurrent.toFixed(1)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/45 px-2.5 py-1 text-muted-foreground">
            <span className="size-2 rounded-full bg-indigo-400/80" />
            {t("legend.target")}: {averageTarget.toFixed(1)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-2 pb-5">
        <ChartContainer className="overflow-x-hidden [--class-grid:rgba(148,163,184,0.16)] [--class-axis:#64748B] dark:[--class-grid:rgba(148,163,184,0.12)] dark:[--class-axis:rgba(203,213,225,0.72)]">
          <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="h-auto w-full">
            {[0, 1, 2, 3, 4].map((index) => {
              const value = (chart.paddedMax * (4 - index)) / 4;
              const y = chart.mapY(value);

              return (
                <g key={`class-grid-${index}`}>
                  <line x1={chart.left} y1={y} x2={chart.width - chart.right} y2={y} stroke="var(--class-grid)" strokeDasharray="4 5" />
                  <text x={4} y={y + 4} fontSize={10} fill="var(--class-axis)">
                    {value.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {points.map((point, index) => {
              const groupStart = chart.left + index * chart.groupWidth;
              const center = groupStart + chart.groupWidth / 2;
              const currentHeight = chart.baseline - chart.mapY(point.currentMonth);
              const targetHeight = chart.baseline - chart.mapY(point.target);
              const currentX = center - chart.barWidth - 2;
              const targetX = center + 2;

              return (
                <g key={`module-${point.module}`}>
                  <rect
                    x={currentX}
                    y={chart.baseline - currentHeight}
                    width={chart.barWidth}
                    height={currentHeight}
                    rx={8}
                    className="fill-primary"
                  />
                  <rect
                    x={targetX}
                    y={chart.baseline - targetHeight}
                    width={chart.barWidth}
                    height={targetHeight}
                    rx={8}
                    className="fill-indigo-400/80"
                  />
                  <text x={center} y={chart.baseline + 22} fontSize={11} fill="var(--class-axis)" textAnchor="middle">
                    {t(`modules.${point.module}`)}
                  </text>
                </g>
              );
            })}
          </svg>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
