"use client";

import {Medal, Trophy} from "lucide-react";
import {useEffect, useState} from "react";
import {useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Card, CardContent} from "@/components/ui/card";
import {cn} from "@/lib/utils";
import {studentMarathonService} from "@/src/services/student/marathon.service";
import type {StudentMarathonDetail, StudentMarathonLeaderboardEntry} from "@/src/services/student/marathon.types";
import {StudentApiError} from "@/src/services/student/types";

type MarathonLeaderboardClientProps = {
  marathonId: string;
};

export function MarathonLeaderboardClient({marathonId}: MarathonLeaderboardClientProps) {
  const t = useTranslations("marathon");
  const [detail, setDetail] = useState<StudentMarathonDetail | null>(null);
  const [leaderboard, setLeaderboard] = useState<StudentMarathonLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [nextDetail, nextLeaderboard] = await Promise.all([
          studentMarathonService.getById(marathonId),
          studentMarathonService.getLeaderboard(marathonId)
        ]);
        if (!active) return;
        setDetail(nextDetail);
        setLeaderboard(nextLeaderboard);
      } catch (cause) {
        if (!active) return;
        setError(cause instanceof StudentApiError ? cause.message : t("errors.leaderboard"));
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [marathonId, t]);

  const topThree = leaderboard.slice(0, 3);
  const restRanks = leaderboard.slice(3);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="h-56 rounded-[32px] border border-slate-200 bg-white/85 dark:border-white/10 dark:bg-white/6" />
        <div className="h-[680px] rounded-[32px] border border-slate-200 bg-white/85 dark:border-white/10 dark:bg-white/6" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mx-auto max-w-5xl rounded-[30px] border border-rose-200 bg-rose-50 dark:border-rose-300/20 dark:bg-rose-500/10">
        <CardContent className="p-6 text-sm text-rose-700 dark:text-rose-100">{error}</CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Card className="rounded-[32px] border border-slate-200 bg-white/94 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/7 dark:shadow-[0_24px_80px_rgba(0,0,0,0.26)]">
        <CardContent className="p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Leaderboard</p>
              <h2 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">The Global Standings</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                Top performers inside {detail?.title || "this marathon"} based on current score, streak, and completed days.
              </p>
            </div>
            <Badge className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sky-700 dark:border-cyan-300/18 dark:bg-cyan-400/10 dark:text-cyan-100">
              {leaderboard.length} ranked
            </Badge>
          </div>
        </CardContent>
      </Card>

      {leaderboard.length ? (
        <>
          <Card className="rounded-[32px] border border-slate-200 bg-white/94 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/7 dark:shadow-[0_24px_80px_rgba(0,0,0,0.26)]">
            <CardContent className="p-6 sm:p-8">
              <div className="grid gap-5 lg:grid-cols-[1fr_1.15fr_1fr] lg:items-end">
                {topThree[1] ? (
                  <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 text-center dark:border-white/10 dark:bg-slate-950/25">
                    <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 dark:border-white/10 dark:bg-white/8">
                      <Medal className="size-5" />
                    </div>
                    <p className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">{topThree[1].student_full_name}</p>
                    <p className="mt-1 text-sm text-slate-500">Rank #{topThree[1].rank}</p>
                    <p className="mt-4 text-2xl font-semibold text-slate-950 dark:text-white">{topThree[1].total_score}</p>
                  </div>
                ) : (
                  <div />
                )}

                {topThree[0] ? (
                  <div className="rounded-[32px] border border-blue-200 bg-linear-to-br from-blue-600 to-blue-700 p-6 text-center text-white shadow-[0_24px_60px_rgba(37,99,235,0.24)] dark:border-blue-300/20">
                    <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-white/25 bg-white/15">
                      <Trophy className="size-6" />
                    </div>
                    <p className="mt-5 text-xl font-semibold">{topThree[0].student_full_name}</p>
                    <p className="mt-1 text-sm text-blue-100">Rank #{topThree[0].rank}</p>
                    <div className="mt-5 grid grid-cols-3 gap-2 text-left">
                      <div className="rounded-2xl bg-white/10 px-3 py-3">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-blue-100">Score</p>
                        <p className="mt-2 text-lg font-semibold">{topThree[0].total_score}</p>
                      </div>
                      <div className="rounded-2xl bg-white/10 px-3 py-3">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-blue-100">Streak</p>
                        <p className="mt-2 text-lg font-semibold">{topThree[0].current_streak}</p>
                      </div>
                      <div className="rounded-2xl bg-white/10 px-3 py-3">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-blue-100">Days</p>
                        <p className="mt-2 text-lg font-semibold">{topThree[0].days_completed}</p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {topThree[2] ? (
                  <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 text-center dark:border-white/10 dark:bg-slate-950/25">
                    <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-slate-200 bg-white text-orange-400 dark:border-white/10 dark:bg-white/8">
                      <Medal className="size-5" />
                    </div>
                    <p className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">{topThree[2].student_full_name}</p>
                    <p className="mt-1 text-sm text-slate-500">Rank #{topThree[2].rank}</p>
                    <p className="mt-4 text-2xl font-semibold text-slate-950 dark:text-white">{topThree[2].total_score}</p>
                  </div>
                ) : (
                  <div />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border border-slate-200 bg-white/94 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/7 dark:shadow-[0_24px_80px_rgba(0,0,0,0.26)]">
            <CardContent className="p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Top ranking</h3>
                <Badge className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600 dark:border-white/10 dark:bg-white/8 dark:text-slate-300">
                  Updated live
                </Badge>
              </div>

              <div className="space-y-3">
                {leaderboard.map((entry) => (
                  <div
                    key={`${entry.rank}-${entry.student_full_name}`}
                    className={cn(
                      "grid items-center gap-3 rounded-[22px] border px-4 py-4 md:grid-cols-[72px_minmax(0,1fr)_120px_120px_120px]",
                        entry.is_self ? "border-emerald-200 bg-emerald-50 dark:border-emerald-300/20 dark:bg-emerald-400/10" : "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-950/25"
                      )}
                    >
                      <div className="font-semibold text-slate-950 dark:text-white">#{entry.rank}</div>
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-slate-950 dark:text-white">{entry.student_full_name}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                          {entry.is_finished_marathon ? "Finished" : "Active"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Score</p>
                        <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">{entry.total_score}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Streak</p>
                        <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">{entry.current_streak}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Days</p>
                        <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">{entry.days_completed}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="rounded-[30px] border border-slate-200 bg-white/92 dark:border-white/10 dark:bg-white/7">
          <CardContent className="p-6 text-sm leading-7 text-slate-600 dark:text-slate-300">{t("detail.noLeaderboard")}</CardContent>
        </Card>
      )}
    </div>
  );
}
