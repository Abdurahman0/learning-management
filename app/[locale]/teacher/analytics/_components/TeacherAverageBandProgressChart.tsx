"use client";

import {useMemo, useState, type CSSProperties} from "react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ChartContainer} from "@/components/ui/chart";
import type {TeacherAnalyticsPeriod, TeacherBandProgressPoint} from "@/data/teacher/selectors";

type TeacherAverageBandProgressChartProps = {
  period: TeacherAnalyticsPeriod;
  points: TeacherBandProgressPoint[];
  onChangePeriod: (period: TeacherAnalyticsPeriod) => void;
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

const IELTS_MIN_BAND = 5;
const IELTS_MAX_BAND = 9;

type TooltipProps = {
  style: CSSProperties;
  label: string;
  value: number;
};

function ChartTooltip({style, label, value}: TooltipProps) {
  return (
    <div
      className="pointer-events-none absolute z-20 w-[152px] rounded-xl border border-[rgba(148,163,184,0.18)] bg-background/95 px-3.5 py-2.5 shadow-lg backdrop-blur-md max-md:w-[108px] max-md:rounded-lg max-md:px-2 max-md:py-1"
      style={style}
    >
      <p className="text-xs text-muted-foreground max-md:text-[9px]">{label}</p>
      <p className="mt-1 text-sm font-semibold max-md:mt-0.5 max-md:text-[11px]">{value.toFixed(1)}</p>
    </div>
  );
}

export function TeacherAverageBandProgressChart({
  period,
  points,
  onChangePeriod
}: TeacherAverageBandProgressChartProps) {
  const t = useTranslations("teacherAnalytics");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chart = useMemo(() => {
    const width = 760;
    const height = 336;
    const left = 38;
    const right = 14;
    const top = 20;
    const bottom = 42;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const baseline = top + plotHeight;

    const safeRange = IELTS_MAX_BAND - IELTS_MIN_BAND;

    const mapX = (index: number) => {
      if (points.length <= 1) {
        return left;
      }

      return left + (index * plotWidth) / (points.length - 1);
    };
    const mapY = (value: number) =>
      top
      + ((IELTS_MAX_BAND - Math.min(IELTS_MAX_BAND, Math.max(IELTS_MIN_BAND, value))) / safeRange) * plotHeight;
    const plotPoints = points.map((point, index) => ({x: mapX(index), y: mapY(point.value)}));
    const linePath = createSmoothLine(plotPoints);
    const areaPath = `${linePath} L ${plotPoints[plotPoints.length - 1]?.x ?? 0} ${baseline} L ${plotPoints[0]?.x ?? 0} ${baseline} Z`;
    const yTicks = Array.from({length: 9}, (_, index) => IELTS_MAX_BAND - index * 0.5);

    return {
      width,
      height,
      left,
      right,
      top,
      plotWidth,
      plotHeight,
      baseline,
      points: plotPoints,
      yTicks,
      linePath,
      areaPath
    };
  }, [points]);

  const safeActiveIndex = activeIndex !== null && activeIndex >= 0 && activeIndex < points.length ? activeIndex : null;
  const activePoint = safeActiveIndex === null ? null : chart.points[safeActiveIndex];
  const activeData = safeActiveIndex === null ? null : points[safeActiveIndex];

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pt-7 pb-3">
        <div>
          <CardTitle className="text-2xl">{t("averageBandScoreProgress")}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{t("monthlyImprovementOverview")}</p>
        </div>

        <div className="inline-flex rounded-xl border border-border/70 bg-background/45 p-1">
          <Button
            type="button"
            size="sm"
            variant={period === "monthly" ? "default" : "ghost"}
            className="h-8 rounded-lg px-3"
            onClick={() => onChangePeriod("monthly")}
          >
            {t("monthly")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={period === "weekly" ? "default" : "ghost"}
            className="h-8 rounded-lg px-3"
            onClick={() => onChangePeriod("weekly")}
          >
            {t("weekly")}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-1.5 pb-5">
        <ChartContainer className="relative overflow-x-hidden rounded-xl border border-border/65 bg-background/35 p-2 [--analytics-line:#3867FF] [--analytics-dot:#4F7BFF] [--analytics-grid:rgba(148,163,184,0.14)] [--analytics-axis:#64748B] [--analytics-area-top:rgba(56,103,255,0.24)] [--analytics-area-bottom:rgba(56,103,255,0.03)] dark:[--analytics-line:#5E83FF] dark:[--analytics-dot:#81A0FF] dark:[--analytics-grid:rgba(148,163,184,0.12)] dark:[--analytics-axis:rgba(203,213,225,0.72)] dark:[--analytics-area-top:rgba(94,131,255,0.30)] dark:[--analytics-area-bottom:rgba(94,131,255,0.05)]">
          <svg
            viewBox={`0 0 ${chart.width} ${chart.height}`}
            className="h-auto w-full"
            onMouseLeave={() => setActiveIndex(null)}
          >
            <defs>
              <linearGradient id="teacher-analytics-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--analytics-area-top)" />
                <stop offset="100%" stopColor="var(--analytics-area-bottom)" />
              </linearGradient>
            </defs>

            {chart.yTicks.map((tick, index) => {
              const y = chart.top + (index * chart.plotHeight) / Math.max(1, chart.yTicks.length - 1);

              return (
                <g key={`analytics-grid-${tick}`}>
                  <line x1={chart.left} y1={y} x2={chart.width - chart.right} y2={y} stroke="var(--analytics-grid)" strokeDasharray="4 5" />
                  <text x={4} y={y + 4} fontSize={10} fill="var(--analytics-axis)">
                    {tick.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {activePoint ? (
              <line x1={activePoint.x} y1={chart.top} x2={activePoint.x} y2={chart.baseline} stroke="var(--analytics-grid)" strokeDasharray="4 6" />
            ) : null}

            <path d={chart.areaPath} fill="url(#teacher-analytics-fill)" />
            <path d={chart.linePath} fill="none" stroke="var(--analytics-line)" strokeWidth="3" strokeLinecap="round" />

            {chart.points.map((point, index) => {
              const active = index === safeActiveIndex;
              const item = points[index];
              const labelKey = `labels.${item.label}`;
              const label = t.has(labelKey) ? t(labelKey) : item.label;

              return (
                <g key={`analytics-point-${item.id}`} onMouseEnter={() => setActiveIndex(index)} className="cursor-pointer">
                  <rect
                    x={point.x - chart.plotWidth / Math.max(6, points.length * 1.25)}
                    y={chart.top}
                    width={chart.plotWidth / Math.max(3, points.length)}
                    height={chart.plotHeight + 12}
                    fill="transparent"
                  />
                  {active ? <circle cx={point.x} cy={point.y} r="10" fill="var(--analytics-dot)" opacity="0.2" /> : null}
                  <circle cx={point.x} cy={point.y} r={active ? 5.5 : 4.2} fill={active ? "var(--analytics-dot)" : "var(--analytics-line)"} />
                  <text x={point.x} y={chart.baseline + 24} fontSize={11} fill={active ? "var(--analytics-dot)" : "var(--analytics-axis)"} textAnchor="middle">
                    {label}
                  </text>
                </g>
              );
            })}
          </svg>

          {activePoint && activeData ? (
            <ChartTooltip
              label={t.has(`labels.${activeData.label}`) ? t(`labels.${activeData.label}`) : activeData.label}
              value={activeData.value}
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
