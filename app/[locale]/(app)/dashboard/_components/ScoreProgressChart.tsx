"use client";

import {useMemo, useId, useState} from "react";
import {useTranslations} from "next-intl";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import {ChartContainer} from "@/components/ui/chart";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import type {ScorePoint} from "@/data/student/dashboard";

type ScoreProgressChartProps = {
  points: ScorePoint[];
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function ScoreProgressChart({points}: ScoreProgressChartProps) {
  const t = useTranslations("dashboard");
  const [period, setPeriod] = useState<"1m" | "3m" | "6m">("3m");
  const gradientId = useId().replace(/:/g, "");

  const visiblePoints = useMemo(() => {
    if (period === "1m") return points.slice(-4);
    if (period === "3m") return points.slice(-7);
    return points;
  }, [period, points]);

  const hasPoints = visiblePoints.length > 0;
  const latestBand = hasPoints ? visiblePoints[visiblePoints.length - 1].band : 0;
  const earliestBand = hasPoints ? visiblePoints[0].band : latestBand;

  const chartMeta = useMemo(() => {
    if (!hasPoints) {
      return {
        yDomain: [0, 9] as [number, number],
        yTicks: [0, 3, 5, 7, 9],
        xInterval: 0
      };
    }

    const values = visiblePoints.map((point) => point.band);
    const minRaw = Math.min(...values);
    const maxRaw = Math.max(...values);

    // Keep the chart readable even with small deltas, but avoid the "floating" effect by clamping.
    const pad = Math.max(0.5, (maxRaw - minRaw) * 0.35);
    let min = clamp(Math.floor((minRaw - pad) * 2) / 2, 0, 9);
    let max = clamp(Math.ceil((maxRaw + pad) * 2) / 2, 0, 9);

    if (min === max) {
      min = clamp(min - 1, 0, 9);
      max = clamp(max + 1, 0, 9);
    }

    const range = Math.max(0.5, max - min);
    const step = range <= 2 ? 0.5 : 1;
    const yTicks = Array.from({length: Math.floor(range / step) + 1}, (_, index) =>
      Number((min + index * step).toFixed(1))
    );

    // Show about 6 ticks max on X to reduce clutter.
    const xInterval = visiblePoints.length <= 7 ? 0 : Math.max(0, Math.ceil(visiblePoints.length / 6) - 1);

    return {
      yDomain: [min, max] as [number, number],
      yTicks,
      xInterval
    };
  }, [hasPoints, visiblePoints]);

  const trendDelta = visiblePoints.length > 1 ? visiblePoints[visiblePoints.length - 1].band - visiblePoints[0].band : 0;
  const trendTone =
    trendDelta > 0.05 ? "up" : trendDelta < -0.05 ? "down" : "flat";
  const trendChipClassName =
    trendTone === "up"
      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
      : trendTone === "down"
        ? "border-rose-400/30 bg-rose-500/10 text-rose-300"
        : "border-blue-400/30 bg-blue-500/10 text-blue-300";

  return (
    <Card className="min-w-0 overflow-hidden rounded-2xl border-border/70 bg-card/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] animate-in fade-in slide-in-from-bottom-2 duration-500">

      <CardHeader className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <CardTitle className="text-xl font-semibold tracking-tight">{t("scoreProgress.title")}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{t("scoreProgress.subtitle")}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {latestBand.toFixed(1)}
              </p>
              <p className="text-sm text-muted-foreground">
                {t.has("scoreProgress.bandLabel") ? t("scoreProgress.bandLabel") : "Band"}
              </p>
            </div>

            <div
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${trendChipClassName}`}
              title={`From ${earliestBand.toFixed(1)} to ${latestBand.toFixed(1)}`}
            >
              {trendDelta >= 0 ? "+" : ""}
              {trendDelta.toFixed(1)} band
            </div>
          </div>
        </div>

        <Select value={period} onValueChange={(value) => setPeriod(value as "1m" | "3m" | "6m")}>
          <SelectTrigger className="w-full rounded-xl border-border/70 bg-background/45 sm:w-44">
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
          <ChartContainer className="overflow-x-auto rounded-xl border border-border/60 bg-background/40 p-3 animate-in fade-in duration-700 delay-150">
            <div className="min-w-[640px]">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={visiblePoints} margin={{top: 12, right: 16, left: 6, bottom: 8}}>
                  <defs>
                    <linearGradient id={`score-area-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(59 130 246 / 0.25)" />
                      <stop offset="100%" stopColor="rgb(59 130 246 / 0.02)" />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 6" stroke="hsl(var(--border))" opacity={0.45} vertical={false} />

                  <XAxis
                    dataKey="label"
                    interval={chartMeta.xInterval}
                    tickLine={false}
                    axisLine={{stroke: "hsl(var(--border))"}}
                    tick={{fill: "hsl(var(--muted-foreground))", fontSize: 12}}
                  />
                  <YAxis
                    domain={chartMeta.yDomain}
                    ticks={chartMeta.yTicks}
                    tickLine={false}
                    axisLine={false}
                    width={36}
                    tick={{fill: "hsl(var(--muted-foreground))", fontSize: 12}}
                    tickFormatter={(value) => Number(value).toFixed(1)}
                  />

                  <Tooltip
                    cursor={{stroke: "hsl(var(--muted-foreground))", strokeDasharray: "3 6", opacity: 0.55}}
                    content={({active, payload, label}) => {
                      if (!active || !payload?.length) return null;
                      const band = Number(payload[0].value ?? 0);
                      return (
                        <div className="rounded-xl border border-border/70 bg-background/95 px-3 py-2 text-xs shadow-lg">
                          <p className="font-semibold text-foreground">{label}</p>
                          <p className="text-muted-foreground">
                            {t.has("scoreProgress.bandLabel") ? t("scoreProgress.bandLabel") : "Band"} {band.toFixed(1)}
                          </p>
                        </div>
                      );
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="band"
                    stroke="transparent"
                    fill={`url(#score-area-${gradientId})`}
                    isAnimationActive
                    animationDuration={650}
                  />
                  <Line
                    type="monotone"
                    dataKey="band"
                    stroke="rgb(59 130 246)"
                    strokeWidth={3}
                    dot={{r: 3.5, strokeWidth: 2, stroke: "rgb(59 130 246 / 0.35)", fill: "rgb(59 130 246)"}}
                    activeDot={{r: 5.25, stroke: "rgb(59 130 246)", strokeWidth: 2, fill: "hsl(var(--background))"}}
                    isAnimationActive
                    animationDuration={650}
                  />

                  <ReferenceDot
                    x={visiblePoints[visiblePoints.length - 1]?.label}
                    y={latestBand}
                    r={6}
                    fill="hsl(var(--background))"
                    stroke="rgb(59 130 246)"
                    strokeWidth={2}
                    label={{value: "Latest", position: "top", fill: "hsl(var(--muted-foreground))", fontSize: 12}}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartContainer>
        ) : (
          <p className="rounded-xl border border-dashed border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">{t("scoreProgress.empty")}</p>
        )}
      </CardContent>
    </Card>
  );
}
