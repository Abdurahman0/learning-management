"use client";

import {useMemo, useState} from "react";
import {useTranslations} from "next-intl";

import {ChartContainer} from "@/components/ui/chart";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {ScoreTrendPoint} from "@/data/admin-analytics";

type StudentScoreTrendChartProps = {
  points: ScoreTrendPoint[];
};

type Point = {
  x: number;
  y: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createSmoothLine(points: Point[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

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

export function StudentScoreTrendChart({points}: StudentScoreTrendChartProps) {
  const t = useTranslations("adminAnalytics");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chart = useMemo(() => {
    const width = 660;
    const height = 310;
    const left = 38;
    const right = 16;
    const top = 18;
    const bottom = 44;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;

    const values = points.flatMap((point) => [point.reading, point.listening]);
    const minValue = Math.min(...values) - 0.35;
    const maxValue = Math.max(...values) + 0.3;
    const safeMax = Math.max(maxValue, minValue + 0.5);

    const mapX = (index: number) => (points.length <= 1 ? left : left + (index * plotWidth) / (points.length - 1));
    const mapY = (value: number) => top + ((safeMax - value) / (safeMax - minValue)) * plotHeight;

    const readingPoints = points.map((point, index) => ({x: mapX(index), y: mapY(point.reading)}));
    const listeningPoints = points.map((point, index) => ({x: mapX(index), y: mapY(point.listening)}));
    const yTicks = [0, 1, 2, 3, 4].map((index) => minValue + ((safeMax - minValue) * index) / 4);

    return {
      width,
      height,
      left,
      right,
      top,
      bottom,
      plotWidth,
      plotHeight,
      yTicks,
      readingPoints,
      listeningPoints,
      readingPath: createSmoothLine(readingPoints),
      listeningPath: createSmoothLine(listeningPoints)
    };
  }, [points]);

  const activePoint = activeIndex === null ? null : points[activeIndex];
  const activeX = activeIndex === null ? null : chart.readingPoints[activeIndex]?.x ?? null;
  const activeY =
    activeIndex === null
      ? null
      : Math.min(chart.readingPoints[activeIndex]?.y ?? Number.MAX_SAFE_INTEGER, chart.listeningPoints[activeIndex]?.y ?? Number.MAX_SAFE_INTEGER);

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0 [--trend-reading:#2F5BFF] [--trend-listening:#8B9CFF] [--trend-grid:rgba(148,163,184,0.18)] [--trend-axis:#64748B] dark:[--trend-reading:#5B7CFF] dark:[--trend-listening:#A5B4FF] dark:[--trend-grid:rgba(148,163,184,0.12)] dark:[--trend-axis:rgba(203,213,225,0.72)]">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pt-5 pb-2">
        <CardTitle className="text-lg font-semibold tracking-tight">{t("studentScoreTrend")}</CardTitle>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[var(--trend-reading)]" />
            {t("legend.reading")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[var(--trend-listening)]" />
            {t("legend.listening")}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-1 pb-5">
        <ChartContainer className="relative overflow-x-hidden">
          <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="h-auto w-full" onMouseLeave={() => setActiveIndex(null)}>
            {chart.yTicks.map((tick) => {
              const y = chart.top + ((chart.yTicks[chart.yTicks.length - 1] - tick) / (chart.yTicks[chart.yTicks.length - 1] - chart.yTicks[0])) * chart.plotHeight;
              return (
                <g key={`score-grid-${tick}`}>
                  <line x1={chart.left} y1={y} x2={chart.width - chart.right} y2={y} stroke="var(--trend-grid)" strokeDasharray="4 5" />
                  <text x={6} y={y + 3} fontSize={10} fill="var(--trend-axis)">
                    {tick.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {activeX !== null ? (
              <line x1={activeX} y1={chart.top} x2={activeX} y2={chart.height - chart.bottom} stroke="var(--trend-grid)" strokeDasharray="3 5" />
            ) : null}

            <path d={chart.readingPath} fill="none" stroke="var(--trend-reading)" strokeWidth="2.7" strokeLinecap="round" />
            <path d={chart.listeningPath} fill="none" stroke="var(--trend-listening)" strokeWidth="2.7" strokeLinecap="round" />

            {points.map((item, index) => {
              const x = chart.readingPoints[index].x;
              const readingY = chart.readingPoints[index].y;
              const listeningY = chart.listeningPoints[index].y;
              const active = activeIndex === index;
              return (
                <g key={`trend-x-${item.label}`} onMouseEnter={() => setActiveIndex(index)} className="cursor-pointer">
                  <rect
                    x={x - chart.plotWidth / (points.length * 1.7)}
                    y={chart.top}
                    width={chart.plotWidth / Math.max(points.length, 1)}
                    height={chart.plotHeight + 12}
                    fill="transparent"
                  />
                  <circle cx={x} cy={readingY} r={active ? 4.8 : 3.6} fill="var(--trend-reading)" />
                  <circle cx={x} cy={listeningY} r={active ? 4.8 : 3.6} fill="var(--trend-listening)" />
                  <text x={x} y={chart.height - 14} fontSize={11} fill="var(--trend-axis)" textAnchor="middle">
                    {item.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {activePoint && activeX !== null && activeY !== null ? (
            <div
              className="pointer-events-none absolute z-20 min-w-[190px] rounded-xl border border-[rgba(148,163,184,0.18)] bg-white px-4 py-3 shadow-sm dark:border-[rgba(148,163,184,0.16)] dark:bg-[#0F172A]"
              style={{
                left: `${clamp((activeX / chart.width) * 100, 17, 83)}%`,
                top: `${clamp((activeY / chart.height) * 100, 10, 68)}%`,
                transform: "translate(-50%, -110%)"
              }}
            >
              <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{activePoint.label}</p>
              <div className="mt-1.5 space-y-1.5 text-xs">
                <p className="flex items-center justify-between gap-3 text-[#64748B] dark:text-[rgba(203,213,225,0.7)]">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[var(--trend-reading)]" />
                    {t("legend.reading")}
                  </span>
                  <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{activePoint.reading.toFixed(1)}</span>
                </p>
                <p className="flex items-center justify-between gap-3 text-[#64748B] dark:text-[rgba(203,213,225,0.7)]">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[var(--trend-listening)]" />
                    {t("legend.listening")}
                  </span>
                  <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{activePoint.listening.toFixed(1)}</span>
                </p>
              </div>
            </div>
          ) : null}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
