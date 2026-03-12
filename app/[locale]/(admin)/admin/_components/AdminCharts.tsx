"use client";

import {useMemo, useState, type CSSProperties, type ReactNode} from "react";
import {useTranslations} from "next-intl";

import {ChartContainer} from "@/components/ui/chart";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {growthStats, testCompletionStats, type AdminMonthKey} from "@/data/admin-dashboard";

type Point = {
  x: number;
  y: number;
};

type AdminChartCardHeaderProps = {
  title: string;
  subtitle: string;
  rightSlot: ReactNode;
};

type AdminChartTooltipProps = {
  month: string;
  label: string;
  value: string;
  dotColor: string;
  style: CSSProperties;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatCompact(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return `${value}`;
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

  // Catmull-Rom to Bezier conversion: preserves each data point on the final curve.
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

function AdminChartCardHeader({title, subtitle, rightSlot}: AdminChartCardHeaderProps) {
  return (
    <CardHeader className="flex flex-row items-start justify-between gap-3 pt-5 pb-2">
      <div className="space-y-1">
        <CardTitle className="text-lg font-semibold tracking-tight">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {rightSlot}
    </CardHeader>
  );
}

function AdminChartTooltip({month, label, value, dotColor, style}: AdminChartTooltipProps) {
  return (
    <div
      className="pointer-events-none absolute z-20 w-[188px] rounded-xl border border-[rgba(148,163,184,0.18)] bg-white px-4 py-3 dark:border-[rgba(148,163,184,0.16)] dark:bg-[#0F172A] max-sm:w-[146px] max-sm:rounded-lg max-sm:px-2.5 max-sm:py-1.5"
      style={style}
    >
      <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC] max-sm:text-xs">{month}</p>
      <div className="mt-1.5 flex items-center justify-between gap-2.5 max-sm:mt-1 max-sm:gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs text-[#64748B] dark:text-[rgba(203,213,225,0.7)] max-sm:gap-1 max-sm:text-[10px]">
          <span className="size-2 rounded-full" style={{backgroundColor: dotColor}} />
          {label}
        </span>
        <span className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC] max-sm:text-xs">{value}</span>
      </div>
    </div>
  );
}

export function AdminCharts() {
  const t = useTranslations("adminDashboard");
  const [activeGrowthIndex, setActiveGrowthIndex] = useState<number | null>(growthStats.length - 1);
  const [activeAcademicIndex, setActiveAcademicIndex] = useState<number | null>(testCompletionStats.length - 1);

  const palette = {
    lineStroke: "var(--chart-line-stroke)",
    activeDot: "var(--chart-active-dot)",
    areaTop: "var(--chart-area-top)",
    areaBottom: "var(--chart-area-bottom)",
    grid: "var(--chart-grid)",
    axis: "var(--chart-axis)",
    bar: "var(--chart-bar)",
    barHover: "var(--chart-bar-hover)"
  } as const;

  const lineChart = useMemo(() => {
    const width = 650;
    const height = 292;
    const left = 30;
    const right = 16;
    const top = 22;
    const bottom = 38;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const baseline = top + plotHeight;

    const values = growthStats.map((point) => point.users);
    const minRaw = Math.min(...values);
    const maxRaw = Math.max(...values);
    const range = Math.max(1, maxRaw - minRaw);
    const min = Math.max(0, minRaw - range * 0.2);
    const max = maxRaw + range * 0.16;

    const mapX = (index: number) => {
      if (growthStats.length <= 1) {
        return left;
      }

      return left + (index * plotWidth) / (growthStats.length - 1);
    };

    const mapY = (value: number) => top + ((max - value) / (max - min)) * plotHeight;
    const points = growthStats.map((item, index) => ({x: mapX(index), y: mapY(item.users)}));
    const linePath = createSmoothLine(points);
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`;
    const yTicks = [0, 1, 2, 3].map((step) => min + ((max - min) * step) / 3).reverse();

    return {width, height, left, right, top, plotWidth, plotHeight, baseline, points, yTicks, linePath, areaPath};
  }, []);

  const academicChart = useMemo(() => {
    const width = 650;
    const height = 292;
    const left = 30;
    const right = 16;
    const top = 22;
    const bottom = 38;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const baseline = top + plotHeight;
    const maxValue = Math.max(...testCompletionStats.map((item) => item.academic));
    const paddedMax = maxValue * 1.08;

    const groupWidth = plotWidth / testCompletionStats.length;
    const barWidth = Math.min(30, groupWidth * 0.42);
    const mapY = (value: number) => top + (1 - value / paddedMax) * plotHeight;
    const yTicks = [0.25, 0.5, 0.75, 1].map((step) => paddedMax * step);

    return {width, height, left, right, top, plotHeight, baseline, groupWidth, barWidth, mapY, yTicks};
  }, []);

  const activeGrowthPoint = activeGrowthIndex === null ? null : lineChart.points[activeGrowthIndex];
  const activeGrowthData = activeGrowthIndex === null ? null : growthStats[activeGrowthIndex];

  const activeAcademicData = activeAcademicIndex === null ? null : testCompletionStats[activeAcademicIndex];
  const activeAcademicCenter =
    activeAcademicIndex === null ? null : academicChart.left + activeAcademicIndex * academicChart.groupWidth + academicChart.groupWidth / 2;

  return (
    <section className="grid min-w-0 gap-5 xl:grid-cols-2 [--chart-line-stroke:#2F5BFF] [--chart-active-dot:#1D4ED8] [--chart-area-top:rgba(47,91,255,0.22)] [--chart-area-bottom:rgba(47,91,255,0.03)] [--chart-grid:rgba(148,163,184,0.18)] [--chart-axis:#64748B] [--chart-bar:#2F5BFF] [--chart-bar-hover:#1D4ED8] dark:[--chart-line-stroke:#5B7CFF] dark:[--chart-active-dot:#7C96FF] dark:[--chart-area-top:rgba(91,124,255,0.30)] dark:[--chart-area-bottom:rgba(91,124,255,0.05)] dark:[--chart-grid:rgba(148,163,184,0.12)] dark:[--chart-axis:rgba(203,213,225,0.72)] dark:[--chart-bar:#5B7CFF] dark:[--chart-bar-hover:#7C96FF]">
      <Card className="min-w-0 rounded-2xl border-border/70 bg-card/75 py-0">
        <AdminChartCardHeader
          title={t("charts.userGrowth")}
          subtitle={t("charts.last7Months")}
          rightSlot={
            <button
              type="button"
              className="inline-flex h-8 items-center rounded-full border border-border/70 bg-background/55 px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/55 hover:text-foreground"
            >
              {t("charts.filters.last7Months")}
            </button>
          }
        />

        <CardContent className="pt-1.5">
          <ChartContainer className="relative overflow-x-hidden">
            <svg viewBox={`0 0 ${lineChart.width} ${lineChart.height}`} className="h-auto w-full" onMouseLeave={() => setActiveGrowthIndex(null)}>
              <defs>
                <linearGradient id="admin-growth-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={palette.areaTop} />
                  <stop offset="100%" stopColor={palette.areaBottom} />
                </linearGradient>
              </defs>

              {lineChart.yTicks.map((tick) => {
                const y = lineChart.top + ((lineChart.yTicks[0] - tick) / (lineChart.yTicks[0] - lineChart.yTicks[lineChart.yTicks.length - 1])) * lineChart.plotHeight;
                return (
                  <g key={`line-grid-${tick}`}>
                    <line x1={lineChart.left} y1={y} x2={lineChart.width - lineChart.right} y2={y} stroke={palette.grid} strokeDasharray="4 5" />
                    <text x={4} y={y + 3} fontSize={10} fill={palette.axis}>
                      {formatCompact(Math.round(tick))}
                    </text>
                  </g>
                );
              })}

              {activeGrowthPoint ? (
                <line x1={activeGrowthPoint.x} y1={lineChart.top} x2={activeGrowthPoint.x} y2={lineChart.baseline} stroke={palette.grid} strokeDasharray="3 5" />
              ) : null}

              <path d={lineChart.areaPath} fill="url(#admin-growth-fill)" />
              <path d={lineChart.linePath} fill="none" stroke={palette.lineStroke} strokeWidth="2.8" strokeLinecap="round" />

              {lineChart.points.map((point, index) => {
                const active = activeGrowthIndex === index;
                return (
                  <g key={`line-point-${growthStats[index].month}`} onMouseEnter={() => setActiveGrowthIndex(index)} className="cursor-pointer">
                    <rect
                      x={point.x - lineChart.plotWidth / (growthStats.length * 1.2)}
                      y={lineChart.top}
                      width={lineChart.plotWidth / growthStats.length}
                      height={lineChart.plotHeight + 12}
                      fill="transparent"
                    />
                    {active ? <circle cx={point.x} cy={point.y} r="11" fill={palette.activeDot} opacity="0.22" /> : null}
                    <circle cx={point.x} cy={point.y} r={active ? 5.8 : 3.6} fill={active ? palette.activeDot : palette.lineStroke} className="transition-all duration-200" />
                    <text x={point.x} y={lineChart.baseline + 23} fontSize={11} fill={active ? palette.activeDot : palette.axis} textAnchor="middle">
                      {t(`charts.months.${growthStats[index].month as AdminMonthKey}`)}
                    </text>
                  </g>
                );
              })}
            </svg>

            {activeGrowthPoint && activeGrowthData ? (
              <AdminChartTooltip
                month={t(`charts.months.${activeGrowthData.month as AdminMonthKey}`)}
                label={t("charts.userGrowth")}
                value={activeGrowthData.users.toLocaleString()}
                dotColor={palette.lineStroke}
                style={{
                  left: `${clamp((activeGrowthPoint.x / lineChart.width) * 100, 16, 84)}%`,
                  top: `${clamp((activeGrowthPoint.y / lineChart.height) * 100, 14, 74)}%`,
                  transform: "translate(-50%, -108%)"
                }}
              />
            ) : null}
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="min-w-0 rounded-2xl border-border/70 bg-card/75 py-0">
        <AdminChartCardHeader
          title={t("charts.testsCompleted")}
          subtitle={t("charts.last7Months")}
          rightSlot={
            <span className="inline-flex h-7 items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 text-xs font-medium text-primary">
              {t("charts.badges.academic")}
            </span>
          }
        />

        <CardContent className="pt-1.5">
          <ChartContainer className="relative overflow-x-hidden">
            <svg
              viewBox={`0 0 ${academicChart.width} ${academicChart.height}`}
              className="h-auto w-full"
              onMouseLeave={() => setActiveAcademicIndex(null)}
            >
              {academicChart.yTicks.map((tick) => {
                const y = academicChart.mapY(tick);
                return (
                  <g key={`bar-grid-${tick}`}>
                    <line x1={academicChart.left} y1={y} x2={academicChart.width - academicChart.right} y2={y} stroke={palette.grid} strokeDasharray="4 5" />
                    <text x={4} y={y + 3} fontSize={10} fill={palette.axis}>
                      {formatCompact(Math.round(tick))}
                    </text>
                  </g>
                );
              })}

              {testCompletionStats.map((item, index) => {
                const groupStart = academicChart.left + index * academicChart.groupWidth;
                const centerX = groupStart + academicChart.groupWidth / 2;
                const topY = academicChart.mapY(item.academic);
                const barX = centerX - academicChart.barWidth / 2;
                const barHeight = academicChart.baseline - topY;
                const active = activeAcademicIndex === index;
                const fillColor = active ? palette.barHover : palette.bar;

                return (
                  <g key={`bar-${item.month}`} onMouseEnter={() => setActiveAcademicIndex(index)} className="cursor-pointer">
                    <path
                      d={createTopRoundedBarPath(barX, topY, academicChart.barWidth, barHeight, 8)}
                      fill={fillColor}
                      style={{transition: "fill 180ms ease"}}
                    />
                    <text x={centerX} y={academicChart.baseline + 23} fontSize={11} fill={active ? palette.activeDot : palette.axis} textAnchor="middle">
                      {t(`charts.months.${item.month as AdminMonthKey}`)}
                    </text>
                  </g>
                );
              })}
            </svg>

            {activeAcademicData && activeAcademicCenter !== null ? (
              <AdminChartTooltip
                month={t(`charts.months.${activeAcademicData.month as AdminMonthKey}`)}
                label={t("charts.badges.academic")}
                value={activeAcademicData.academic.toLocaleString()}
                dotColor={palette.bar}
                style={{
                  left: `${clamp((activeAcademicCenter / academicChart.width) * 100, 18, 84)}%`,
                  top: "9%",
                  transform: "translateX(-50%)"
                }}
              />
            ) : null}
          </ChartContainer>
        </CardContent>
      </Card>
    </section>
  );
}
