"use client";

import {useEffect, useMemo, useState} from "react";
import {Loader2, Search} from "lucide-react";
import {useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Switch} from "@/components/ui/switch";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {SiteToast, type SiteToastNotice} from "@/components/ui/site-toast";
import {adminFeedbackService, type FeedbackRecord} from "@/src/services/feedback.service";
import {AdminApiError} from "@/src/services/admin/types";
import {cn} from "@/lib/utils";

import {AdminSidebar} from "../../_components/AdminSidebar";
import {AdminTopbar} from "../../_components/AdminTopbar";

type VisibilityFilter = "all" | "visible" | "hidden";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function getStudentName(item: FeedbackRecord, fallback: string) {
  return item.userFullName.trim() || item.userEmail.trim() || fallback;
}

export function AdminFeedbackPageClient() {
  const t = useTranslations("adminFeedback");
  const [items, setItems] = useState<FeedbackRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState<VisibilityFilter>("all");
  const [notice, setNotice] = useState<SiteToastNotice | null>(null);

  const loadFeedback = async () => {
    setIsLoading(true);
    try {
      const response = await adminFeedbackService.list();
      setItems(response.results);
    } catch (error) {
      setItems([]);
      setNotice({
        title: t("notices.loadFailed.title"),
        description: error instanceof Error ? error.message : t("notices.loadFailed.description"),
        tone: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      if (visibility === "visible" && !item.isVisible) return false;
      if (visibility === "hidden" && item.isVisible) return false;
      if (!query) return true;
      return (
        item.feedbackText.toLowerCase().includes(query) ||
        item.userFullName.toLowerCase().includes(query) ||
        item.userEmail.toLowerCase().includes(query)
      );
    });
  }, [items, search, visibility]);

  const handleToggleVisibility = async (item: FeedbackRecord, isVisible: boolean) => {
    if (savingId) return;
    setSavingId(item.id);
    const previousItems = items;
    setItems((current) => current.map((row) => (row.id === item.id ? {...row, isVisible} : row)));

    try {
      const updated = await adminFeedbackService.setVisibility(item.id, isVisible);
      setItems((current) => current.map((row) => (row.id === item.id ? {...row, ...updated} : row)));
      setNotice({
        title: isVisible ? t("notices.enabled.title") : t("notices.disabled.title"),
        description: isVisible ? t("notices.enabled.description") : t("notices.disabled.description"),
        tone: "success"
      });
    } catch (error) {
      setItems(previousItems);
      const description = error instanceof AdminApiError || error instanceof Error ? error.message : t("notices.saveFailed.description");
      setNotice({title: t("notices.saveFailed.title"), description, tone: "error"});
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteToast notice={notice} />
      <div className="flex min-h-screen">
        <AdminSidebar />

        <main className="min-w-0 flex-1">
          <AdminTopbar
            title={t("title")}
            actions={
              <Button variant="outline" className="rounded-xl" onClick={() => void loadFeedback()} disabled={isLoading}>
                {isLoading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                {t("refresh")}
              </Button>
            }
          />

          <div className="mx-auto max-w-[1480px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
            <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/70 py-0">
              <CardHeader className="gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>{t("list.title")}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{t("list.description")}</p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                  <div className="relative sm:w-72">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder={t("searchPlaceholder")}
                      className="h-10 rounded-xl pl-9"
                    />
                  </div>
                  <div className="flex rounded-xl border border-border/70 bg-background/60 p-1">
                    {(["all", "visible", "hidden"] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setVisibility(option)}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                          visibility === option ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {t(`filters.${option}`)}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="border-t border-border/70 p-0">
                <div className="overflow-x-auto">
                  <Table className="min-w-[920px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("columns.student")}</TableHead>
                        <TableHead>{t("columns.feedback")}</TableHead>
                        <TableHead>{t("columns.date")}</TableHead>
                        <TableHead>{t("columns.status")}</TableHead>
                        <TableHead className="text-right">{t("columns.visible")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-28 text-center text-sm text-muted-foreground">
                            <Loader2 className="mx-auto mb-2 size-5 animate-spin" aria-hidden="true" />
                            {t("loading")}
                          </TableCell>
                        </TableRow>
                      ) : filteredItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-28 text-center text-sm text-muted-foreground">
                            {t("empty")}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredItems.map((item) => {
                          const studentName = getStudentName(item, t("unknownStudent"));
                          return (
                            <TableRow key={item.id}>
                              <TableCell className="w-64">
                                <div className="min-w-0">
                                  <p className="truncate font-medium">{studentName}</p>
                                  {item.userEmail ? <p className="truncate text-xs text-muted-foreground">{item.userEmail}</p> : null}
                                </div>
                              </TableCell>
                              <TableCell>
                                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{item.feedbackText}</p>
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatDate(item.createdAt)}</TableCell>
                              <TableCell>
                                <Badge
                                  className={cn(
                                    "border px-2.5 py-0.5 text-[10px] tracking-wide uppercase",
                                    item.isVisible
                                      ? "border-emerald-400/35 bg-emerald-500/12 text-emerald-600 dark:text-emerald-300"
                                      : "border-amber-400/35 bg-amber-500/12 text-amber-600 dark:text-amber-300"
                                  )}
                                >
                                  {item.isVisible ? t("status.visible") : t("status.hidden")}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Switch
                                  checked={item.isVisible}
                                  disabled={savingId === item.id}
                                  onCheckedChange={(checked) => void handleToggleVisibility(item, checked)}
                                  aria-label={t("toggleAria", {name: studentName})}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
