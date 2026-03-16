"use client";

import {useMemo, useState, type CSSProperties} from "react";
import {useTranslations} from "next-intl";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ChartContainer} from "@/components/ui/chart";
import type {TeacherModuleDifficultyValue} from "@/data/teacher/selectors";

type TeacherModuleDifficultyChartProps = {
  items: TeacherModuleDifficultyValue[];
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

type BarTooltipProps = {
  style: CSSProperties;
  label: string;
  value: number;
};

function BarTooltip({style, label, value}: BarTooltipProps) {
  const t = useTranslations("teacherWeakAreas");

  return (
    <div
      className="pointer-events-none absolute z-20 w-44 rounded-xl border border-[rgba(148,163,184,0.2)] bg-background/95 px-3.5 py-2.5 shadow-lg backdrop-blur-md max-sm:w-34.5 max-sm:rounded-lg max-sm:px-2.5 max-sm:py-1.5"
      style={style}
    >
      <p className="text-xs text-muted-foreground max-sm:text-[10px]">{label}</p>
      <p className="mt-1 text-sm font-semibold max-sm:mt-0.5 max-sm:text-xs">{t("chart.exactValue", {value})}</p>
    </div>
  );
}

export function TeacherModuleDifficultyChart({items}: TeacherModuleDifficultyChartProps) {
  const t = useTranslations("teacherWeakAreas");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chart = useMemo(() => {
    const width = 560;
    const height = 290;
    const left = 20;
    const right = 20;
    const top = 22;
    const bottom = 56;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const barGap = 14;
    const barWidth = (plotWidth - barGap * Math.max(0, items.length - 1)) / Math.max(1, items.length);

    const bars = items.map((item, index) => {
      const x = left + index * (barWidth + barGap);
      const barHeight = (clamp(item.value, 0, 100) / 100) * plotHeight;
      const y = top + (plotHeight - barHeight);

      return {
        ...item,
        x,
        y,
        width: barWidth,
        height: barHeight
      };
    });

    return {
      width,
      height,
      top,
      left,
      right,
      bottom,
      plotHeight,
      bars
    };
  }, [items]);

  const safeActiveIndex = activeIndex !== null && activeIndex >= 0 && activeIndex < chart.bars.length ? activeIndex : null;
  const activeBar = safeActiveIndex === null ? null : chart.bars[safeActiveIndex];

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="pt-7 pb-3">
        <CardTitle className="text-2xl">{t("moduleDifficultyAnalysis")}</CardTitle>
      </CardHeader>

      <CardContent className="pb-5">
        <ChartContainer className="relative overflow-hidden rounded-xl border border-border/65 bg-background/35 p-2.5">
          <svg
            viewBox={`0 0 ${chart.width} ${chart.height}`}
            className="h-auto w-full"
            onMouseLeave={() => setActiveIndex(null)}
          >
            {chart.bars.map((bar, index) => {
              const active = index === safeActiveIndex;

              return (
                <g key={`module-difficulty-${bar.module}`} onMouseEnter={() => setActiveIndex(index)} className="cursor-pointer">
                  <rect
                    x={bar.x}
                    y={chart.top}
                    width={bar.width}
                    height={chart.plotHeight}
                    rx="11"
                    fill="rgba(55,65,81,0.32)"
                  />

                  <rect
                    x={bar.x}
                    y={bar.y}
                    width={bar.width}
                    height={bar.height}
                    rx="11"
                    fill={active ? "rgba(96,165,250,0.95)" : "rgba(59,130,246,0.85)"}
                  />

                  <rect
                    x={bar.x - 6}
                    y={chart.top}
                    width={bar.width + 12}
                    height={chart.plotHeight + 14}
                    fill="transparent"
                  />

                  <text
                    x={bar.x + bar.width / 2}
                    y={chart.height - 20}
                    textAnchor="middle"
                    fontSize={11}
                    fill={active ? "rgba(191,219,254,0.95)" : "rgba(203,213,225,0.86)"}
                  >
                    {t(`modules.${bar.module}`)}
                  </text>
                </g>
              );
            })}
          </svg>

          {activeBar ? (
            <BarTooltip
              label={t(`modules.${activeBar.module}`)}
              value={activeBar.value}
              style={{
                left: `${clamp(((activeBar.x + activeBar.width / 2) / chart.width) * 100, 14, 86)}%`,
                top: `${clamp((activeBar.y / chart.height) * 100, 8, 72)}%`,
                transform: "translate(-50%, -112%)"
              }}
            />
          ) : null}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
