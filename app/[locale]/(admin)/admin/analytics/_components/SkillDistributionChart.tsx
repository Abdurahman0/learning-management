"use client";

import {useMemo} from "react";
import {useTranslations} from "next-intl";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {SkillDistribution} from "@/data/admin-analytics";

type SkillDistributionChartProps = {
  value: SkillDistribution;
};

export function SkillDistributionChart({value}: SkillDistributionChartProps) {
  const t = useTranslations("adminAnalytics");

  const chart = useMemo(() => {
    const size = 320;
    const center = size / 2;
    const radius = 104;

    const axes = [
      {key: "reading", x: center, y: center - radius},
      {key: "listening", x: center + radius, y: center},
      {key: "writing", x: center, y: center + radius},
      {key: "speaking", x: center - radius, y: center}
    ] as const;

    const pointMap = {
      reading: {x: center, y: center - (radius * value.reading) / 100},
      listening: {x: center + (radius * value.listening) / 100, y: center},
      writing: {x: center, y: center + (radius * value.writing) / 100},
      speaking: {x: center - (radius * value.speaking) / 100, y: center}
    };

    const polygonPoints = `${pointMap.reading.x},${pointMap.reading.y} ${pointMap.listening.x},${pointMap.listening.y} ${pointMap.writing.x},${pointMap.writing.y} ${pointMap.speaking.x},${pointMap.speaking.y}`;

    return {size, center, radius, axes, polygonPoints};
  }, [value]);

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="pt-5 pb-2">
        <CardTitle className="text-lg font-semibold tracking-tight">{t("skillDistribution")}</CardTitle>
      </CardHeader>
      <CardContent className="pt-1 pb-5">
        <div className="mx-auto max-w-[360px]">
          <svg viewBox={`0 0 ${chart.size} ${chart.size}`} className="h-auto w-full">
            {[1, 0.75, 0.5, 0.25].map((ratio) => {
              const r = chart.radius * ratio;
              const points = `${chart.center},${chart.center - r} ${chart.center + r},${chart.center} ${chart.center},${chart.center + r} ${chart.center - r},${chart.center}`;
              return <polygon key={`grid-${ratio}`} points={points} fill="none" stroke="rgba(59,130,246,0.2)" strokeWidth="1" />;
            })}

            {chart.axes.map((axis) => (
              <line key={`axis-line-${axis.key}`} x1={chart.center} y1={chart.center} x2={axis.x} y2={axis.y} stroke="rgba(59,130,246,0.28)" strokeWidth="1.2" />
            ))}

            <polygon points={chart.polygonPoints} fill="rgba(47,91,255,0.18)" stroke="rgba(47,91,255,0.95)" strokeWidth="2.5" />

            {chart.axes.map((axis) => (
              <text
                key={`axis-label-${axis.key}`}
                x={axis.key === "listening" ? axis.x + 8 : axis.key === "speaking" ? axis.x - 8 : axis.x}
                y={axis.key === "reading" ? axis.y - 8 : axis.key === "writing" ? axis.y + 16 : axis.y + 4}
                textAnchor={axis.key === "listening" ? "start" : axis.key === "speaking" ? "end" : "middle"}
                fontSize={11}
                fill="var(--muted-foreground)"
              >
                {t(`skills.${axis.key}`)}
              </text>
            ))}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
