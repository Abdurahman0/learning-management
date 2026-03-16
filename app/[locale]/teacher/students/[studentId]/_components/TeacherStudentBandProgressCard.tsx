"use client";

import {useMemo, useState, type CSSProperties} from "react";
import {TrendingUp} from "lucide-react";
import {useTranslations} from "next-intl";

import {ChartContainer} from "@/components/ui/chart";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {TeacherStudentBandProgressPoint} from "@/types/teacher";

type TeacherStudentBandProgressCardProps = {
  points: TeacherStudentBandProgressPoint[];
};

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

  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = index === 0 ? points[index] : points[index - 1];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = index + 2 < points.length ? points[index + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

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
      className="pointer-events-none absolute z-20 w-38 rounded-xl border border-[rgba(148,163,184,0.18)] bg-background/95 px-3.5 py-2.5 shadow-lg backdrop-blur-md max-sm:w-32 max-sm:rounded-lg max-sm:px-2.5 max-sm:py-1.5"
      style={style}
    >
      <p className="text-xs text-muted-foreground max-sm:text-[10px]">{label}</p>
      <p className="mt-1 text-sm font-semibold max-sm:mt-0.5 max-sm:text-xs">{value.toFixed(1)}</p>
    </div>
  );
}

export function TeacherStudentBandProgressCard({points}: TeacherStudentBandProgressCardProps) {
  const t = useTranslations("teacherStudentProfile");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chart = useMemo(() => {
    const width = 720;
    const height = 340;
    const left = 36;
    const right = 12;
    const top = 18;
    const bottom = 42;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const baseline = top + plotHeight;

    const min = Math.floor((Math.min(...points.map((item) => item.band)) - 0.4) * 2) / 2;
    const max = Math.ceil((Math.max(...points.map((item) => item.band)) + 0.4) * 2) / 2;
    const safeRange = max - min || 1;

    const mapX = (index: number) => left + (index * plotWidth) / Math.max(1, points.length - 1);
    const mapY = (value: number) => top + ((max - value) / safeRange) * plotHeight;

    const projected = points.map((item, index) => ({x: mapX(index), y: mapY(item.band)}));
    const linePath = createSmoothLine(projected);
    const areaPath = `${linePath} L ${projected[projected.length - 1].x} ${baseline} L ${projected[0].x} ${baseline} Z`;
    const yTicks = [0, 1, 2, 3].map((step) => max - (safeRange * step) / 3);

    return {width, height, left, right, top, plotWidth, plotHeight, baseline, projected, yTicks, linePath, areaPath};
  }, [points]);

  const safeActiveIndex = activeIndex !== null && activeIndex >= 0 && activeIndex < points.length ? activeIndex : null;
  const activePoint = safeActiveIndex === null ? null : chart.projected[safeActiveIndex];
  const activeData = safeActiveIndex === null ? null : points[safeActiveIndex];

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pt-7 pb-2">
        <CardTitle className="inline-flex items-center gap-2 text-xl">
          <TrendingUp className="size-4.5 text-primary" />
          {t("bandScoreProgress")}
        </CardTitle>
        <span className="inline-flex rounded-full border border-border/70 bg-background/45 px-2.5 py-1 text-xs text-muted-foreground">
          {t("last6Months")}
        </span>
      </CardHeader>

      <CardContent className="pt-2 pb-5">
        <ChartContainer className="relative overflow-x-hidden rounded-xl border border-border/65 bg-background/35 p-2 [--band-line:#3867FF] [--band-dot:#4F7BFF] [--band-grid:rgba(148,163,184,0.14)] [--band-axis:#64748B] [--band-top:rgba(56,103,255,0.24)] [--band-bottom:rgba(56,103,255,0.03)] dark:[--band-line:#5E83FF] dark:[--band-dot:#81A0FF] dark:[--band-grid:rgba(148,163,184,0.12)] dark:[--band-axis:rgba(203,213,225,0.72)] dark:[--band-top:rgba(94,131,255,0.30)] dark:[--band-bottom:rgba(94,131,255,0.05)]">
          <svg
            viewBox={`0 0 ${chart.width} ${chart.height}`}
            className="h-auto w-full"
            onMouseLeave={() => setActiveIndex(null)}
          >
            <defs>
              <linearGradient id="student-band-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--band-top)" />
                <stop offset="100%" stopColor="var(--band-bottom)" />
              </linearGradient>
            </defs>

            {chart.yTicks.map((tick, index) => {
              const y = chart.top + (index * chart.plotHeight) / Math.max(1, chart.yTicks.length - 1);

              return (
                <g key={`grid-${tick}`}>
                  <line x1={chart.left} y1={y} x2={chart.width - chart.right} y2={y} stroke="var(--band-grid)" strokeDasharray="4 5" />
                  <text x={4} y={y + 4} fontSize={10} fill="var(--band-axis)">
                    {tick.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {activePoint ? (
              <line x1={activePoint.x} y1={chart.top} x2={activePoint.x} y2={chart.baseline} stroke="var(--band-grid)" strokeDasharray="4 6" />
            ) : null}

            <path d={chart.areaPath} fill="url(#student-band-fill)" />
            <path d={chart.linePath} fill="none" stroke="var(--band-line)" strokeWidth="3" strokeLinecap="round" />

            {chart.projected.map((point, index) => {
              const active = index === safeActiveIndex;

              return (
                <g key={points[index].id} onMouseEnter={() => setActiveIndex(index)} className="cursor-pointer">
                  <rect
                    x={point.x - chart.plotWidth / Math.max(6, points.length * 1.25)}
                    y={chart.top}
                    width={chart.plotWidth / Math.max(3, points.length)}
                    height={chart.plotHeight + 12}
                    fill="transparent"
                  />
                  {active ? <circle cx={point.x} cy={point.y} r="10" fill="var(--band-dot)" opacity="0.2" /> : null}
                  <circle cx={point.x} cy={point.y} r={active ? 5.5 : 4.2} fill={active ? "var(--band-dot)" : "var(--band-line)"} />
                  <text x={point.x} y={chart.baseline + 24} fontSize={11} fill={active ? "var(--band-dot)" : "var(--band-axis)"} textAnchor="middle">
                    {t(`progressLabels.${points[index].label}`)}
                  </text>
                </g>
              );
            })}
          </svg>

          {activePoint && activeData ? (
            <ChartTooltip
              label={t(`progressLabels.${activeData.label}`)}
              value={activeData.band}
              style={{
                left: `${clamp((activePoint.x / chart.width) * 100, 16, 84)}%`,
                top: `${clamp((activePoint.y / chart.height) * 100, 12, 74)}%`,
                transform: "translate(-50%, -112%)"
              }}
            />
          ) : null}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
