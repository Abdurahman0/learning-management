"use client";

import {useEffect, useMemo, useState} from "react";
import {Download, Edit3, ExternalLink, FileText, Loader2, Plus, Search, Trash2} from "lucide-react";
import {useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ConfirmModal} from "@/components/ui/confirm-modal";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import {cn} from "@/lib/utils";
import {mistakeReasonsService} from "@/src/services/admin/mistakeReasons.service";
import type {MistakeReasonCategory, MistakeReasonModule, MistakeReasonPayload, MistakeReasonRecord} from "@/src/services/admin/types";

import {AdminSidebar, AdminSidebarMobileNav} from "../../_components/AdminSidebar";

type ModuleFilter = MistakeReasonModule | "all";
type CategoryFilter = MistakeReasonCategory | "all";

type FormState = {
  reason: string;
  module: MistakeReasonModule;
  mistake_category: MistakeReasonCategory;
  general_solution: string;
  solution_1: string;
  solution_2: string;
  solution_3: string;
  link_url: string;
  removeFile: boolean;
  file: File | null;
};

const MAX_REASON_FILE_BYTES = 1024 * 1024;

const EMPTY_FORM: FormState = {
  reason: "",
  module: "READING",
  mistake_category: "fully_incorrect",
  general_solution: "",
  solution_1: "",
  solution_2: "",
  solution_3: "",
  link_url: "",
  removeFile: false,
  file: null
};

function trimPayload(form: FormState): MistakeReasonPayload {
  return {
    reason: form.reason.trim(),
    module: form.module,
    mistake_category: form.mistake_category,
    general_solution: form.general_solution.trim(),
    solution_1: form.solution_1.trim(),
    solution_2: form.solution_2.trim(),
    solution_3: form.solution_3.trim(),
    link_url: form.link_url.trim(),
    is_file_consists: Boolean(form.file),
    file: form.file
  };
}

function toEditForm(record: MistakeReasonRecord): FormState {
  return {
    reason: record.reason,
    module: record.module,
    mistake_category: record.mistake_category,
    general_solution: record.general_solution,
    solution_1: record.solution_1,
    solution_2: record.solution_2,
    solution_3: record.solution_3,
    link_url: record.link_url ?? "",
    removeFile: false,
    file: null
  };
}

function isSafeDownloadUrl(value: string | null) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function getResourceUrl(item: MistakeReasonRecord) {
  return item.resource_url ?? item.file_url ?? item.link_url;
}

function getFileNameFromUrl(value: string | null, fallback: string) {
  if (!value) return fallback;
  try {
    const url = new URL(value);
    const name = url.pathname.split("/").filter(Boolean).pop();
    return name ? decodeURIComponent(name).replace(/[_-]+/g, " ") : fallback;
  } catch {
    return fallback;
  }
}

async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const imageUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not read image file."));
      img.src = imageUrl;
    });
    const canvas = document.createElement("canvas");
    const maxDimension = 1600;
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, file.type === "image/png" ? "image/webp" : "image/jpeg", 0.78);
    });
    if (!blob || blob.size >= file.size) return file;

    const extension = blob.type === "image/webp" ? "webp" : "jpg";
    const baseName = file.name.replace(/\.[^.]+$/, "") || "mistake-resource";
    return new File([blob], `${baseName}.${extension}`, {type: blob.type, lastModified: Date.now()});
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export function MistakeReasonsPageClient() {
  const t = useTranslations("adminMistakeReasons");
  const [items, setItems] = useState<MistakeReasonRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [moduleFilter, setModuleFilter] = useState<ModuleFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<MistakeReasonRecord | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MistakeReasonRecord | null>(null);

  const loadReasons = async (module: ModuleFilter = moduleFilter, mistakeCategory: CategoryFilter = categoryFilter) => {
    setIsLoading(true);
    try {
      const response = await mistakeReasonsService.list({module, mistakeCategory});
      setItems(response.results);
    } catch (requestError) {
      setItems([]);
      setError(requestError instanceof Error ? requestError.message : t("errors.load"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadReasons(moduleFilter, categoryFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleFilter, categoryFilter]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => {
      return (
        item.reason.toLowerCase().includes(query) ||
        item.general_solution.toLowerCase().includes(query) ||
        item.solution_1.toLowerCase().includes(query) ||
        item.solution_2.toLowerCase().includes(query) ||
        item.solution_3.toLowerCase().includes(query) ||
        (item.link_url ?? "").toLowerCase().includes(query)
      );
    });
  }, [items, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setSheetOpen(true);
  };

  const openEdit = (record: MistakeReasonRecord) => {
    setEditing(record);
    setForm(toEditForm(record));
    setError(null);
    setSheetOpen(true);
  };

  const handleFileChange = async (file: File | null) => {
    if (!file) {
      setForm((current) => ({...current, file: null}));
      return;
    }

    setError(null);
    try {
      const nextFile = await compressImageFile(file);
      if (nextFile.size > MAX_REASON_FILE_BYTES) {
        setForm((current) => ({...current, file: null}));
        setError(t("errors.fileTooLarge"));
        return;
      }

      setForm((current) => ({...current, file: nextFile, link_url: "", removeFile: false}));
    } catch {
      setForm((current) => ({...current, file: null}));
      setError(t("errors.fileRead"));
    }
  };

  const handleSubmit = async () => {
    const payload = trimPayload(form);
    if (!payload.reason) {
      setError(t("errors.reasonRequired"));
      return;
    }
    if (!payload.general_solution) {
      setError(t("errors.generalSolutionRequired"));
      return;
    }
    const hasExistingFile = Boolean(editing?.file_url) && !form.removeFile;
    const hasFileResource = Boolean(form.file) || hasExistingFile;
    const hasLinkResource = Boolean(payload.link_url);
    if (hasFileResource && hasLinkResource) {
      setError(t("errors.singleResourceOnly"));
      return;
    }
    if (!hasFileResource && !hasLinkResource) {
      setError(t("errors.resourceRequired"));
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      if (editing) {
        const updatePayload: Partial<MistakeReasonPayload> = {...payload, file: form.file};
        if (form.removeFile) {
          updatePayload.is_file_consists = false;
        } else if (form.file) {
          updatePayload.is_file_consists = true;
          updatePayload.link_url = "";
        } else {
          delete updatePayload.is_file_consists;
        }
        await mistakeReasonsService.update(String(editing.id), updatePayload);
      } else {
        const createPayload: MistakeReasonPayload = form.file
          ? {...payload, link_url: "", is_file_consists: true}
            : {
              reason: payload.reason,
              module: payload.module,
              mistake_category: payload.mistake_category,
              general_solution: payload.general_solution,
              solution_1: payload.solution_1,
              solution_2: payload.solution_2,
              solution_3: payload.solution_3,
              link_url: payload.link_url
            };
        await mistakeReasonsService.create(createPayload);
      }
      setSheetOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      await loadReasons(moduleFilter, categoryFilter);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("errors.save"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSaving(true);
    try {
      await mistakeReasonsService.remove(String(deleteTarget.id));
      setDeleteTarget(null);
      await loadReasons(moduleFilter, categoryFilter);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("errors.delete"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <AdminSidebarMobileNav />
                <div className="min-w-0">
                  <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{t("title")}</h1>
                  <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
                </div>
              </div>
              <Button onClick={openCreate} className="h-10 rounded-xl">
                <Plus className="size-4" />
                {t("create")}
              </Button>
            </div>
          </header>

          <main className="mx-auto min-w-0 w-full max-w-[1480px] space-y-4 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            {error ? (
              <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-200">
                {error}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/70 p-3 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="h-10 rounded-xl pl-9"
                />
              </div>
              <Select value={moduleFilter} onValueChange={(value) => setModuleFilter(value as ModuleFilter)}>
                <SelectTrigger className="h-10 w-full rounded-xl sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("modules.all")}</SelectItem>
                  <SelectItem value="READING">{t("modules.READING")}</SelectItem>
                  <SelectItem value="LISTENING">{t("modules.LISTENING")}</SelectItem>
                  <SelectItem value="BOTH">{t("modules.BOTH")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as CategoryFilter)}>
                <SelectTrigger className="h-10 w-full rounded-xl sm:w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("categories.all")}</SelectItem>
                  <SelectItem value="fully_incorrect">{t("categories.fully_incorrect")}</SelectItem>
                  <SelectItem value="blank_answer">{t("categories.blank_answer")}</SelectItem>
                  <SelectItem value="misspelled">{t("categories.misspelled")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="rounded-2xl border-border/70 bg-card/80 shadow-none">
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <CardTitle className="text-lg font-semibold">{t("listTitle")}</CardTitle>
                <Badge variant="outline" className="rounded-full">{filteredItems.length}</Badge>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center gap-2 px-4 py-8 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    {t("loading")}
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="px-4 py-8 text-sm text-muted-foreground">{t("empty")}</div>
                ) : (
                  <div className="divide-y divide-border/70">
                    {filteredItems.map((item) => (
                      <article key={String(item.id)} className="grid gap-3 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="rounded-full border-blue-400/30 bg-blue-500/10 text-blue-700 dark:text-blue-200">
                              {t(`modules.${item.module}`)}
                            </Badge>
                            <Badge variant="outline" className="rounded-full">
                              {item.mistake_category_display || t(`categories.${item.mistake_category}`)}
                            </Badge>
                            {item.is_file_consists ? (
                              <Badge variant="outline" className="rounded-full">
                                <FileText className="size-3" />
                                {t("fileAttached")}
                              </Badge>
                            ) : null}
                            {item.resource_type === "link" ? (
                              <Badge variant="outline" className="rounded-full">
                                <ExternalLink className="size-3" />
                                {t("linkAttached")}
                              </Badge>
                            ) : null}
                          </div>
                          <h2 className="text-base font-semibold leading-snug">{item.reason}</h2>
                          {item.general_solution ? (
                            <p className="rounded-2xl border border-blue-400/20 bg-blue-500/8 px-3 py-2 text-sm leading-relaxed text-foreground/90">
                              {item.general_solution}
                            </p>
                          ) : null}
                          <ul className="space-y-1.5 text-sm text-muted-foreground">
                            {[item.solution_1, item.solution_2, item.solution_3].filter(Boolean).map((solution, index) => (
                              <li key={`${item.id}-solution-${index}`} className="flex gap-2">
                                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                                <span>{solution}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          {isSafeDownloadUrl(getResourceUrl(item)) ? (
                            <Button variant="outline" size="sm" asChild>
                              <a href={getResourceUrl(item) ?? "#"} target="_blank" rel="noopener noreferrer">
                                {item.resource_type === "link" ? <ExternalLink className="size-4" /> : <Download className="size-4" />}
                                {item.resource_type === "link"
                                  ? t("openLink")
                                  : getFileNameFromUrl(getResourceUrl(item), t("download"))}
                              </a>
                            </Button>
                          ) : null}
                          <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                            <Edit3 className="size-4" />
                            {t("edit")}
                          </Button>
                          <Button variant="outline" size="sm" className="text-rose-600 hover:text-rose-600" onClick={() => setDeleteTarget(item)}>
                            <Trash2 className="size-4" />
                            {t("delete")}
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{editing ? t("form.editTitle") : t("form.createTitle")}</SheetTitle>
            <SheetDescription>{t("form.description")}</SheetDescription>
          </SheetHeader>

          <div className="grid gap-4 px-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reason">{t("form.reason")}</Label>
              <Input id="reason" value={form.reason} onChange={(event) => setForm((current) => ({...current, reason: event.target.value}))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="general-solution">{t("form.generalSolution")}</Label>
              <textarea
                id="general-solution"
                value={form.general_solution}
                onChange={(event) => setForm((current) => ({...current, general_solution: event.target.value}))}
                className="min-h-24 resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </div>
            <div className="grid gap-2">
              <Label>{t("form.module")}</Label>
              <Select value={form.module} onValueChange={(value) => setForm((current) => ({...current, module: value as MistakeReasonModule}))}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="READING">{t("modules.READING")}</SelectItem>
                  <SelectItem value="LISTENING">{t("modules.LISTENING")}</SelectItem>
                  <SelectItem value="BOTH">{t("modules.BOTH")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{t("form.category")}</Label>
              <Select value={form.mistake_category} onValueChange={(value) => setForm((current) => ({...current, mistake_category: value as MistakeReasonCategory}))}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fully_incorrect">{t("categories.fully_incorrect")}</SelectItem>
                  <SelectItem value="blank_answer">{t("categories.blank_answer")}</SelectItem>
                  <SelectItem value="misspelled">{t("categories.misspelled")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(["solution_1", "solution_2", "solution_3"] as const).map((field, index) => (
              <div key={field} className="grid gap-2">
                <Label htmlFor={field}>{t("form.solution", {number: index + 1})}</Label>
                <textarea
                  id={field}
                  value={form[field]}
                  onChange={(event) => setForm((current) => ({...current, [field]: event.target.value}))}
                  className="min-h-24 resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </div>
            ))}
            <div className="grid gap-2">
              <Label htmlFor="reason-link">{t("form.link")}</Label>
              <Input
                id="reason-link"
                type="url"
                value={form.link_url}
                disabled={Boolean(form.file) || (Boolean(editing?.file_url) && !form.removeFile)}
                placeholder="https://..."
                onChange={(event) => setForm((current) => ({...current, link_url: event.target.value, file: event.target.value.trim() ? null : current.file}))}
              />
              <p className="text-xs text-muted-foreground">{t("form.resourceHint")}</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason-file">{t("form.file")}</Label>
              <Input
                id="reason-file"
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                disabled={Boolean(form.link_url.trim())}
                onChange={(event) => {
                  void handleFileChange(event.target.files?.[0] ?? null);
                  event.currentTarget.value = "";
                }}
              />
              {form.file ? (
                <p className="text-xs text-muted-foreground">
                  {form.file.name} - {Math.ceil(form.file.size / 1024)} KB
                </p>
              ) : null}
              {editing?.file_url ? (
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={form.removeFile}
                    onChange={(event) => setForm((current) => ({...current, removeFile: event.target.checked, file: event.target.checked ? null : current.file}))}
                    className="size-4"
                  />
                  {t("form.removeFile")}
                </label>
              ) : null}
            </div>

            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          </div>

          <SheetFooter className="gap-2">
            <Button variant="outline" onClick={() => setSheetOpen(false)} disabled={isSaving}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
              {editing ? t("save") : t("create")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title={t("deleteModal.title")}
        description={deleteTarget ? t("deleteModal.description", {reason: deleteTarget.reason}) : ""}
        confirmText={t("deleteModal.confirm")}
        cancelText={t("cancel")}
        confirmVariant="destructive"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        className={cn(isSaving && "pointer-events-none opacity-70")}
      />
    </div>
  );
}
