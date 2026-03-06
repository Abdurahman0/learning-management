"use client";

import {useMemo, useState} from "react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ChartContainer} from "@/components/ui/chart";
import type {AchievementChartMode, AchievementTrendPoint} from "@/data/admin-achievements";

type AchievementsTrendChartProps = {
  mode: AchievementChartMode;
  points: AchievementTrendPoint[];
  onModeChange: (mode: AchievementChartMode) => void;
};

type ChartPoint = {
  x: number;
  y: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createSmoothPath(points: ChartPoint[]) {
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

export function AchievementsTrendChart({mode, points, onModeChange}: AchievementsTrendChartProps) {
  const t = useTranslations("adminAchievements");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chart = useMemo(() => {
    const width = 980;
    const height = 318;
    const left = 34;
    const right = 16;
    const top = 18;
    const bottom = 46;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;

    const minValue = Math.min(...points.map((point) => point.value), 0);
    const maxValue = Math.max(...points.map((point) => point.value), 1);
    const safeMin = Math.max(0, minValue - (maxValue - minValue) * 0.1);
    const safeMax = maxValue * 1.12;

    const mapX = (index: number) => (points.length <= 1 ? left : left + (index * plotWidth) / (points.length - 1));
    const mapY = (value: number) => top + ((safeMax - value) / (safeMax - safeMin || 1)) * plotHeight;

    const plottedPoints = points.map((point, index) => ({x: mapX(index), y: mapY(point.value)}));
    const linePath = createSmoothPath(plottedPoints);
    const areaPath =
      plottedPoints.length > 1
        ? `${linePath} L ${plottedPoints[plottedPoints.length - 1].x} ${top + plotHeight} L ${plottedPoints[0].x} ${
            top + plotHeight
          } Z`
        : "";

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((step) => safeMin + (safeMax - safeMin) * step);

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
      points: plottedPoints,
      linePath,
      areaPath
    };
  }, [points]);

  const activePoint = activeIndex === null ? null : points[activeIndex];
  const activeX = activeIndex === null ? null : chart.points[activeIndex]?.x ?? null;
  const activeY = activeIndex === null ? null : chart.points[activeIndex]?.y ?? null;

  return (
    <Card className="rounded-3xl border-border/70 bg-card/75 py-0 [--achv-line:#2F5BFF] [--achv-area-top:rgba(47,91,255,0.20)] [--achv-area-bottom:rgba(47,91,255,0.03)] [--achv-grid:rgba(148,163,184,0.18)] [--achv-axis:#64748B] dark:[--achv-line:#5B7CFF] dark:[--achv-area-top:rgba(91,124,255,0.26)] dark:[--achv-area-bottom:rgba(91,124,255,0.05)] dark:[--achv-grid:rgba(148,163,184,0.12)] dark:[--achv-axis:rgba(203,213,225,0.72)]">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pt-5 pb-2">
        <CardTitle className="text-xl font-semibold tracking-tight">{t("engagementAnalytics")}</CardTitle>
        <div className="inline-flex rounded-xl border border-border/70 bg-background/45 p-1">
          <Button
            type="button"
            size="sm"
            variant={mode === "weekly" ? "default" : "ghost"}
            className="h-8 rounded-lg px-3 text-xs"
            onClick={() => onModeChange("weekly")}
          >
            {t("weekly")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "monthly" ? "default" : "ghost"}
            className="h-8 rounded-lg px-3 text-xs"
            onClick={() => onModeChange("monthly")}
          >
            {t("monthly")}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-1 pb-5">
        <ChartContainer className="relative overflow-x-hidden">
          <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="h-auto w-full" onMouseLeave={() => setActiveIndex(null)}>
            <defs>
              <linearGradient id="achievements-area-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--achv-area-top)" />
                <stop offset="100%" stopColor="var(--achv-area-bottom)" />
              </linearGradient>
            </defs>

            {chart.yTicks.map((tick) => {
              const y = chart.top + ((chart.yTicks[chart.yTicks.length - 1] - tick) / (chart.yTicks[chart.yTicks.length - 1] - chart.yTicks[0])) * chart.plotHeight;
              return (
                <g key={`achv-grid-${tick}`}>
                  <line x1={chart.left} y1={y} x2={chart.width - chart.right} y2={y} stroke="var(--achv-grid)" strokeDasharray="4 5" />
                </g>
              );
            })}

            {activeX !== null ? (
              <line x1={activeX} y1={chart.top} x2={activeX} y2={chart.height - chart.bottom} stroke="var(--achv-grid)" strokeDasharray="3 5" />
            ) : null}

            {chart.areaPath ? <path d={chart.areaPath} fill="url(#achievements-area-fill)" /> : null}
            <path d={chart.linePath} fill="none" stroke="var(--achv-line)" strokeWidth="2.6" strokeLinecap="round" />

            {points.map((point, index) => {
              const x = chart.points[index].x;
              const y = chart.points[index].y;
              const active = activeIndex === index;

              return (
                <g key={`achievement-point-${point.label}`} onMouseEnter={() => setActiveIndex(index)} className="cursor-pointer">
                  <rect
                    x={x - chart.plotWidth / (points.length * 1.8)}
                    y={chart.top}
                    width={chart.plotWidth / Math.max(points.length, 1)}
                    height={chart.plotHeight + 12}
                    fill="transparent"
                  />
                  <circle cx={x} cy={y} r={active ? 5.4 : 3.7} fill="var(--achv-line)" />
                  <text x={x} y={chart.height - 14} fontSize={11} fill={active ? "var(--achv-line)" : "var(--achv-axis)"} textAnchor="middle">
                    {point.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {activePoint && activeX !== null && activeY !== null ? (
            <div
              className="pointer-events-none absolute z-20 min-w-[170px] rounded-xl border border-[rgba(148,163,184,0.18)] bg-white px-4 py-3 shadow-sm dark:border-[rgba(148,163,184,0.16)] dark:bg-[#0F172A]"
              style={{
                left: `${clamp((activeX / chart.width) * 100, 15, 85)}%`,
                top: `${clamp((activeY / chart.height) * 100, 9, 70)}%`,
                transform: "translate(-50%, -110%)"
              }}
            >
              <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{activePoint.label}</p>
              <p className="mt-1.5 flex items-center justify-between gap-2 text-xs text-[#64748B] dark:text-[rgba(203,213,225,0.7)]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[var(--achv-line)]" />
                  {t("earnedLabel")}
                </span>
                <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{activePoint.value.toLocaleString()}</span>
              </p>
            </div>
          ) : null}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
