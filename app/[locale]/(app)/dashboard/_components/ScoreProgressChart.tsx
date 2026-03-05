"use client";

import {useMemo, useState} from "react";
import {useTranslations} from "next-intl";

import {ChartContainer} from "@/components/ui/chart";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import type {ScorePoint} from "@/data/dashboard-demo";

type ScoreProgressChartProps = {
  points: ScorePoint[];
};

const CHART_MIN = 6;
const CHART_MAX = 8;

export function ScoreProgressChart({points}: ScoreProgressChartProps) {
  const t = useTranslations("dashboard");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [period, setPeriod] = useState("3m");

  const chart = useMemo(() => {
    const width = 760;
    const height = 220;
    const leftPad = 34;
    const rightPad = 18;
    const topPad = 16;
    const bottomPad = 32;
    const plotW = width - leftPad - rightPad;
    const plotH = height - topPad - bottomPad;
    const step = points.length > 1 ? plotW / (points.length - 1) : plotW;
    const mapX = (i: number) => leftPad + i * step;
    const mapY = (value: number) => topPad + ((CHART_MAX - value) / (CHART_MAX - CHART_MIN)) * plotH;
    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${mapX(i)} ${mapY(p.band)}`).join(" ");
    const areaPath = `${linePath} L ${mapX(points.length - 1)} ${topPad + plotH} L ${mapX(0)} ${topPad + plotH} Z`;
    const yTicks = [8, 7.5, 7, 6.5, 6];

    return {width, height, leftPad, topPad, plotH, yTicks, mapX, mapY, linePath, areaPath};
  }, [points]);

  const hovered = hoveredIndex === null ? null : points[hoveredIndex];
  const tooltipLeftPct =
    hoveredIndex === null ? 50 : Math.min(92, Math.max(8, (chart.mapX(hoveredIndex) / chart.width) * 100));

  return (
    <Card className="min-w-0 rounded-2xl border-border/70 bg-card/70">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="min-w-0">
          <CardTitle>{t("scoreProgress.title")}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{t("scoreProgress.subtitle")}</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1m">{t("filters.lastMonth")}</SelectItem>
            <SelectItem value="3m">{t("filters.last3Months")}</SelectItem>
            <SelectItem value="6m">{t("filters.last6Months")}</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <ChartContainer className="relative overflow-x-hidden">
          <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="h-auto w-full">
            <defs>
              <linearGradient id="score-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(59 130 246 / 0.35)" />
                <stop offset="100%" stopColor="rgb(59 130 246 / 0.03)" />
              </linearGradient>
            </defs>

            {chart.yTicks.map((tick) => {
              const y = chart.mapY(tick);
              return (
                <g key={tick}>
                  <line x1={chart.leftPad} y1={y} x2={chart.width - 18} y2={y} stroke="hsl(var(--border))" strokeDasharray="4 4" />
                  <text x={6} y={y + 4} fontSize={11} fill="hsl(var(--muted-foreground))">
                    {tick.toFixed(1)}
                  </text>
                </g>
              );
            })}

            <path d={chart.areaPath} fill="url(#score-area)" />
            <path d={chart.linePath} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" />

            {points.map((point, i) => {
              const x = chart.mapX(i);
              const y = chart.mapY(point.band);
              const active = hoveredIndex === i;
              return (
                <g key={point.label} onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)} className="cursor-pointer">
                  <circle cx={x} cy={y} r={active ? 5 : 4} fill="hsl(var(--primary))" />
                  {active ? <circle cx={x} cy={y} r={10} fill="rgb(59 130 246 / 0.18)" /> : null}
                  <text x={x} y={chart.topPad + chart.plotH + 22} fontSize={11} fill="hsl(var(--muted-foreground))" textAnchor="middle">
                    {point.label}
                  </text>
                  <title>{`${point.label}: ${point.band.toFixed(1)}`}</title>
                </g>
              );
            })}
          </svg>

          {hoveredIndex !== null && hovered ? (
            <div
              className="pointer-events-none absolute top-2 -translate-x-1/2 rounded-md border border-border bg-popover px-2 py-1 text-xs shadow-sm"
              style={{left: `${tooltipLeftPct}%`}}
            >
              <p className="font-medium">{hovered.label}</p>
              <p className="text-muted-foreground">Band {hovered.band.toFixed(1)}</p>
            </div>
          ) : null}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
