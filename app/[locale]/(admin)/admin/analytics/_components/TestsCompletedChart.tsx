"use client";

import {useMemo, useState} from "react";
import {useTranslations} from "next-intl";

import {ChartContainer} from "@/components/ui/chart";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {DailyCompletion} from "@/data/admin-analytics";

type TestsCompletedChartProps = {
  points: DailyCompletion[];
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createTopRoundedBarPath(x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height);
  const right = x + width;
  const bottom = y + height;

  return [
    `M ${x} ${bottom}`,
    `L ${x} ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    `L ${right - r} ${y}`,
    `Q ${right} ${y} ${right} ${y + r}`,
    `L ${right} ${bottom}`,
    "Z"
  ].join(" ");
}

export function TestsCompletedChart({points}: TestsCompletedChartProps) {
  const t = useTranslations("adminAnalytics");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const average = useMemo(
    () => (points.length ? Math.round(points.reduce((sum, point) => sum + point.value, 0) / points.length) : 0),
    [points]
  );

  const chart = useMemo(() => {
    const width = 660;
    const height = 310;
    const left = 36;
    const right = 16;
    const top = 18;
    const bottom = 44;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const max = Math.max(...points.map((point) => point.value), 1) * 1.08;
    const groupWidth = plotWidth / points.length;
    const barWidth = Math.min(34, groupWidth * 0.48);
    const mapY = (value: number) => top + (1 - value / max) * plotHeight;
    const yTicks = [0.25, 0.5, 0.75, 1].map((step) => max * step);

    return {
      width,
      height,
      left,
      right,
      top,
      bottom,
      plotWidth,
      plotHeight,
      max,
      groupWidth,
      barWidth,
      yTicks,
      mapY
    };
  }, [points]);

  const activeData = activeIndex === null ? null : points[activeIndex];
  const activeX = activeIndex === null ? null : chart.left + activeIndex * chart.groupWidth + chart.groupWidth / 2;

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0 [--comp-bar:#2F5BFF] [--comp-bar-hover:#1D4ED8] [--comp-grid:rgba(148,163,184,0.18)] [--comp-axis:#64748B] dark:[--comp-bar:#5B7CFF] dark:[--comp-bar-hover:#7C96FF] dark:[--comp-grid:rgba(148,163,184,0.12)] dark:[--comp-axis:rgba(203,213,225,0.72)]">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pt-5 pb-2">
        <CardTitle className="text-lg font-semibold tracking-tight">{t("testsCompletedPerDay")}</CardTitle>
        <p className="text-xs text-muted-foreground">{t("dailyAverage", {value: average.toLocaleString()})}</p>
      </CardHeader>
      <CardContent className="pt-1 pb-5">
        <ChartContainer className="relative overflow-x-hidden">
          <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="h-auto w-full" onMouseLeave={() => setActiveIndex(null)}>
            {chart.yTicks.map((tick, tickIndex) => {
              const y = chart.mapY(tick);
              return (
                <g key={`completion-grid-${tick}-${tickIndex}`}>
                  <line x1={chart.left} y1={y} x2={chart.width - chart.right} y2={y} stroke="var(--comp-grid)" strokeDasharray="4 5" />
                  <text x={6} y={y + 3} fontSize={10} fill="var(--comp-axis)">
                    {Math.round(tick).toLocaleString()}
                  </text>
                </g>
              );
            })}

            {points.map((item, index) => {
              const groupStart = chart.left + index * chart.groupWidth;
              const centerX = groupStart + chart.groupWidth / 2;
              const topY = chart.mapY(item.value);
              const barX = centerX - chart.barWidth / 2;
              const barHeight = chart.top + chart.plotHeight - topY;
              const active = activeIndex === index;
              const fillColor = active ? "var(--comp-bar-hover)" : "var(--comp-bar)";
              return (
                <g key={`completion-bar-${item.day}-${index}`} onMouseEnter={() => setActiveIndex(index)} className="cursor-pointer">
                  <path d={createTopRoundedBarPath(barX, topY, chart.barWidth, barHeight, 8)} fill={fillColor} style={{transition: "fill 180ms ease"}} />
                  <text x={centerX} y={chart.height - 14} fontSize={11} fill="var(--comp-axis)" textAnchor="middle">
                    {item.day}
                  </text>
                </g>
              );
            })}
          </svg>

          {activeData && activeX !== null ? (
            <div
              className="pointer-events-none absolute z-20 min-w-[170px] rounded-xl border border-[rgba(148,163,184,0.18)] bg-white px-4 py-3 shadow-sm dark:border-[rgba(148,163,184,0.16)] dark:bg-[#0F172A] max-sm:min-w-[140px] max-sm:rounded-lg max-sm:px-2.5 max-sm:py-1.5"
              style={{
                left: `${clamp((activeX / chart.width) * 100, 16, 84)}%`,
                top: "10%",
                transform: "translateX(-50%)"
              }}
            >
              <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC] max-sm:text-xs">{activeData.day}</p>
              <p className="mt-1.5 flex items-center justify-between gap-2 text-xs text-[#64748B] dark:text-[rgba(203,213,225,0.7)] max-sm:mt-1 max-sm:gap-1.5 max-sm:text-[10px]">
                <span className="inline-flex items-center gap-1.5 max-sm:gap-1">
                  <span className="size-2 rounded-full bg-[var(--comp-bar)]" />
                  {t("legend.academic")}
                </span>
                <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] max-sm:text-[10px]">{activeData.value.toLocaleString()}</span>
              </p>
            </div>
          ) : null}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
