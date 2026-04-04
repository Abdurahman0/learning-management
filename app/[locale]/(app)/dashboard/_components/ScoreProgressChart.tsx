"use client";

import {useMemo, useState, useId} from "react";
import {useTranslations} from "next-intl";

import {ChartContainer} from "@/components/ui/chart";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import type {ScorePoint} from "@/data/student/dashboard";

type ScoreProgressChartProps = {
  points: ScorePoint[];
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

export function ScoreProgressChart({points}: ScoreProgressChartProps) {
  const t = useTranslations("dashboard");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [period, setPeriod] = useState<"1m" | "3m" | "6m">("3m");
  const gradientId = useId().replace(/:/g, "");

  const visiblePoints = useMemo(() => {
    if (period === "1m") return points.slice(-4);
    if (period === "3m") return points.slice(-7);
    return points;
  }, [period, points]);

  const safeHoveredIndex =
    hoveredIndex !== null && hoveredIndex < visiblePoints.length ? hoveredIndex : null;
  const hasPoints = visiblePoints.length > 0;

  const chart = useMemo(() => {
    const width = 760;
    const height = 250;
    const leftPad = 36;
    const rightPad = 20;
    const topPad = 20;
    const bottomPad = 38;
    const plotW = width - leftPad - rightPad;
    const plotH = height - topPad - bottomPad;
    const step = hasPoints && visiblePoints.length > 1 ? plotW / (visiblePoints.length - 1) : plotW;
    const mapX = (i: number) => leftPad + i * step;
    const values = hasPoints ? visiblePoints.map((point) => point.band) : [0];
    const minRaw = Math.min(...values);
    const maxRaw = Math.max(...values);
    const range = Math.max(0.35, maxRaw - minRaw);
    const min = Math.max(5, Math.floor((minRaw - range * 0.42) * 2) / 2);
    const max = Math.min(9, Math.ceil((maxRaw + range * 0.42) * 2) / 2);
    const safeMax = max === min ? max + 0.5 : max;

    const mapY = (value: number) => topPad + ((safeMax - value) / (safeMax - min)) * plotH;
    const cartesian = visiblePoints.map((point, index) => ({x: mapX(index), y: mapY(point.band)}));
    const linePath = createSmoothLine(cartesian);
    const areaPath =
      cartesian.length > 0
        ? `${linePath} L ${cartesian[cartesian.length - 1].x} ${topPad + plotH} L ${cartesian[0].x} ${topPad + plotH} Z`
        : "";
    const yTicks = [0, 1, 2, 3, 4].map((stepIndex) => safeMax - ((safeMax - min) * stepIndex) / 4);

    return {width, height, leftPad, rightPad, topPad, plotH, yTicks, mapX, mapY, linePath, areaPath, cartesian};
  }, [hasPoints, visiblePoints]);

  const active = safeHoveredIndex !== null ? visiblePoints[safeHoveredIndex] : null;
  const trendDelta = visiblePoints.length > 1 ? visiblePoints[visiblePoints.length - 1].band - visiblePoints[0].band : 0;
  const tooltipLeftPct =
    safeHoveredIndex === null ? 50 : clamp((chart.mapX(safeHoveredIndex) / chart.width) * 100, 10, 90);

  return (
    <Card className="min-w-0 rounded-2xl border-border/70 bg-linear-to-b from-card/85 to-blue-500/3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="min-w-0">
          <CardTitle>{t("scoreProgress.title")}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{t("scoreProgress.subtitle")}</p>
          <div className="mt-2 inline-flex items-center rounded-full border border-blue-400/30 bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-300">
            {trendDelta >= 0 ? "+" : ""}
            {trendDelta.toFixed(1)} band
          </div>
        </div>
        <Select value={period} onValueChange={(value) => setPeriod(value as "1m" | "3m" | "6m")}>
          <SelectTrigger className="w-40 rounded-xl border-border/70 bg-background/45">
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
        {hasPoints ? (
          <ChartContainer className="relative overflow-x-hidden rounded-xl border border-border/50 bg-linear-to-b from-blue-500/4 to-transparent p-2 sm:p-3">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_65%_at_50%_-10%,rgba(59,130,246,0.18),transparent_62%)]" />
            <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="h-auto w-full">
            <defs>
              <linearGradient id={`score-area-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(59 130 246 / 0.28)" />
                <stop offset="100%" stopColor="rgb(59 130 246 / 0.02)" />
              </linearGradient>
              <linearGradient id={`score-line-${gradientId}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgb(59 130 246)" />
                <stop offset="100%" stopColor="rgb(96 165 250)" />
              </linearGradient>
            </defs>

            {chart.yTicks.map((tick) => {
              const y = chart.mapY(tick);
              return (
                <g key={tick}>
                  <line
                    x1={chart.leftPad}
                    y1={y}
                    x2={chart.width - chart.rightPad}
                    y2={y}
                    stroke="rgba(148, 163, 184, 0.35)"
                    strokeDasharray="4 5"
                  />
                  <text x={6} y={y + 4} fontSize={11} fill="var(--foreground)" fillOpacity="0.75">
                    {tick.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {safeHoveredIndex !== null ? (
              <line
                x1={chart.mapX(safeHoveredIndex)}
                y1={chart.topPad}
                x2={chart.mapX(safeHoveredIndex)}
                y2={chart.topPad + chart.plotH}
                stroke="rgba(148, 163, 184, 0.55)"
                strokeDasharray="3 5"
              />
            ) : null}

            <path d={chart.areaPath} fill={`url(#score-area-${gradientId})`} />
            <path d={chart.linePath} fill="none" stroke={`url(#score-line-${gradientId})`} strokeWidth="3" strokeLinecap="round" />

              {visiblePoints.map((point, i) => {
                const x = chart.mapX(i);
                const y = chart.mapY(point.band);
                const isActive = safeHoveredIndex === i;
                const showXLabel = visiblePoints.length <= 7 || i % 2 === 0 || i === visiblePoints.length - 1;
                return (
                  <g key={`${point.label}-${i}`} onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)} className="cursor-pointer">
                  <rect x={x - 16} y={chart.topPad} width={32} height={chart.plotH + 12} fill="transparent" />
                  {isActive ? <circle cx={x} cy={y} r={11} fill="rgb(59 130 246 / 0.2)" /> : null}
                  <circle cx={x} cy={y} r={isActive ? 5.2 : 3.8} fill="rgb(59 130 246)" />
                  {showXLabel ? (
                    <text
                      x={x}
                      y={chart.topPad + chart.plotH + 23}
                      fontSize={11}
                      fill="var(--foreground)"
                      fillOpacity={isActive ? "1" : "0.75"}
                      textAnchor="middle"
                    >
                      {point.label}
                    </text>
                  ) : null}
                  <title>{`${point.label}: ${point.band.toFixed(1)}`}</title>
                  </g>
                );
              })}
            </svg>

            {active ? (
              <div
                className="pointer-events-none absolute top-2 -translate-x-1/2 rounded-xl border border-blue-300/25 bg-[#0B1528]/95 px-3 py-2 text-xs shadow-[0_10px_30px_rgba(2,6,23,0.45)]"
                style={{left: `${tooltipLeftPct}%`}}
              >
                <p className="font-semibold text-blue-100">{active.label}</p>
                <p className="text-blue-200/80">Band {active.band.toFixed(1)}</p>
              </div>
            ) : null}
          </ChartContainer>
        ) : (
          <p className="rounded-xl border border-dashed border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">{t("scoreProgress.empty")}</p>
        )}
      </CardContent>
    </Card>
  );
}
