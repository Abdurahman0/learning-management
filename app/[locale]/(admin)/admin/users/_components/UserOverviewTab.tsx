"use client";

import {AlertTriangle, Mail, RotateCcw, TrendingUp} from "lucide-react";
import {useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {AdminUser} from "@/data/admin-users";

type UserOverviewTabProps = {
  user: AdminUser;
  onSendMessage: (user: AdminUser) => void;
  onResetPassword: (user: AdminUser) => void;
};

type ChartPoint = {
  x: number;
  y: number;
};

const severityClassName = {
  critical: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  improving: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  stable: "border-slate-500/30 bg-slate-500/10 text-slate-300"
} as const;

const moduleBarClassName = {
  reading: "bg-blue-500",
  listening: "bg-cyan-500",
  writing: "bg-amber-500",
  speaking: "bg-violet-500"
} as const;

function getChartPoints(values: number[], width: number, height: number, leftPad: number, topPad: number, bottomPad: number): ChartPoint[] {
  if (!values.length) {
    return [];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(0.1, max - min);
  const chartHeight = height - topPad - bottomPad;
  const stepX = values.length > 1 ? (width - leftPad * 2) / (values.length - 1) : 0;

  return values.map((value, index) => {
    const normalized = (value - min) / range;
    return {
      x: leftPad + stepX * index,
      y: height - bottomPad - normalized * chartHeight
    };
  });
}

function toLinePath(points: ChartPoint[]) {
  if (!points.length) {
    return "";
  }

  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

function toAreaPath(points: ChartPoint[], baselineY: number) {
  if (!points.length) {
    return "";
  }

  const line = toLinePath(points);
  const first = points[0];
  const last = points[points.length - 1];

  return `${line} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
}

export function UserOverviewTab({user, onSendMessage, onResetPassword}: UserOverviewTabProps) {
  const t = useTranslations("adminUsers");
  const chartWidth = 360;
  const chartHeight = 138;
  const baseline = 112;
  const values = user.bandProgress.map((point) => point.value);
  const chartPoints = getChartPoints(values, chartWidth, chartHeight, 14, 18, 26);
  const linePath = toLinePath(chartPoints);
  const areaPath = toAreaPath(chartPoints, baseline);
  const growthValue = values.length >= 2 ? values[values.length - 1] - values[0] : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="rounded-2xl border-border/70 bg-card/60 py-0">
          <CardContent className="space-y-1 px-4 py-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{t("overview.overallBand")}</p>
            <p className="text-4xl font-semibold tracking-tight text-primary">{user.overallBand.toFixed(1)}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 bg-card/60 py-0">
          <CardContent className="space-y-1 px-4 py-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{t("overview.targetScore")}</p>
            <p className="text-4xl font-semibold tracking-tight">{user.targetBand.toFixed(1)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-border/70 bg-card/70 py-0">
        <CardHeader className="flex flex-row items-start justify-between pt-5 pb-2">
          <CardTitle className="text-lg font-semibold tracking-tight">{t("overview.bandProgress")}</CardTitle>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
            <TrendingUp className="size-3" />
            {t("overview.growthLabel", {value: growthValue.toFixed(1)})}
          </span>
        </CardHeader>
        <CardContent className="pt-1 pb-4">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-[146px] w-full">
            <defs>
              <linearGradient id={`band-progress-${user.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.24" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.04" />
              </linearGradient>
            </defs>
            <line x1="14" y1={baseline} x2={chartWidth - 14} y2={baseline} stroke="hsl(var(--border))" strokeDasharray="3 4" />
            <path d={areaPath} fill={`url(#band-progress-${user.id})`} />
            <path d={linePath} stroke="hsl(var(--primary))" strokeWidth="2.6" strokeLinecap="round" fill="none" />
            {chartPoints.length ? (
              <circle
                cx={chartPoints[chartPoints.length - 1].x}
                cy={chartPoints[chartPoints.length - 1].y}
                r="3.6"
                fill="hsl(var(--primary))"
              />
            ) : null}
            <text x="14" y={chartHeight - 6} fontSize="10" fill="hsl(var(--muted-foreground))">
              {user.bandProgress[0]?.label}
            </text>
            <text x={chartWidth - 26} y={chartHeight - 6} fontSize="10" fill="hsl(var(--muted-foreground))">
              {user.bandProgress[user.bandProgress.length - 1]?.label}
            </text>
          </svg>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/70 bg-card/60 py-0">
        <CardHeader className="pt-5 pb-2">
          <CardTitle className="text-lg font-semibold tracking-tight">{t("overview.moduleStats")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-4">
          {(Object.keys(user.stats) as Array<keyof AdminUser["stats"]>).map((moduleKey) => (
            <div key={`${user.id}-${moduleKey}-bar`} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t(`modules.${moduleKey}`)}</span>
                <span className="font-medium text-foreground">{user.stats[moduleKey]}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted/60">
                <div className={`h-full rounded-full ${moduleBarClassName[moduleKey]}`} style={{width: `${user.stats[moduleKey]}%`}} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/70 bg-card/70 py-0">
        <CardHeader className="pt-5 pb-2">
          <CardTitle className="text-lg font-semibold tracking-tight">{t("overview.identifiedWeakAreas")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5 pb-4">
          {user.weakAreas.length ? (
            user.weakAreas.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${severityClassName[item.severity]}`}
              >
                <span className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="size-4" />
                  {item.label}
                </span>
                <Badge className={`border px-2 py-0.5 text-[10px] tracking-wide uppercase ${severityClassName[item.severity]}`}>
                  {t(`weakAreaSeverity.${item.severity}`)}
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{t("overview.noWeakAreas")}</p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-2 border-t border-border/70 pt-4">
        <Button type="button" className="h-11 w-full rounded-xl font-semibold" onClick={() => onSendMessage(user)}>
          <Mail className="size-4" />
          {t("drawer.actions.sendMessage")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-xl border-border/70 bg-card/40 font-semibold"
          onClick={() => onResetPassword(user)}
        >
          <RotateCcw className="size-4" />
          {t("drawer.actions.resetPassword")}
        </Button>
      </div>
    </div>
  );
}

