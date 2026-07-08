"use client";

import {useEffect, useState} from "react";
import {Clock, Crown, Loader2, XCircle} from "lucide-react";

import {Badge} from "@/components/ui/badge";
import {Card, CardContent} from "@/components/ui/card";
import {adminUsersService, type AdminPremiumHistoryEntry} from "@/src/services/admin/users.service";

type UserPremiumHistoryTabProps = {
  userId: string;
};

function formatDate(value: string) {
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

export function UserPremiumHistoryTab({userId}: UserPremiumHistoryTabProps) {
  const [entries, setEntries] = useState<AdminPremiumHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    adminUsersService.getPremiumHistory(userId).then((data) => {
      if (!active) return;
      setEntries(data);
    }).catch(() => {
      if (!active) return;
      setError("Failed to load premium history.");
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="rounded-2xl border-rose-500/20 bg-rose-500/5 py-0">
        <CardContent className="px-4 py-4">
          <p className="text-sm text-rose-400">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="rounded-2xl border-border/70 bg-card/60 py-0">
        <CardContent className="px-4 py-8 text-center">
          <Clock className="mx-auto mb-2 size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No premium history yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry, index) => {
        const isEnabled = entry.action === "ENABLED";
        return (
          <div
            key={entry.id || index}
            className="flex gap-3 rounded-2xl border border-border/70 bg-card/60 p-4"
          >
            <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl ${isEnabled ? "bg-amber-500/15" : "bg-slate-500/10"}`}>
              {isEnabled ? (
                <Crown className="size-4 text-amber-500" />
              ) : (
                <XCircle className="size-4 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className={`border px-2 py-0.5 text-[10px] uppercase tracking-wide ${isEnabled ? "border-amber-500/30 bg-amber-500/10 text-amber-400" : "border-slate-500/30 bg-slate-500/10 text-slate-400"}`}
                >
                  {isEnabled ? "Premium Enabled" : "Premium Disabled"}
                </Badge>
                <span className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</span>
              </div>
              {entry.performedByEmail ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  By <span className="font-medium text-foreground">{entry.performedByEmail}</span>
                </p>
              ) : null}
              {entry.note ? (
                <p className="mt-1 text-xs text-muted-foreground italic">&ldquo;{entry.note}&rdquo;</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
