"use client";

import {useEffect, useState} from "react";
import {CheckCircle2, Clock, Crown, Loader2, MinusCircle, Sparkles, User} from "lucide-react";

import {Badge} from "@/components/ui/badge";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {studentProfileService} from "@/src/services/student/profile.service";
import {studentPremiumHistoryService, type StudentPremiumHistoryEntry} from "@/src/services/student/premiumHistory.service";
import type {StudentProfileResponse} from "@/src/services/student/types";

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function SettingsPageClient() {
  const [profile, setProfile] = useState<StudentProfileResponse | null>(null);
  const [history, setHistory] = useState<StudentPremiumHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    let active = true;

    studentProfileService.getProfile().then((data) => {
      if (active) setProfile(data);
    }).catch(() => {
      // silent
    }).finally(() => {
      if (active) setLoading(false);
    });

    studentPremiumHistoryService.getHistory().then((data) => {
      if (active) setHistory(data);
    }).catch(() => {
      // silent
    }).finally(() => {
      if (active) setHistoryLoading(false);
    });

    return () => { active = false; };
  }, []);

  const isPremium = profile?.is_premium ?? false;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 px-2 pb-10 pt-4 sm:px-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your profile and subscription status.</p>
      </div>

      {/* Profile summary */}
      <Card className="rounded-2xl border-border/70 bg-card/70 py-0">
        <CardContent className="px-5 py-5">
          {loading ? (
            <div className="flex items-center gap-3">
              <div className="size-12 animate-pulse rounded-xl bg-muted/60" />
              <div className="space-y-2">
                <div className="h-4 w-36 animate-pulse rounded bg-muted/60" />
                <div className="h-3 w-48 animate-pulse rounded bg-muted/50" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <User className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold">{profile?.full_name || "—"}</p>
                <p className="truncate text-sm text-muted-foreground">{profile?.email || "—"}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Premium status */}
      <Card className={`rounded-2xl border py-0 ${isPremium ? "border-amber-500/25 bg-amber-500/4" : "border-border/70 bg-card/70"}`}>
        <CardHeader className="pb-3 pt-5">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Crown className={`size-4 ${isPremium ? "text-amber-500" : "text-muted-foreground"}`} />
            Premium Status
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-5">
          {loading ? (
            <div className="h-5 w-28 animate-pulse rounded bg-muted/60" />
          ) : isPremium ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className="border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-500">
                  <Sparkles className="mr-1.5 size-3" />
                  Premium Active
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                You have full access to all premium content, including premium tests and marathons.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <Badge className="border border-border/70 bg-muted/35 px-3 py-1 text-xs font-semibold text-muted-foreground">
                Free Plan
              </Badge>
              <p className="text-sm text-muted-foreground">
                Upgrade to premium to unlock exclusive tests and marathon programs.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Premium history */}
      <Card className="rounded-2xl border-border/70 bg-card/70 py-0">
        <CardHeader className="pb-3 pt-5">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Clock className="size-4 text-muted-foreground" />
            Premium History
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-5">
          {historyLoading ? (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="size-8 animate-pulse rounded-xl bg-muted/60" />
                  <div className="flex-1 space-y-1.5 pt-1">
                    <div className="h-3.5 w-32 animate-pulse rounded bg-muted/60" />
                    <div className="h-3 w-48 animate-pulse rounded bg-muted/50" />
                  </div>
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No premium history yet.</p>
          ) : (
            <div className="space-y-3">
              {history.map((entry, index) => {
                const isEnabled = entry.action === "ENABLED";
                return (
                  <div key={index} className="flex gap-3">
                    <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl ${isEnabled ? "bg-amber-500/12" : "bg-muted/40"}`}>
                      {isEnabled ? (
                        <CheckCircle2 className="size-4 text-amber-500" />
                      ) : (
                        <MinusCircle className="size-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {isEnabled ? "Premium access granted" : "Premium access removed"}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</p>
                      {entry.note ? (
                        <p className="mt-0.5 text-xs text-muted-foreground italic">&ldquo;{entry.note}&rdquo;</p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
