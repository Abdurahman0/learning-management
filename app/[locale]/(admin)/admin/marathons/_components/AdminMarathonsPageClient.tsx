"use client";

import Link from "next/link";
import {useCallback, useEffect, useMemo, useState} from "react";
import {Flame, Plus, Trophy, Users} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {AdminTopbar} from "@/app/[locale]/(admin)/admin/_components/AdminTopbar";
import {AdminSidebar} from "@/app/[locale]/(admin)/admin/_components/AdminSidebar";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {ConfirmModal} from "@/components/ui/confirm-modal";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import {SiteToast, type SiteToastNotice} from "@/components/ui/site-toast";
import {Switch} from "@/components/ui/switch";
import {adminMarathonsService, adminMarathonSeriesService} from "@/src/services/admin/marathons.service";
import {AdminApiError} from "@/src/services/admin/types";
import {adminPackagesService, type AdminPackage} from "@/src/services/admin/packages.service";
import type {AdminMarathonPayload, AdminMarathonRecord, AdminMarathonSeriesPayload, AdminMarathonSeriesRecord} from "@/src/services/admin/types";

const EMPTY_FORM: AdminMarathonPayload = {
  title: "",
  description: "",
  marathon_days: 7,
  difficulty: "INTERMEDIATE",
  category: "MIXED",
  target_band: "7.0",
  streak_goal_days: 7,
  is_visible: false,
  for_premium_users: false,
  make_three_days_free: false,
  packages: [],
  max_enrollments: null,
  external_link: "",
  external_link_title: "",
  series: null
};

const EMPTY_SERIES_FORM: AdminMarathonSeriesPayload = {
  name: "",
  description: "",
  is_active: true
};

function toNumberOrNull(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {day: "2-digit", month: "short", year: "numeric"}).format(date);
}

function MarathonStatCard({title, value, helper, icon: Icon}: {title: string; value: string; helper: string; icon: typeof Flame}) {
  return (
    <Card className="border-border/70 bg-card/70 shadow-none">
      <CardContent className="flex items-start justify-between px-6 py-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
          <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
        </div>
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  );
}

export function AdminMarathonsPageClient() {
  const t = useTranslations("adminMarathons");
  const locale = useLocale();
  const [searchValue, setSearchValue] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [premiumFilter, setPremiumFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seriesSaving, setSeriesSaving] = useState(false);
  const [marathons, setMarathons] = useState<AdminMarathonRecord[]>([]);
  const [series, setSeries] = useState<AdminMarathonSeriesRecord[]>([]);
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [notice, setNotice] = useState<SiteToastNotice | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [seriesSheetOpen, setSeriesSheetOpen] = useState(false);
  const [editingMarathon, setEditingMarathon] = useState<AdminMarathonRecord | null>(null);
  const [editingSeries, setEditingSeries] = useState<AdminMarathonSeriesRecord | null>(null);
  const [deletingMarathon, setDeletingMarathon] = useState<AdminMarathonRecord | null>(null);
  const [deletingSeries, setDeletingSeries] = useState<AdminMarathonSeriesRecord | null>(null);
  const [form, setForm] = useState<AdminMarathonPayload>(EMPTY_FORM);
  const [seriesForm, setSeriesForm] = useState<AdminMarathonSeriesPayload>(EMPTY_SERIES_FORM);
  const activePackages = useMemo(() => packages.filter((item) => item.is_active), [packages]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [marathonResponse, seriesResponse, packageResponse] = await Promise.all([
        adminMarathonsService.list({page: 1, pageSize: 200, ordering: "-created_at"}),
        adminMarathonSeriesService.list({page: 1, pageSize: 200, ordering: "name"}),
        adminPackagesService.list({page: 1, pageSize: 100, is_active: true})
      ]);
      setMarathons(marathonResponse.results);
      setSeries(seriesResponse.results);
      setPackages(packageResponse.results);
    } catch {
      setNotice({title: t("notices.loadFailed.title"), description: t("notices.loadFailed.description"), tone: "error"});
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const filteredMarathons = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    return marathons.filter((item) => {
      if (visibilityFilter !== "all") {
        const shouldBeVisible = visibilityFilter === "visible";
        if (Boolean(item.is_visible) !== shouldBeVisible) return false;
      }
      if (premiumFilter !== "all") {
        const shouldBePremium = premiumFilter === "premium";
        if (Boolean(item.for_premium_users) !== shouldBePremium) return false;
      }
      if (!query) return true;
      return [item.title, item.description, item.series_name ?? ""].join(" ").toLowerCase().includes(query);
    });
  }, [marathons, premiumFilter, searchValue, visibilityFilter]);

  const stats = useMemo(() => {
    const visibleCount = marathons.filter((item) => item.is_visible).length;
    const premiumCount = marathons.filter((item) => item.for_premium_users).length;
    const enrollmentCount = marathons.reduce((sum, item) => sum + Number(item.enrollments_count ?? 0), 0);
    return {visibleCount, premiumCount, enrollmentCount};
  }, [marathons]);

  const resetForm = () => {
    setEditingMarathon(null);
    setForm(EMPTY_FORM);
  };

  const resetSeriesForm = () => {
    setEditingSeries(null);
    setSeriesForm(EMPTY_SERIES_FORM);
  };

  const openCreateSheet = () => {
    resetForm();
    setSheetOpen(true);
  };

  const openEditSheet = (item: AdminMarathonRecord) => {
    setEditingMarathon(item);
    setForm({
      title: item.title,
      description: item.description ?? "",
      marathon_days: item.marathon_days,
      difficulty: item.difficulty,
      category: item.category,
      target_band: item.target_band,
      streak_goal_days: item.streak_goal_days,
      is_visible: item.is_visible,
      for_premium_users: item.for_premium_users,
      make_three_days_free: Boolean(item.make_three_days_free),
      packages: Array.isArray(item.packages) ? item.packages.map(String) : [],
      max_enrollments: item.max_enrollments,
      external_link: item.external_link ?? "",
      external_link_title: item.external_link_title ?? "",
      series: item.series
    });
    setSheetOpen(true);
  };

  const openCreateSeriesSheet = () => {
    resetSeriesForm();
    setSeriesSheetOpen(true);
  };

  const openEditSeriesSheet = (item: AdminMarathonSeriesRecord) => {
    setEditingSeries(item);
    setSeriesForm({name: item.name, description: item.description ?? "", is_active: item.is_active});
    setSeriesSheetOpen(true);
  };

  const togglePremiumPackage = (packageId: string) => {
    setForm((current) => {
      const selected = Array.isArray(current.packages) ? current.packages.map(String) : [];
      const exists = selected.includes(packageId);
      return {
        ...current,
        packages: exists ? selected.filter((item) => item !== packageId) : [...selected, packageId]
      };
    });
  };

  const setPremiumAccess = (checked: boolean) => {
    setForm((current) => ({
      ...current,
      for_premium_users: checked,
      make_three_days_free: checked ? Boolean(current.make_three_days_free) : false,
      packages: checked ? (Array.isArray(current.packages) && current.packages.length ? current.packages : activePackages[0]?.id ? [activePackages[0].id] : []) : []
    }));
  };

  // The backend requires every passage/part assigned to a marathon's days to carry the
  // same is_premium as the marathon's for_premium_users (it 400s with "reconcile content
  // first" otherwise). So before flipping the marathon's premium flag, align the assigned
  // content — validation itself stays on the backend and is never bypassed.
  const reconcileMarathonContentPremium = async (marathonId: string | number, targetPremium: boolean) => {
    const days = await adminMarathonsService.listDays(marathonId);
    const seenPassageIds = new Set<string>();
    const seenPartIds = new Set<string>();

    for (const day of days.results) {
      const detail = await adminMarathonsService.getDay(marathonId, day.day_number);

      for (const passage of detail.reading_passages ?? []) {
        const passageId = String(passage.id);
        if (seenPassageIds.has(passageId)) continue;
        seenPassageIds.add(passageId);
        if (passage.is_premium !== targetPremium) {
          await adminMarathonsService.patchReadingPassage(passage.id, {is_premium: targetPremium});
        }
      }

      for (const part of detail.listening_parts ?? []) {
        const partId = String(part.id);
        if (seenPartIds.has(partId)) continue;
        seenPartIds.add(partId);
        if (part.is_premium !== targetPremium) {
          await adminMarathonsService.patchListeningPart(part.id, {is_premium: targetPremium});
        }
      }
    }
  };

  const upsertMarathon = async () => {
    const selectedPackages = Array.isArray(form.packages) ? form.packages.map(String).filter(Boolean) : [];
    if (form.for_premium_users && selectedPackages.length === 0) {
      setNotice({title: "Package required", description: "Select at least one package for premium marathon access.", tone: "error"});
      return;
    }
    setSaving(true);
    try {
      const payload: AdminMarathonPayload = {
        ...form,
        title: form.title.trim(),
        description: form.description?.trim() ?? "",
        target_band: form.target_band?.trim() ? form.target_band.trim() : null,
        external_link: form.external_link?.trim() ?? "",
        external_link_title: form.external_link_title?.trim() ?? "",
        make_three_days_free: Boolean(form.for_premium_users && form.make_three_days_free),
        packages: form.for_premium_users ? selectedPackages : []
      };

      const premiumChanged =
        editingMarathon && Boolean(editingMarathon.for_premium_users) !== Boolean(form.for_premium_users);
      if (editingMarathon && premiumChanged) {
        await reconcileMarathonContentPremium(editingMarathon.id, Boolean(form.for_premium_users));
      }

      const saved = editingMarathon
        ? await adminMarathonsService.patch(editingMarathon.id, payload)
        : await adminMarathonsService.create(payload);

      setMarathons((current) =>
        editingMarathon ? current.map((item) => (String(item.id) === String(saved.id) ? saved : item)) : [saved, ...current]
      );
      setSheetOpen(false);
      resetForm();
      setNotice({title: editingMarathon ? t("notices.saved.title") : t("notices.created.title"), description: editingMarathon ? t("notices.saved.description") : t("notices.created.description"), tone: "success"});
    } catch (error) {
      const backendMessage = error instanceof AdminApiError && error.message ? error.message : "";
      setNotice({
        title: t("notices.saveFailed.title"),
        description: backendMessage || t("notices.saveFailed.description"),
        tone: "error"
      });
    } finally {
      setSaving(false);
    }
  };

  const removeMarathon = async () => {
    if (!deletingMarathon) return;
    try {
      await adminMarathonsService.remove(deletingMarathon.id);
      setMarathons((current) => current.filter((item) => String(item.id) !== String(deletingMarathon.id)));
      setDeletingMarathon(null);
      setNotice({title: t("notices.deleted.title"), description: t("notices.deleted.description"), tone: "success"});
    } catch {
      setNotice({title: t("notices.deleteFailed.title"), description: t("notices.deleteFailed.description"), tone: "error"});
    }
  };

  const upsertSeries = async () => {
    if (!seriesForm.name.trim()) return;
    setSeriesSaving(true);
    try {
      const payload = {
        name: seriesForm.name.trim(),
        description: seriesForm.description?.trim() ?? "",
        is_active: Boolean(seriesForm.is_active)
      };
      const saved = editingSeries
        ? await adminMarathonSeriesService.patch(editingSeries.id, payload)
        : await adminMarathonSeriesService.create(payload);

      setSeries((current) => {
        if (editingSeries) {
          return current.map((item) => (String(item.id) === String(saved.id) ? saved : item));
        }
        return [...current, saved].sort((left, right) => left.name.localeCompare(right.name));
      });
      setSeriesSheetOpen(false);
      resetSeriesForm();
      setNotice({title: editingSeries ? t("notices.seriesUpdated.title") : t("notices.seriesCreated.title"), description: editingSeries ? t("notices.seriesUpdated.description") : t("notices.seriesCreated.description"), tone: "success"});
    } catch {
      setNotice({title: t("notices.seriesFailed.title"), description: t("notices.seriesFailed.description"), tone: "error"});
    } finally {
      setSeriesSaving(false);
    }
  };

  const removeSeries = async () => {
    if (!deletingSeries) return;
    try {
      await adminMarathonSeriesService.remove(deletingSeries.id);
      setSeries((current) => current.filter((item) => String(item.id) !== String(deletingSeries.id)));
      setDeletingSeries(null);
      setMarathons((current) =>
        current.map((item) => (String(item.series) === String(deletingSeries.id) ? {...item, series: null, series_name: null} : item))
      );
      setNotice({title: t("notices.seriesDeleted.title"), description: t("notices.seriesDeleted.description"), tone: "success"});
    } catch {
      setNotice({title: t("notices.seriesDeleteFailed.title"), description: t("notices.seriesDeleteFailed.description"), tone: "error"});
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar
            title={t("title")}
            search={{value: searchValue, onValueChange: setSearchValue, placeholder: t("searchPlaceholder")}}
            actions={
              <>
                <Button type="button" variant="outline" className="rounded-xl" onClick={openCreateSeriesSheet}>
                  {t("actions.newSeries")}
                </Button>
                <Button type="button" className="rounded-xl" onClick={openCreateSheet}>
                  <Plus className="size-4" />
                  {t("actions.newMarathon")}
                </Button>
              </>
            }
          />

          <main className="mx-auto w-full max-w-[1480px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
            <div className="grid gap-4 xl:grid-cols-3">
              <MarathonStatCard title={t("stats.total")} value={String(marathons.length)} helper={t("stats.totalHelper")} icon={Flame} />
              <MarathonStatCard title={t("stats.visible")} value={String(stats.visibleCount)} helper={t("stats.visibleHelper")} icon={Users} />
              <MarathonStatCard title={t("stats.enrollments")} value={String(stats.enrollmentCount)} helper={t("stats.enrollmentsHelper")} icon={Trophy} />
            </div>

            <Card className="border-border/70 bg-card/70 shadow-none">
              <CardContent className="flex flex-col gap-3 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-3">
                  <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
                    <SelectTrigger className="h-10 w-[180px] rounded-xl border-border/70 bg-background/50"><SelectValue placeholder={t("filters.visibility")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("filters.allVisibility")}</SelectItem>
                      <SelectItem value="visible">{t("filters.visible")}</SelectItem>
                      <SelectItem value="hidden">{t("filters.hidden")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={premiumFilter} onValueChange={setPremiumFilter}>
                    <SelectTrigger className="h-10 w-[180px] rounded-xl border-border/70 bg-background/50"><SelectValue placeholder={t("filters.premium")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("filters.allPremium")}</SelectItem>
                      <SelectItem value="premium">{t("filters.premiumOnly")}</SelectItem>
                      <SelectItem value="free">{t("filters.freeOnly")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Badge variant="outline" className="rounded-full px-3 py-1">{series.length} {t("series.badge")}</Badge>
                  <Badge variant="outline" className="rounded-full px-3 py-1">{stats.premiumCount} {t("filters.premiumOnly")}</Badge>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
              <Card className="border-border/70 bg-card/70 shadow-none">
                <CardHeader>
                  <CardTitle>{t("list.title")}</CardTitle>
                  <CardDescription>{t("list.description")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    <div className="rounded-2xl border border-dashed border-border/70 bg-background/45 px-4 py-10 text-center text-sm text-muted-foreground">{t("loading")}</div>
                  ) : filteredMarathons.length ? (
                    <div className="grid gap-4 xl:grid-cols-2">
                      {filteredMarathons.map((item) => (
                        <div key={String(item.id)} className="rounded-3xl border border-border/70 bg-background/45 p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="truncate text-lg font-semibold tracking-tight">{item.title}</h3>
                                {item.is_visible ? <Badge className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">{t("filters.visible")}</Badge> : <Badge variant="outline" className="rounded-full">{t("filters.hidden")}</Badge>}
                                {item.for_premium_users ? <Badge className="rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300">{t("filters.premiumOnly")}</Badge> : null}
                              </div>
                              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.description || t("list.noDescription")}</p>
                            </div>
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-2xl border border-border/70 bg-card/60 px-3 py-2"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t("fields.days")}</p><p className="mt-1 font-semibold">{item.marathon_days}</p></div>
                            <div className="rounded-2xl border border-border/70 bg-card/60 px-3 py-2"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t("fields.band")}</p><p className="mt-1 font-semibold">{item.target_band ?? "-"}</p></div>
                            <div className="rounded-2xl border border-border/70 bg-card/60 px-3 py-2"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t("fields.series")}</p><p className="mt-1 truncate font-semibold">{item.series_name ?? "-"}</p></div>
                            <div className="rounded-2xl border border-border/70 bg-card/60 px-3 py-2"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t("fields.created")}</p><p className="mt-1 font-semibold">{formatDate(item.created_at)}</p></div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button asChild type="button" variant="outline" className="rounded-xl"><Link href={`/${locale}/admin/marathons/${item.id}`}>{t("actions.open")}</Link></Button>
                            <Button type="button" variant="outline" className="rounded-xl" onClick={() => openEditSheet(item)}>{t("actions.edit")}</Button>
                            <Button type="button" variant="outline" className="rounded-xl text-rose-600 dark:text-rose-300" onClick={() => setDeletingMarathon(item)}>{t("actions.delete")}</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border/70 bg-background/45 px-4 py-10 text-center text-sm text-muted-foreground">{t("empty")}</div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/70 shadow-none">
                <CardHeader>
                  <CardTitle>{t("series.title")}</CardTitle>
                  <CardDescription>{t("series.description")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {series.length ? series.map((item) => (
                    <div key={String(item.id)} className="rounded-2xl border border-border/70 bg-background/45 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold">{item.name}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{item.description || t("series.noDescription")}</p>
                        </div>
                        <Badge variant={item.is_active ? "default" : "outline"} className="rounded-full">{item.is_active ? t("series.active") : t("series.inactive")}</Badge>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => openEditSeriesSheet(item)}>{t("actions.edit")}</Button>
                        <Button type="button" variant="outline" size="sm" className="rounded-xl text-rose-600 dark:text-rose-300" onClick={() => setDeletingSeries(item)}>{t("actions.delete")}</Button>
                      </div>
                    </div>
                  )) : <p className="text-sm text-muted-foreground">{t("series.empty")}</p>}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full max-w-[560px] overflow-y-auto border-l border-border/70 bg-background/95 p-0">
          <SheetHeader>
            <SheetTitle>{editingMarathon ? t("sheet.editTitle") : t("sheet.createTitle")}</SheetTitle>
            <SheetDescription>{editingMarathon ? t("sheet.editDescription") : t("sheet.createDescription")}</SheetDescription>
          </SheetHeader>
          <div className="space-y-5 px-6 pb-6">
            <div className="space-y-2"><Label htmlFor="marathon-title">{t("fields.title")}</Label><Input id="marathon-title" value={form.title} onChange={(event) => setForm((current) => ({...current, title: event.target.value}))} className="rounded-xl border-border/70 bg-card/55" /></div>
            <div className="space-y-2"><Label htmlFor="marathon-description">{t("fields.description")}</Label><textarea id="marathon-description" value={form.description ?? ""} onChange={(event) => setForm((current) => ({...current, description: event.target.value}))} className="min-h-28 w-full rounded-xl border border-border/70 bg-card/55 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>{t("fields.days")}</Label><Input type="number" min={1} value={String(form.marathon_days)} onChange={(event) => setForm((current) => ({...current, marathon_days: Math.max(1, Number(event.target.value) || 1)}))} className="rounded-xl border-border/70 bg-card/55" /></div>
              <div className="space-y-2"><Label>{t("fields.band")}</Label><Input value={form.target_band ?? ""} onChange={(event) => setForm((current) => ({...current, target_band: event.target.value}))} className="rounded-xl border-border/70 bg-card/55" /></div>
              <div className="space-y-2"><Label>{t("fields.difficulty")}</Label><Select value={String(form.difficulty)} onValueChange={(value) => setForm((current) => ({...current, difficulty: value}))}><SelectTrigger className="rounded-xl border-border/70 bg-card/55"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="BEGINNER">{t("options.beginner")}</SelectItem><SelectItem value="INTERMEDIATE">{t("options.intermediate")}</SelectItem><SelectItem value="ADVANCED">{t("options.advanced")}</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>{t("fields.category")}</Label><Select value={String(form.category)} onValueChange={(value) => setForm((current) => ({...current, category: value}))}><SelectTrigger className="rounded-xl border-border/70 bg-card/55"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MIXED">{t("options.mixed")}</SelectItem><SelectItem value="READING_FOCUS">{t("options.reading")}</SelectItem><SelectItem value="LISTENING_FOCUS">{t("options.listening")}</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>{t("fields.streakGoal")}</Label><Input type="number" min={1} value={String(form.streak_goal_days ?? 7)} onChange={(event) => setForm((current) => ({...current, streak_goal_days: Math.max(1, Number(event.target.value) || 1)}))} className="rounded-xl border-border/70 bg-card/55" /></div>
              <div className="space-y-2"><Label>{t("fields.maxEnrollments")}</Label><Input type="number" min={1} value={form.max_enrollments == null ? "" : String(form.max_enrollments)} onChange={(event) => setForm((current) => ({...current, max_enrollments: toNumberOrNull(event.target.value)}))} className="rounded-xl border-border/70 bg-card/55" /></div>
            </div>
            <div className="space-y-2"><Label>{t("fields.series")}</Label><Select value={form.series == null ? "none" : String(form.series)} onValueChange={(value) => setForm((current) => ({...current, series: value === "none" ? null : value}))}><SelectTrigger className="rounded-xl border-border/70 bg-card/55"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">{t("series.none")}</SelectItem>{series.map((item) => <SelectItem key={String(item.id)} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>{t("fields.externalLink")}</Label><Input value={form.external_link ?? ""} onChange={(event) => setForm((current) => ({...current, external_link: event.target.value}))} className="rounded-xl border-border/70 bg-card/55" /></div>
              <div className="space-y-2"><Label>{t("fields.externalLinkTitle")}</Label><Input value={form.external_link_title ?? ""} onChange={(event) => setForm((current) => ({...current, external_link_title: event.target.value}))} className="rounded-xl border-border/70 bg-card/55" /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/55 px-4 py-3"><div><p className="font-medium">{t("fields.visible")}</p><p className="text-sm text-muted-foreground">{t("fields.visibleHint")}</p></div><Switch checked={Boolean(form.is_visible)} onCheckedChange={(checked) => setForm((current) => ({...current, is_visible: checked}))} /></div>
              <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/55 px-4 py-3"><div><p className="font-medium">{t("fields.premium")}</p><p className="text-sm text-muted-foreground">{t("fields.premiumHint")}</p></div><Switch checked={Boolean(form.for_premium_users)} onCheckedChange={setPremiumAccess} /></div>
            </div>
            {form.for_premium_users ? (
              <div className="space-y-4 rounded-3xl border border-amber-500/25 bg-amber-500/5 p-4">
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-background/55 px-4 py-3">
                  <div>
                    <p className="font-medium">First 3 days free</p>
                    <p className="text-sm text-muted-foreground">Let students try the first marathon days before premium lock starts.</p>
                  </div>
                  <Switch checked={Boolean(form.make_three_days_free)} onCheckedChange={(checked) => setForm((current) => ({...current, make_three_days_free: checked}))} />
                </div>
                <div className="space-y-2">
                  <Label>Packages that unlock this marathon</Label>
                  {activePackages.length ? (
                    <div className="flex flex-wrap gap-2">
                      {activePackages.map((item) => {
                        const selected = (form.packages ?? []).map(String).includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => togglePremiumPackage(item.id)}
                            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                              selected
                                ? "border-blue-500 bg-blue-500 text-white shadow-sm"
                                : "border-border/70 bg-background/60 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {item.name}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="rounded-2xl border border-dashed border-border/70 bg-background/55 px-4 py-3 text-sm text-muted-foreground">
                      Create an active package before saving a premium marathon.
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
          <SheetFooter>
            <Button type="button" variant="ghost" className="rounded-xl" onClick={() => setSheetOpen(false)}>{t("actions.cancel")}</Button>
            <Button type="button" className="rounded-xl" disabled={saving || !form.title.trim()} onClick={() => void upsertMarathon()}>{saving ? t("actions.saving") : t("actions.save")}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={seriesSheetOpen} onOpenChange={setSeriesSheetOpen}>
        <SheetContent side="right" className="w-full max-w-[460px] border-l border-border/70 bg-background/95 p-0">
          <SheetHeader>
            <SheetTitle>{editingSeries ? t("seriesSheet.editTitle") : t("seriesSheet.title")}</SheetTitle>
            <SheetDescription>{editingSeries ? t("seriesSheet.editDescription") : t("seriesSheet.description")}</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-6 pb-6">
            <div className="space-y-2"><Label>{t("series.fields.name")}</Label><Input value={seriesForm.name} onChange={(event) => setSeriesForm((current) => ({...current, name: event.target.value}))} className="rounded-xl border-border/70 bg-card/55" /></div>
            <div className="space-y-2"><Label>{t("series.fields.description")}</Label><textarea value={seriesForm.description ?? ""} onChange={(event) => setSeriesForm((current) => ({...current, description: event.target.value}))} className="min-h-24 w-full rounded-xl border border-border/70 bg-card/55 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30" /></div>
            <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/55 px-4 py-3"><div><p className="font-medium">{t("series.fields.active")}</p><p className="text-sm text-muted-foreground">{t("series.fields.activeHint")}</p></div><Switch checked={Boolean(seriesForm.is_active)} onCheckedChange={(checked) => setSeriesForm((current) => ({...current, is_active: checked}))} /></div>
          </div>
          <SheetFooter>
            <Button type="button" variant="ghost" className="rounded-xl" onClick={() => setSeriesSheetOpen(false)}>{t("actions.cancel")}</Button>
            <Button type="button" className="rounded-xl" disabled={seriesSaving || !seriesForm.name.trim()} onClick={() => void upsertSeries()}>{seriesSaving ? t("actions.saving") : t("actions.save")}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmModal open={Boolean(deletingMarathon)} title={t("delete.title")} description={t("delete.description", {title: deletingMarathon?.title ?? ""})} confirmText={t("actions.delete")} cancelText={t("actions.cancel")} confirmVariant="destructive" onCancel={() => setDeletingMarathon(null)} onConfirm={() => void removeMarathon()} />
      <ConfirmModal open={Boolean(deletingSeries)} title={t("seriesDelete.title")} description={t("seriesDelete.description", {title: deletingSeries?.name ?? ""})} confirmText={t("actions.delete")} cancelText={t("actions.cancel")} confirmVariant="destructive" onCancel={() => setDeletingSeries(null)} onConfirm={() => void removeSeries()} />
      <SiteToast notice={notice} />
    </div>
  );
}
