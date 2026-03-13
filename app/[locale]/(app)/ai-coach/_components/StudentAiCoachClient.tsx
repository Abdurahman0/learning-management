"use client";

import {useEffect, useMemo, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {useRouter} from "next/navigation";
import {Bot, CircleDot, Lightbulb, Paperclip, Send, Sparkles, Trash2, WandSparkles} from "lucide-react";

import {
  STUDENT_COACH_ACCURACY_ROWS,
  STUDENT_COACH_MESSAGES_SEED,
  STUDENT_COACH_RECOMMENDATIONS,
  STUDENT_COACH_STRATEGY_CARDS,
  STUDENT_COACH_SUMMARY,
  buildCoachReply
} from "@/data/student/ai-coach";
import type {StudentCoachMessage, StudentCoachRecommendation, StudentCoachStrategyCard} from "@/types/student";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {cn} from "@/lib/utils";

type Notice = {
  title: string;
  description: string;
};

const cardClassName = "rounded-2xl border border-border/70 bg-card/90 dark:bg-[linear-gradient(155deg,rgba(17,24,39,0.92),rgba(15,23,42,0.9))] shadow-none";

const strategyToneClass = {
  amber: "border-amber-400/40 bg-amber-500/8",
  indigo: "border-indigo-400/40 bg-indigo-500/8",
  emerald: "border-emerald-400/40 bg-emerald-500/8"
} as const;

const recommendationTagClass = {
  reading: "border-indigo-400/40 bg-indigo-500/12 text-indigo-700 dark:text-indigo-200",
  writing: "border-violet-400/40 bg-violet-500/12 text-violet-700 dark:text-violet-200",
  listening: "border-blue-400/40 bg-blue-500/12 text-blue-700 dark:text-blue-200",
  studyBank: "border-cyan-400/40 bg-cyan-500/12 text-cyan-700 dark:text-cyan-200"
} as const;

const strongestModuleClass = {
  reading: "text-indigo-600 dark:text-indigo-300",
  listening: "text-blue-600 dark:text-blue-300",
  writing: "text-violet-600 dark:text-violet-300",
  speaking: "text-cyan-600 dark:text-cyan-300"
} as const;

const weakestModuleClass = {
  reading: "text-indigo-700 dark:text-indigo-300",
  listening: "text-blue-700 dark:text-blue-300",
  writing: "text-rose-700 dark:text-rose-300",
  speaking: "text-cyan-700 dark:text-cyan-300"
} as const;

export function StudentAiCoachClient() {
  const t = useTranslations("studentAiCoach");
  const locale = useLocale();
  const router = useRouter();

  const [messages, setMessages] = useState<StudentCoachMessage[]>(STUDENT_COACH_MESSAGES_SEED);
  const [input, setInput] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);

  const weakestType = useMemo(() => {
    const sorted = [...STUDENT_COACH_ACCURACY_ROWS].sort((left, right) => left.accuracy - right.accuracy);
    return sorted[0];
  }, []);

  const strongestType = useMemo(() => {
    const sorted = [...STUDENT_COACH_ACCURACY_ROWS].sort((left, right) => right.accuracy - left.accuracy);
    return sorted[0];
  }, []);

  const latestAssistantMessageId = useMemo(() => {
    const last = [...messages].reverse().find((message) => message.role === "assistant");
    return last?.id ?? null;
  }, [messages]);

  useEffect(() => {
    if (!notice) {
      return;
    }
    const timer = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const pushNotice = (title: string, description: string) => {
    setNotice({title, description});
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }

    const userMessage: StudentCoachMessage = {
      id: `coach-user-${Date.now()}`,
      role: "student",
      content: trimmed,
      createdAt: new Date().toISOString()
    };

    const aiMessage: StudentCoachMessage = {
      id: `coach-ai-${Date.now() + 1}`,
      role: "assistant",
      content: buildCoachReply(trimmed),
      createdAt: new Date().toISOString()
    };

    setMessages((current) => [...current, userMessage, aiMessage]);
    setInput("");
  };

  const handleClearChat = () => {
    setMessages(STUDENT_COACH_MESSAGES_SEED);
    pushNotice(t("feedback.clear.title"), t("feedback.clear.description"));
  };

  const handleAttachWriting = () => {
    pushNotice(t("feedback.attach.title"), t("feedback.attach.description"));
  };

  const handleHistory = () => {
    pushNotice(t("feedback.history.title"), t("feedback.history.description"));
  };

  const handleTryPracticeDrill = () => {
    router.push(`/${locale}/reading?source=ai-coach`);
  };

  const handleExplainMore = () => {
    const aiMessage: StudentCoachMessage = {
      id: `coach-ai-more-${Date.now()}`,
      role: "assistant",
      content:
        `${t("chat.explainMoreLead", {
          weakestType: t(`questionTypes.${weakestType.type}`),
          strongestType: t(`questionTypes.${strongestType.type}`)
        })}\n\n` +
        `${t("chat.explainMoreStep1")}\n` +
        `${t("chat.explainMoreStep2")}\n` +
        `${t("chat.explainMoreStep3")}`,
      createdAt: new Date().toISOString()
    };

    setMessages((current) => [...current, aiMessage]);
  };

  const runStrategyAction = (item: StudentCoachStrategyCard) => {
    if (item.action === "navigate" && item.href) {
      router.push(`/${locale}${item.href}?source=ai-coach`);
      return;
    }
    pushNotice(t("feedback.strategy.title"), t("feedback.strategy.description"));
  };

  const runRecommendationAction = (item: StudentCoachRecommendation) => {
    if (item.action === "navigate" && item.href) {
      router.push(`/${locale}${item.href}?source=ai-coach`);
      return;
    }
    pushNotice(t("feedback.recommendation.title"), t("feedback.recommendation.description"));
  };

  return (
    <main className="mx-auto min-w-0 w-full max-w-[1780px] overflow-x-hidden px-2 py-5 sm:px-4 sm:py-6 lg:px-6">
      <section className="space-y-5 sm:space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-lg border border-indigo-400/35 bg-indigo-500/12 text-indigo-700 dark:text-indigo-200">
              <WandSparkles className="size-4" />
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{t("title")}</h1>
          </div>
          <p className="text-sm text-muted-foreground sm:text-[15px]">{t("subtitle")}</p>
        </header>

        {notice ? (
          <Card className="rounded-xl border border-blue-500/35 bg-blue-500/10 shadow-none">
            <CardContent className="p-3">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-100">{notice.title}</p>
              <p className="text-sm text-blue-700/90 dark:text-blue-100/90">{notice.description}</p>
            </CardContent>
          </Card>
        ) : null}

        <section className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className={cn(cardClassName, "p-5")}>
            <p className="text-xs font-semibold tracking-[0.07em] text-muted-foreground uppercase">{t("summary.estimatedBand.label")}</p>
            <p className="mt-2 flex items-end gap-2 text-4xl leading-none font-semibold text-foreground">
              {STUDENT_COACH_SUMMARY.estimatedBand.toFixed(1)}
              <span className="mb-1 text-xl text-emerald-600 dark:text-emerald-300">+{STUDENT_COACH_SUMMARY.estimatedBandDelta.toFixed(1)}</span>
            </p>
          </Card>

          <Card className={cn(cardClassName, "p-5")}>
            <p className="text-xs font-semibold tracking-[0.07em] text-muted-foreground uppercase">{t("summary.targetBand.label")}</p>
            <p className="mt-2 flex items-end gap-2 text-4xl leading-none font-semibold text-foreground">
              {STUDENT_COACH_SUMMARY.targetBand.toFixed(1)}
              <span className="mb-1 text-sm text-muted-foreground">{t("summary.targetBand.meta")}</span>
            </p>
          </Card>

          <Card className={cn(cardClassName, "p-5")}>
            <p className="text-xs font-semibold tracking-[0.07em] text-muted-foreground uppercase">{t("summary.strongestModule.label")}</p>
            <p className={cn("mt-2 text-4xl leading-none font-semibold uppercase", strongestModuleClass[STUDENT_COACH_SUMMARY.strongestModule])}>
              {t(`modules.${STUDENT_COACH_SUMMARY.strongestModule}`)}
            </p>
          </Card>

          <Card className={cn(cardClassName, "p-5")}>
            <p className="text-xs font-semibold tracking-[0.07em] text-muted-foreground uppercase">{t("summary.weakestModule.label")}</p>
            <p className={cn("mt-2 text-4xl leading-none font-semibold uppercase", weakestModuleClass[STUDENT_COACH_SUMMARY.weakestModule])}>
              {t(`modules.${STUDENT_COACH_SUMMARY.weakestModule}`)}
            </p>
          </Card>
        </section>

        <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.95fr)]">
          <Card className={cardClassName}>
            <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border/60">
              <CardTitle className="flex items-center gap-2 text-xl font-semibold text-foreground">
                <CircleDot className="size-3 text-emerald-400" />
                {t("chat.title")}
              </CardTitle>
              <Button variant="ghost" className="h-8 px-2 text-muted-foreground hover:text-foreground" onClick={handleHistory}>
                {t("chat.history")}
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              <div className="max-h-[520px] space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                {messages.map((message) => (
                  <div key={message.id} className={cn("flex", message.role === "student" ? "justify-end" : "justify-start")}>
                    {message.role === "student" ? (
                      <div className="max-w-[92%] rounded-2xl border border-indigo-400/40 bg-indigo-500/15 px-4 py-3 text-sm leading-relaxed text-indigo-900 dark:text-indigo-100 sm:max-w-[75%]">
                        {message.content}
                      </div>
                    ) : (
                      <div className="flex max-w-[95%] items-start gap-3 sm:max-w-[85%]">
                        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-indigo-400/30 bg-indigo-500/12 text-indigo-700 dark:text-indigo-200">
                          <Bot className="size-4" />
                        </span>
                        <div className="rounded-2xl border border-border/70 bg-background/65 px-4 py-3 text-sm leading-relaxed text-foreground whitespace-pre-line">
                          {message.content}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {latestAssistantMessageId ? (
                  <div className="flex flex-wrap items-center gap-2 pl-11">
                    <Button className="h-9 rounded-xl bg-indigo-500 text-white hover:bg-indigo-400" onClick={handleTryPracticeDrill}>
                      {t("chat.tryPracticeDrill")}
                    </Button>
                    <Button variant="outline" className="h-9 rounded-xl border-border/70 bg-background/60" onClick={handleExplainMore}>
                      {t("chat.explainMore")}
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="space-y-3 border-t border-border/60 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-2">
                  <Input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={t("chat.inputPlaceholder")}
                    className="h-11 rounded-xl border-border/70 bg-background/60"
                  />
                  <Button className="h-11 rounded-xl bg-indigo-500 text-white hover:bg-indigo-400" onClick={handleSend}>
                    <Send className="size-4" />
                    {t("chat.send")}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <Button variant="ghost" className="h-8 px-1 text-muted-foreground hover:text-foreground" onClick={handleAttachWriting}>
                    <Paperclip className="size-4" />
                    {t("chat.attachWriting")}
                  </Button>
                  <Button variant="ghost" className="h-8 px-1 text-muted-foreground hover:text-foreground" onClick={handleClearChat}>
                    <Trash2 className="size-4" />
                    {t("chat.clearChat")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className={cardClassName}>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">{t("accuracyByType.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {STUDENT_COACH_ACCURACY_ROWS.map((row) => (
                  <div key={row.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <p className="text-foreground/90">{t(`questionTypes.${row.type}`)}</p>
                      <p className="font-semibold text-foreground">{row.accuracy}%</p>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-muted">
                      <div className="h-full rounded-full bg-indigo-500" style={{width: `${row.accuracy}%`}} />
                    </div>
                  </div>
                ))}
                {weakestType ? (
                  <p className="pt-1 text-sm text-muted-foreground italic">
                    {t("accuracyByType.note", {type: t(`questionTypes.${weakestType.type}`)})}
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <section className="space-y-3">
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">{t("studyStrategy.title")}</h3>
              {STUDENT_COACH_STRATEGY_CARDS.map((item) => (
                <Card
                  key={item.id}
                  className={cn(cardClassName, "cursor-pointer p-4 transition-colors hover:border-primary/40", strategyToneClass[item.tone])}
                  onClick={() => runStrategyAction(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      runStrategyAction(item);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex size-9 items-center justify-center rounded-lg border border-border/70 bg-background/70">
                      <Lightbulb className="size-4 text-foreground/80" />
                    </span>
                    <div>
                      <p className="text-xl font-semibold text-foreground">{t(`studyStrategy.items.${item.id}.title`)}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{t(`studyStrategy.items.${item.id}.description`)}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </section>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">{t("recommended.title")}</h2>
          <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {STUDENT_COACH_RECOMMENDATIONS.map((item) => (
              <Card key={item.id} className={cn(cardClassName, "flex h-full flex-col p-4")}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <Badge className={cn("border font-medium", recommendationTagClass[item.tag])}>{t(`recommended.tags.${item.tag}`)}</Badge>
                  <Sparkles className="size-4 text-muted-foreground" />
                </div>
                <p className="text-xl font-semibold leading-tight text-foreground">{t(`recommended.items.${item.id}.title`)}</p>
                <p className="mt-2 min-h-[52px] text-sm leading-relaxed text-muted-foreground">{t(`recommended.items.${item.id}.description`)}</p>
                <Button className="mt-auto h-9 w-full rounded-xl bg-indigo-500 text-white hover:bg-indigo-400" onClick={() => runRecommendationAction(item)}>
                  {t(`recommended.items.${item.id}.cta`)}
                </Button>
              </Card>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
