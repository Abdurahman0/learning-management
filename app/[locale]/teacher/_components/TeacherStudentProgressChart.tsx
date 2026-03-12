"use client";

import {useMemo, useState, type CSSProperties} from "react";
import {useTranslations} from "next-intl";

import {ChartContainer} from "@/components/ui/chart";
import {Badge} from "@/components/ui/badge";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {teacherProgressPoints, type TeacherProgressMonthKey} from "@/data/teacher-dashboard";

type Point = {
  x: number;
  y: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createSmoothLine(points: Point[]) {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;
  const tension = 1;

  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = index === 0 ? points[index] : points[index - 1];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = index + 2 < points.length ? points[index + 2] : p2;

    const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension;
    const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension;
    const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension;
    const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension;

    path += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
  }

  return path;
}

type TooltipProps = {
  style: CSSProperties;
  label: string;
  value: number;
};

function ChartTooltip({style, label, value}: TooltipProps) {
  return (
    <div
      className="pointer-events-none absolute z-20 w-[152px] rounded-xl border border-[rgba(148,163,184,0.18)] bg-background/95 px-3.5 py-2.5 shadow-lg backdrop-blur-md -translate-x-1/2 -translate-y-[112%] max-md:w-[104px] max-md:rounded-lg max-md:px-2 max-md:py-1 max-md:-translate-x-full max-md:-translate-y-[108%] max-md:-ml-2"
      style={style}
    >
      <p className="text-xs text-muted-foreground max-md:text-[9px]">{label}</p>
      <p className="mt-1 text-sm font-semibold max-md:mt-0.5 max-md:text-[11px]">{value.toFixed(1)}</p>
    </div>
  );
}

export function TeacherStudentProgressChart() {
  const t = useTranslations("teacherDashboard");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chart = useMemo(() => {
    const width = 760;
    const height = 340;
    const left = 42;
    const right = 34;
    const top = 18;
    const bottom = 40;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const baseline = top + plotHeight;

    const rawValues = teacherProgressPoints.map((point) => point.value);
    const min = Math.max(2.5, Math.floor((Math.min(...rawValues) - 0.4) * 2) / 2);
    // IELTS band scale should be capped at 9.0 for consistent visual reading.
    const max = 9;
    const safeRange = max - min || 1;

    const mapX = (index: number) => {
      if (teacherProgressPoints.length <= 1) {
        return left;
      }

      return left + (index * plotWidth) / (teacherProgressPoints.length - 1);
    };

    const mapY = (value: number) => top + ((max - value) / safeRange) * plotHeight;
    const points = teacherProgressPoints.map((item, index) => ({x: mapX(index), y: mapY(item.value)}));
    const linePath = createSmoothLine(points);
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`;
    const yTicks = [0, 1, 2, 3, 4].map((step) => max - (safeRange * step) / 4);

    return {
      width,
      height,
      left,
      right,
      top,
      plotWidth,
      plotHeight,
      baseline,
      points,
      yTicks,
      areaPath,
      linePath
    };
  }, []);

  const safeActiveIndex = activeIndex !== null && activeIndex >= 0 && activeIndex < teacherProgressPoints.length ? activeIndex : null;
  const activePoint = safeActiveIndex === null ? null : chart.points[safeActiveIndex];
  const activeData = safeActiveIndex === null ? null : teacherProgressPoints[safeActiveIndex];

  return (
    <Card className="min-w-0 rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pt-5 pb-2">
        <div>
          <CardTitle className="text-xl">{t("studentProgressOverview")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("averageBandImprovement")}</p>
        </div>

        <Badge variant="secondary" className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-primary">
          {t("range.sixMonths")}
        </Badge>
      </CardHeader>

      <CardContent className="pt-1.5 pb-5">
        <ChartContainer className="relative overflow-x-hidden rounded-xl border border-border/65 bg-background/35 p-2 [--teacher-line:#3867FF] [--teacher-dot:#4F7BFF] [--teacher-grid:rgba(148,163,184,0.14)] [--teacher-axis:#64748B] [--teacher-area-top:rgba(56,103,255,0.24)] [--teacher-area-bottom:rgba(56,103,255,0.03)] dark:[--teacher-line:#5E83FF] dark:[--teacher-dot:#81A0FF] dark:[--teacher-grid:rgba(148,163,184,0.12)] dark:[--teacher-axis:rgba(203,213,225,0.72)] dark:[--teacher-area-top:rgba(94,131,255,0.30)] dark:[--teacher-area-bottom:rgba(94,131,255,0.05)]">
          <svg
            viewBox={`0 0 ${chart.width} ${chart.height}`}
            className="h-auto w-full"
            onMouseLeave={() => setActiveIndex(null)}
          >
            <defs>
              <linearGradient id="teacher-progress-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--teacher-area-top)" />
                <stop offset="100%" stopColor="var(--teacher-area-bottom)" />
              </linearGradient>
            </defs>

            {chart.yTicks.map((tick) => {
              const safeTickRange = chart.yTicks[0] - chart.yTicks[chart.yTicks.length - 1] || 1;
              const y = chart.baseline - ((tick - chart.yTicks[chart.yTicks.length - 1]) / safeTickRange) * chart.plotHeight;

              return (
                <g key={`teacher-grid-${tick}`}>
                  <line x1={chart.left} y1={y} x2={chart.width - chart.right} y2={y} stroke="var(--teacher-grid)" strokeDasharray="4 5" />
                  <text x={4} y={y + 4} fontSize={10} fill="var(--teacher-axis)">
                    {t("bandLabel", {value: tick.toFixed(1)})}
                  </text>
                </g>
              );
            })}

            {activePoint ? <line x1={activePoint.x} y1={chart.top} x2={activePoint.x} y2={chart.baseline} stroke="var(--teacher-grid)" strokeDasharray="4 6" /> : null}

            <path d={chart.areaPath} fill="url(#teacher-progress-fill)" />
            <path d={chart.linePath} fill="none" stroke="var(--teacher-line)" strokeWidth="3" strokeLinecap="round" />

            {chart.points.map((point, index) => {
              const active = index === safeActiveIndex;

              return (
              <g key={`teacher-point-${teacherProgressPoints[index].month}`} onMouseEnter={() => setActiveIndex(index)} className="cursor-pointer">
                <rect x={point.x - chart.plotWidth / Math.max(6, teacherProgressPoints.length * 1.25)} y={chart.top} width={chart.plotWidth / Math.max(3, teacherProgressPoints.length)} height={chart.plotHeight + 12} fill="transparent" />
                {active ? <circle cx={point.x} cy={point.y} r="10" fill="var(--teacher-dot)" opacity="0.2" /> : null}
                <circle cx={point.x} cy={point.y} r={active ? 5.5 : 4.2} fill={active ? "var(--teacher-dot)" : "var(--teacher-line)"} />
                <text x={point.x} y={chart.baseline + 24} fontSize={11} fill={active ? "var(--teacher-dot)" : "var(--teacher-axis)"} textAnchor="middle">
                  {t(`months.${teacherProgressPoints[index].month as TeacherProgressMonthKey}`)}
                </text>
              </g>
            )})}
          </svg>

          {activePoint && activeData ? (
            <ChartTooltip
              label={t(`months.${activeData.month as TeacherProgressMonthKey}`)}
              value={activeData.value}
              style={{
                left: `${clamp((activePoint.x / chart.width) * 100, 15, 80)}%`,
                top: `${clamp((activePoint.y / chart.height) * 100, 12, 74)}%`
              }}
            />
          ) : null}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
