"use client";

import Link from "next/link";
import {useRouter, useSearchParams} from "next/navigation";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {ArrowLeft, ExternalLink, Trash2, Video, Wand2} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {AdminSidebar} from "@/app/[locale]/(admin)/admin/_components/AdminSidebar";
import {AdminTopbar} from "@/app/[locale]/(admin)/admin/_components/AdminTopbar";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {ConfirmModal} from "@/components/ui/confirm-modal";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {SiteToast, type SiteToastNotice} from "@/components/ui/site-toast";
import {Switch} from "@/components/ui/switch";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {adminMarathonsService} from "@/src/services/admin/marathons.service";
import {AdminApiError} from "@/src/services/admin/types";
import type {
  AdminEntityId,
  AdminMarathonDayDetailRecord,
  AdminMarathonDayPayload,
  AdminMarathonEnrollmentRecord,
  AdminMarathonExternalLinkPayload,
  AdminMarathonExternalLinkRecord,
  AdminMarathonLeaderboardEntry,
  AdminMarathonListeningPartPayload,
  AdminMarathonListeningPartRecord,
  AdminMarathonReadingPassagePayload,
  AdminMarathonReadingPassageRecord,
  AdminMarathonRecord
} from "@/src/services/admin/types";

const EMPTY_DAY_FORM: AdminMarathonDayPayload = {
  title: "",
  content: "",
  difficulty: null,
  estimated_minutes: null,
  is_bonus_day: false
};

const EMPTY_LINK_FORM: AdminMarathonExternalLinkPayload = {
  title: "",
  url: "",
  order: 0
};

const EMPTY_PASSAGE_FORM: AdminMarathonReadingPassagePayload = {
  title: "",
  passage_text: "",
  difficulty_level: "INTERMEDIATE",
  topic: "",
  estimated_time_minutes: 20,
  max_questions: 13,
  time_limit_seconds: 1200,
  is_active: true
};

const EMPTY_PART_FORM: AdminMarathonListeningPartPayload = {
  part_number: "",
  title: "",
  transcript_text: "",
  difficulty_level: "INTERMEDIATE",
  estimated_time_minutes: 10,
  max_questions: 10,
  time_limit_seconds: 600,
  is_active: true,
  audio_file: null,
  remove_audio: false
};

type ContentLinkEditorState = {
  kind: "passage" | "part";
  contentId: AdminEntityId;
  title: string;
  url: string;
};

function getAdminErrorDescription(cause: unknown, fallback: string) {
  return cause instanceof AdminApiError && cause.message ? cause.message : fallback;
}

function normalizeHttpUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function toNumberOrNull(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatMinutes(value?: number | null) {
  if (value == null) return "-";
  return `${value} min`;
}

function ResourceForm({
  t,
  value,
  saving,
  isEditing,
  onChange,
  onSubmit,
  onCancel
}: {
  t: ReturnType<typeof useTranslations<"adminMarathons">>;
  value: AdminMarathonExternalLinkPayload;
  saving: boolean;
  isEditing: boolean;
  onChange: (next: AdminMarathonExternalLinkPayload) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-[1fr_1.3fr_120px_auto_auto]">
      <Input
        value={value.title}
        onChange={(event) => onChange({...value, title: event.target.value})}
        placeholder={t("detail.linkTitlePlaceholder")}
        className="rounded-xl border-border/70 bg-card/55"
      />
      <Input
        value={value.url}
        onChange={(event) => onChange({...value, url: event.target.value})}
        placeholder={t("detail.linkUrlPlaceholder")}
        className="rounded-xl border-border/70 bg-card/55"
      />
      <Input
        value={String(value.order ?? 0)}
        onChange={(event) => onChange({...value, order: Number(event.target.value) || 0})}
        className="rounded-xl border-border/70 bg-card/55"
      />
      <Button type="button" className="rounded-xl" disabled={saving} onClick={onSubmit}>
        {isEditing ? t("actions.save") : t("actions.add")}
      </Button>
      {isEditing ? (
        <Button type="button" variant="outline" className="rounded-xl" onClick={onCancel}>
          {t("actions.cancel")}
        </Button>
      ) : null}
    </div>
  );
}

function ReadingPassageForm({
  t,
  value,
  saving,
  onChange,
  onSubmit
}: {
  t: ReturnType<typeof useTranslations<"adminMarathons">>;
  value: AdminMarathonReadingPassagePayload;
  saving: boolean;
  onChange: (next: AdminMarathonReadingPassagePayload) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-dashed border-border/70 bg-card/55 p-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold">{t("detail.readingLibraryTitle")}</p>
        <p className="text-sm text-muted-foreground">{t("detail.readingLibraryDescription")}</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("fields.title")}</Label>
          <Input
            value={value.title}
            onChange={(event) => onChange({...value, title: event.target.value})}
            className="rounded-xl border-border/70 bg-card/55"
          />
        </div>
        <div className="space-y-2">
          <Label>{t("detail.topic")}</Label>
          <Input
            value={value.topic ?? ""}
            onChange={(event) => onChange({...value, topic: event.target.value})}
            className="rounded-xl border-border/70 bg-card/55"
          />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <Input
          value={String(value.estimated_time_minutes ?? 20)}
          onChange={(event) => onChange({...value, estimated_time_minutes: toNumberOrNull(event.target.value) ?? 20})}
          className="rounded-xl border-border/70 bg-card/55"
        />
        <Input
          value={String(value.max_questions)}
          onChange={(event) => onChange({...value, max_questions: Math.max(1, Number(event.target.value) || 1)})}
          className="rounded-xl border-border/70 bg-card/55"
        />
        <Input
          value={String(value.time_limit_seconds ?? 1200)}
          onChange={(event) => onChange({...value, time_limit_seconds: toNumberOrNull(event.target.value) ?? 1200})}
          className="rounded-xl border-border/70 bg-card/55"
        />
        <Button type="button" className="rounded-xl" disabled={saving} onClick={onSubmit}>
          {t("detail.createPassageAndOpenBuilder")}
        </Button>
      </div>
    </div>
  );
}

function ListeningPartForm({
  t,
  value,
  saving,
  onChange,
  onSubmit
}: {
  t: ReturnType<typeof useTranslations<"adminMarathons">>;
  value: AdminMarathonListeningPartPayload;
  saving: boolean;
  onChange: (next: AdminMarathonListeningPartPayload) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-dashed border-border/70 bg-card/55 p-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold">{t("detail.listeningLibraryTitle")}</p>
        <p className="text-sm text-muted-foreground">{t("detail.listeningLibraryDescription")}</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <Input
          value={value.title}
          onChange={(event) => onChange({...value, title: event.target.value})}
          placeholder={t("fields.title")}
          className="rounded-xl border-border/70 bg-card/55"
        />
        <Input
          value={value.part_number ?? ""}
          onChange={(event) => onChange({...value, part_number: event.target.value})}
          placeholder={t("detail.partNumber")}
          className="rounded-xl border-border/70 bg-card/55"
        />
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <Input
          value={String(value.estimated_time_minutes ?? 10)}
          onChange={(event) => onChange({...value, estimated_time_minutes: toNumberOrNull(event.target.value) ?? 10})}
          className="rounded-xl border-border/70 bg-card/55"
        />
        <Input
          value={String(value.max_questions)}
          onChange={(event) => onChange({...value, max_questions: Math.max(1, Number(event.target.value) || 1)})}
          className="rounded-xl border-border/70 bg-card/55"
        />
        <Input
          value={String(value.time_limit_seconds ?? 600)}
          onChange={(event) => onChange({...value, time_limit_seconds: toNumberOrNull(event.target.value) ?? 600})}
          className="rounded-xl border-border/70 bg-card/55"
        />
        <Button type="button" className="rounded-xl" disabled={saving} onClick={onSubmit}>
          {t("detail.createPartAndOpenBuilder")}
        </Button>
      </div>
    </div>
  );
}

export function AdminMarathonDetailPageClient({marathonId}: {marathonId: string}) {
  const t = useTranslations("adminMarathons");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromQuery = searchParams.get("tab");
  const refreshToken = searchParams.get("refresh");
  const refreshType = searchParams.get("type");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"resources" | "reading" | "listening" | "enrollments" | "leaderboard">(
    tabFromQuery === "reading" || tabFromQuery === "listening" || tabFromQuery === "enrollments" || tabFromQuery === "leaderboard"
      ? tabFromQuery
      : "resources"
  );
  const [notice, setNotice] = useState<SiteToastNotice | null>(null);
  const [marathon, setMarathon] = useState<AdminMarathonRecord | null>(null);
  const [days, setDays] = useState<AdminMarathonDayDetailRecord[]>([]);
  const [selectedDayNumber, setSelectedDayNumber] = useState(1);
  const [enrollments, setEnrollments] = useState<AdminMarathonEnrollmentRecord[]>([]);
  const [leaderboard, setLeaderboard] = useState<AdminMarathonLeaderboardEntry[]>([]);
  const [readingPassages, setReadingPassages] = useState<AdminMarathonReadingPassageRecord[]>([]);
  const [listeningParts, setListeningParts] = useState<AdminMarathonListeningPartRecord[]>([]);
  const [dayForm, setDayForm] = useState<AdminMarathonDayPayload>(EMPTY_DAY_FORM);
  const [linkForm, setLinkForm] = useState<AdminMarathonExternalLinkPayload>(EMPTY_LINK_FORM);
  const [passageForm, setPassageForm] = useState<AdminMarathonReadingPassagePayload>(EMPTY_PASSAGE_FORM);
  const [partForm, setPartForm] = useState<AdminMarathonListeningPartPayload>(EMPTY_PART_FORM);
  const [editingLink, setEditingLink] = useState<AdminMarathonExternalLinkRecord | null>(null);
  const [selectedPassageId, setSelectedPassageId] = useState("none");
  const [selectedPartId, setSelectedPartId] = useState("none");
  const [contentLinkEditor, setContentLinkEditor] = useState<ContentLinkEditorState | null>(null);
  const [savingContentLink, setSavingContentLink] = useState(false);
  const [savingDay, setSavingDay] = useState(false);
  const [savingLink, setSavingLink] = useState(false);
  const [savingPassage, setSavingPassage] = useState(false);
  const [savingPart, setSavingPart] = useState(false);
  const [deletingLinkId, setDeletingLinkId] = useState<AdminEntityId | null>(null);
  const [deletingPassageId, setDeletingPassageId] = useState<AdminEntityId | null>(null);
  const [deletingPartId, setDeletingPartId] = useState<AdminEntityId | null>(null);
  const selectedDayNumberRef = useRef(selectedDayNumber);

  const selectedDay = useMemo(
    () => days.find((item) => item.day_number === selectedDayNumber) ?? null,
    [days, selectedDayNumber]
  );

  const unassignedPassages = useMemo(() => {
    const assigned = new Set((selectedDay?.reading_passages ?? []).map((item) => String(item.id)));
    return readingPassages.filter((item) => !assigned.has(String(item.id)));
  }, [readingPassages, selectedDay]);

  const unassignedParts = useMemo(() => {
    const assigned = new Set((selectedDay?.listening_parts ?? []).map((item) => String(item.id)));
    return listeningParts.filter((item) => !assigned.has(String(item.id)));
  }, [listeningParts, selectedDay]);

  useEffect(() => {
    selectedDayNumberRef.current = selectedDayNumber;
  }, [selectedDayNumber]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const hydrateDayForm = (day: AdminMarathonDayDetailRecord | null) => {
    if (!day) {
      setDayForm(EMPTY_DAY_FORM);
      return;
    }

    setDayForm({
      title: day.title ?? "",
      content: day.content ?? "",
      difficulty: day.difficulty,
      estimated_minutes: day.estimated_minutes,
      is_bonus_day: day.is_bonus_day
    });
  };

  const loadAll = useCallback(async (preferredDay?: number) => {
    setLoading(true);
    try {
      const marathonRecord = await adminMarathonsService.getById(marathonId);
      const [daysResponse, enrollmentsResponse, leaderboardResponse, passagesResponse, partsResponse] =
        await Promise.all([
          adminMarathonsService.listDays(marathonId),
          adminMarathonsService.listEnrollments(marathonId, {page: 1, pageSize: 100}),
          adminMarathonsService.getLeaderboard(marathonId),
          adminMarathonsService.listReadingPassages(marathonId, {page: 1, pageSize: 100}),
          adminMarathonsService.listListeningParts(marathonId, {page: 1, pageSize: 100})
        ]);

      const dayRecords = await Promise.all(
        daysResponse.results.map((day) => adminMarathonsService.getDay(marathonId, day.day_number))
      );

      setMarathon(marathonRecord);
      setDays(dayRecords);
      setEnrollments(enrollmentsResponse.results);
      setLeaderboard(leaderboardResponse.results);
      setReadingPassages(passagesResponse.results);
      setListeningParts(partsResponse.results);

      const dayToSelect = preferredDay ?? selectedDayNumberRef.current ?? dayRecords[0]?.day_number ?? 1;
      setSelectedDayNumber(dayToSelect);
      hydrateDayForm(dayRecords.find((item) => item.day_number === dayToSelect) ?? dayRecords[0] ?? null);
    } catch {
      setNotice({title: t("notices.loadFailed.title"), description: t("notices.loadFailed.description"), tone: "error"});
    } finally {
      setLoading(false);
    }
  }, [marathonId, t]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (
      tabFromQuery === "resources" ||
      tabFromQuery === "reading" ||
      tabFromQuery === "listening" ||
      tabFromQuery === "enrollments" ||
      tabFromQuery === "leaderboard"
    ) {
      setActiveTab(tabFromQuery);
    }
  }, [tabFromQuery]);

  useEffect(() => {
    if (!refreshToken) return;
    void loadAll();
  }, [loadAll, refreshToken]);

  useEffect(() => {
    if (!refreshToken || !refreshType || loading) return;

    const hydrateRefreshedOwner = async () => {
      try {
        if (refreshType === "reading") {
          const passage = await adminMarathonsService.getReadingPassageById(refreshToken);
          setReadingPassages((current) => {
            if (current.some((item) => String(item.id) === String(passage.id))) {
              return current;
            }
            return [passage, ...current];
          });
        }

        if (refreshType === "listening") {
          const part = await adminMarathonsService.getListeningPartById(refreshToken);
          setListeningParts((current) => {
            if (current.some((item) => String(item.id) === String(part.id))) {
              return current;
            }
            return [part, ...current];
          });
        }
      } catch {
        // Keep primary page data as source of truth; this is only a return-path fallback.
      }
    };

    void hydrateRefreshedOwner();
  }, [loading, refreshToken, refreshType]);

  useEffect(() => {
    hydrateDayForm(selectedDay);
  }, [selectedDay]);

  const resetLinkForm = () => {
    setEditingLink(null);
    setLinkForm(EMPTY_LINK_FORM);
  };

  const resetPassageForm = () => setPassageForm(EMPTY_PASSAGE_FORM);

  const resetPartForm = () => setPartForm(EMPTY_PART_FORM);

  const saveDay = async () => {
    if (!selectedDay) return;
    setSavingDay(true);
    try {
      const updated = await adminMarathonsService.patchDay(marathonId, selectedDay.day_number, dayForm);
      setDays((current) => current.map((item) => (item.day_number === updated.day_number ? updated : item)));
      hydrateDayForm(updated);
      setNotice({title: t("notices.daySaved.title"), description: t("notices.daySaved.description"), tone: "success"});
    } catch {
      setNotice({title: t("notices.dayFailed.title"), description: t("notices.dayFailed.description"), tone: "error"});
    } finally {
      setSavingDay(false);
    }
  };

  const upsertLink = async () => {
    if (!selectedDay || !linkForm.title.trim() || !linkForm.url.trim()) return;
    setSavingLink(true);
    try {
      if (editingLink) {
        await adminMarathonsService.patchExternalLink(marathonId, selectedDay.day_number, editingLink.id, {
          title: linkForm.title.trim(),
          url: linkForm.url.trim(),
          order: Number(linkForm.order ?? 0)
        });
      } else {
        await adminMarathonsService.createExternalLink(marathonId, selectedDay.day_number, {
          title: linkForm.title.trim(),
          url: linkForm.url.trim(),
          order: Number(linkForm.order ?? 0)
        });
      }
      const wasEditing = Boolean(editingLink);
      resetLinkForm();
      await loadAll(selectedDay.day_number);
      setNotice({
        title: wasEditing ? t("notices.linkUpdated.title") : t("notices.linkSaved.title"),
        description: wasEditing ? t("notices.linkUpdated.description") : t("notices.linkSaved.description"),
        tone: "success"
      });
    } catch {
      setNotice({title: t("notices.linkFailed.title"), description: t("notices.linkFailed.description"), tone: "error"});
    } finally {
      setSavingLink(false);
    }
  };

  const removeLink = async () => {
    if (!selectedDay || deletingLinkId == null) return;
    try {
      await adminMarathonsService.removeExternalLink(marathonId, selectedDay.day_number, deletingLinkId);
      if (editingLink && String(editingLink.id) === String(deletingLinkId)) {
        resetLinkForm();
      }
      setDeletingLinkId(null);
      await loadAll(selectedDay.day_number);
      setNotice({title: t("notices.linkDeleted.title"), description: t("notices.linkDeleted.description"), tone: "success"});
    } catch {
      setNotice({
        title: t("notices.linkDeleteFailed.title"),
        description: t("notices.linkDeleteFailed.description"),
        tone: "error"
      });
    }
  };

  const upsertPassage = async () => {
    if (!selectedDay || !passageForm.title.trim()) return;
    setSavingPassage(true);
    try {
      const createdPassage = await adminMarathonsService.createReadingPassage(marathonId, {
        ...passageForm,
        title: passageForm.title.trim(),
        passage_text: "Draft passage",
        topic: passageForm.topic?.trim() ?? ""
      });
      await adminMarathonsService.assignPassage(marathonId, selectedDay.day_number, createdPassage.id);
      router.push(`/${locale}/admin/marathons/${marathonId}/reading-passages/${createdPassage.id}/builder`);
      return;
    } catch (cause) {
      setNotice({
        title: t("notices.passageFailed.title"),
        description: getAdminErrorDescription(cause, t("notices.passageFailed.description")),
        tone: "error"
      });
    } finally {
      setSavingPassage(false);
    }
  };

  const removePassage = async () => {
    if (deletingPassageId == null) return;
    try {
      await adminMarathonsService.removeReadingPassage(deletingPassageId);
      resetPassageForm();
      setDeletingPassageId(null);
      await loadAll(selectedDay?.day_number);
      setNotice({
        title: t("notices.passageDeleted.title"),
        description: t("notices.passageDeleted.description"),
        tone: "success"
      });
    } catch {
      setNotice({
        title: t("notices.passageDeleteFailed.title"),
        description: t("notices.passageDeleteFailed.description"),
        tone: "error"
      });
    }
  };

  const assignPassage = async () => {
    if (!selectedDay || selectedPassageId === "none") return;
    try {
      await adminMarathonsService.assignPassage(marathonId, selectedDay.day_number, selectedPassageId);
      setSelectedPassageId("none");
      await loadAll(selectedDay.day_number);
      setNotice({
        title: t("notices.passageAssigned.title"),
        description: t("notices.passageAssigned.description"),
        tone: "success"
      });
    } catch {
      setNotice({
        title: t("notices.passageAssignFailed.title"),
        description: t("notices.passageAssignFailed.description"),
        tone: "error"
      });
    }
  };

  const unassignPassage = async (passageId: AdminEntityId) => {
    if (!selectedDay) return;
    try {
      await adminMarathonsService.unassignPassage(marathonId, selectedDay.day_number, passageId);
      await loadAll(selectedDay.day_number);
    } catch {
      setNotice({
        title: t("notices.passageAssignFailed.title"),
        description: t("notices.passageAssignFailed.description"),
        tone: "error"
      });
    }
  };

  const upsertPart = async () => {
    if (!selectedDay || !partForm.title.trim()) return;
    setSavingPart(true);
    try {
      const createdPart = await adminMarathonsService.createListeningPart(marathonId, {
        ...partForm,
        title: partForm.title.trim(),
        transcript_text: "Draft transcript"
      });
      await adminMarathonsService.assignListeningPart(marathonId, selectedDay.day_number, createdPart.id);
      router.push(`/${locale}/admin/marathons/${marathonId}/listening-parts/${createdPart.id}/builder`);
      return;
    } catch (cause) {
      setNotice({
        title: t("notices.partFailed.title"),
        description: getAdminErrorDescription(cause, t("notices.partFailed.description")),
        tone: "error"
      });
    } finally {
      setSavingPart(false);
    }
  };

  const removePart = async () => {
    if (deletingPartId == null) return;
    try {
      await adminMarathonsService.removeListeningPart(deletingPartId);
      resetPartForm();
      setDeletingPartId(null);
      await loadAll(selectedDay?.day_number);
      setNotice({
        title: t("notices.partDeleted.title"),
        description: t("notices.partDeleted.description"),
        tone: "success"
      });
    } catch {
      setNotice({
        title: t("notices.partDeleteFailed.title"),
        description: t("notices.partDeleteFailed.description"),
        tone: "error"
      });
    }
  };

  const assignPart = async () => {
    if (!selectedDay || selectedPartId === "none") return;
    try {
      await adminMarathonsService.assignListeningPart(marathonId, selectedDay.day_number, selectedPartId);
      setSelectedPartId("none");
      await loadAll(selectedDay.day_number);
      setNotice({
        title: t("notices.partAssigned.title"),
        description: t("notices.partAssigned.description"),
        tone: "success"
      });
    } catch {
      setNotice({
        title: t("notices.partAssignFailed.title"),
        description: t("notices.partAssignFailed.description"),
        tone: "error"
      });
    }
  };

  const unassignPart = async (partId: AdminEntityId) => {
    if (!selectedDay) return;
    try {
      await adminMarathonsService.unassignListeningPart(marathonId, selectedDay.day_number, partId);
      await loadAll(selectedDay.day_number);
    } catch {
      setNotice({
        title: t("notices.partAssignFailed.title"),
        description: t("notices.partAssignFailed.description"),
        tone: "error"
      });
    }
  };

  const openContentLinkEditor = (
    kind: ContentLinkEditorState["kind"],
    contentId: AdminEntityId,
    link?: {title: string; url: string} | null
  ) => {
    setContentLinkEditor({
      kind,
      contentId,
      title: link?.title ?? "",
      url: link?.url ?? ""
    });
  };

  const saveContentLink = async () => {
    if (!selectedDay || !contentLinkEditor?.url.trim()) return;
    const normalizedUrl = normalizeHttpUrl(contentLinkEditor.url);
    if (!normalizedUrl) {
      setNotice({
        title: t("notices.contentLinkFailed.title"),
        description: t("notices.contentLinkFailed.description"),
        tone: "error"
      });
      return;
    }
    setSavingContentLink(true);
    try {
      const payload = {
        title: contentLinkEditor.title.trim(),
        url: normalizedUrl
      };
      if (contentLinkEditor.kind === "passage") {
        await adminMarathonsService.upsertPassageLink(
          marathonId,
          selectedDay.day_number,
          contentLinkEditor.contentId,
          payload
        );
      } else {
        await adminMarathonsService.upsertPartLink(
          marathonId,
          selectedDay.day_number,
          contentLinkEditor.contentId,
          payload
        );
      }
      setContentLinkEditor(null);
      await loadAll(selectedDay.day_number);
      setNotice({
        title: t("notices.contentLinkSaved.title"),
        description: t("notices.contentLinkSaved.description"),
        tone: "success"
      });
    } catch (cause) {
      setNotice({
        title: t("notices.contentLinkFailed.title"),
        description: getAdminErrorDescription(cause, t("notices.contentLinkFailed.description")),
        tone: "error"
      });
    } finally {
      setSavingContentLink(false);
    }
  };

  const removeContentLink = async (kind: ContentLinkEditorState["kind"], contentId: AdminEntityId) => {
    if (!selectedDay) return;
    setSavingContentLink(true);
    try {
      if (kind === "passage") {
        await adminMarathonsService.removePassageLink(marathonId, selectedDay.day_number, contentId);
      } else {
        await adminMarathonsService.removePartLink(marathonId, selectedDay.day_number, contentId);
      }
      if (contentLinkEditor?.kind === kind && String(contentLinkEditor.contentId) === String(contentId)) {
        setContentLinkEditor(null);
      }
      await loadAll(selectedDay.day_number);
      setNotice({
        title: t("notices.contentLinkRemoved.title"),
        description: t("notices.contentLinkRemoved.description"),
        tone: "success"
      });
    } catch (cause) {
      setNotice({
        title: t("notices.contentLinkFailed.title"),
        description: getAdminErrorDescription(cause, t("notices.contentLinkFailed.description")),
        tone: "error"
      });
    } finally {
      setSavingContentLink(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar
            title={marathon?.title ?? t("detail.title")}
            actions={
              <Button asChild type="button" variant="outline" className="rounded-xl">
                <Link href={`/${locale}/admin/marathons`}>
                  <ArrowLeft className="size-4" />
                  {t("actions.back")}
                </Link>
              </Button>
            }
          />

          <main className="mx-auto w-full max-w-[1480px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
            {loading ? (
              <Card className="border-border/70 bg-card/70 shadow-none">
                <CardContent className="px-6 py-10 text-center text-sm text-muted-foreground">
                  {t("loading")}
                </CardContent>
              </Card>
            ) : marathon ? (
              <>
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
                  <Card className="border-border/70 bg-card/70 shadow-none">
                    <CardHeader>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle>{marathon.title}</CardTitle>
                        {marathon.is_visible ? (
                          <Badge className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                            {t("filters.visible")}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="rounded-full">
                            {t("filters.hidden")}
                          </Badge>
                        )}
                        {marathon.for_premium_users ? (
                          <Badge className="rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300">
                            {t("filters.premiumOnly")}
                          </Badge>
                        ) : null}
                      </div>
                      <CardDescription>{marathon.description || t("list.noDescription")}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-border/70 bg-background/45 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t("fields.days")}</p>
                        <p className="mt-1 text-2xl font-semibold">{marathon.marathon_days}</p>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-background/45 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t("fields.band")}</p>
                        <p className="mt-1 text-2xl font-semibold">{marathon.target_band ?? "-"}</p>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-background/45 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t("detail.enrollments")}</p>
                        <p className="mt-1 text-2xl font-semibold">{enrollments.length}</p>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-background/45 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t("fields.streakGoal")}</p>
                        <p className="mt-1 text-2xl font-semibold">{marathon.streak_goal_days}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/70 bg-card/70 shadow-none">
                    <CardHeader>
                      <CardTitle>{t("detail.dayPickerTitle")}</CardTitle>
                      <CardDescription>{t("detail.dayPickerDescription")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5">
                        {days.map((day) => (
                          <button
                            key={String(day.id)}
                            type="button"
                            onClick={() => setSelectedDayNumber(day.day_number)}
                            className={`rounded-2xl border px-3 py-3 text-left text-sm transition-colors ${
                              selectedDayNumber === day.day_number
                                ? "border-primary/40 bg-primary/10 text-foreground"
                                : "border-border/70 bg-background/45 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <p className="font-semibold">{t("detail.dayLabel", {day: day.day_number})}</p>
                            <p className="mt-1 text-xs">
                              {day.reading_passages.length + day.listening_parts.length} {t("detail.items")}
                            </p>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {selectedDay ? (
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                    <Card className="border-border/70 bg-card/70 shadow-none">
                      <CardHeader>
                        <CardTitle>{t("detail.editorTitle", {day: selectedDay.day_number})}</CardTitle>
                        <CardDescription>{t("detail.editorDescription")}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>{t("fields.title")}</Label>
                          <Input
                            value={dayForm.title ?? ""}
                            onChange={(event) => setDayForm((current) => ({...current, title: event.target.value}))}
                            className="rounded-xl border-border/70 bg-background/45"
                          />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label>{t("fields.difficulty")}</Label>
                            <Select
                              value={dayForm.difficulty ?? "none"}
                              onValueChange={(value) =>
                                setDayForm((current) => ({...current, difficulty: value === "none" ? null : value}))
                              }
                            >
                              <SelectTrigger className="rounded-xl border-border/70 bg-background/45">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">{t("detail.none")}</SelectItem>
                                <SelectItem value="EASY">{t("detail.easy")}</SelectItem>
                                <SelectItem value="MEDIUM">{t("detail.medium")}</SelectItem>
                                <SelectItem value="HARD">{t("detail.hard")}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>{t("detail.estimatedMinutes")}</Label>
                            <Input
                              value={dayForm.estimated_minutes == null ? "" : String(dayForm.estimated_minutes)}
                              onChange={(event) =>
                                setDayForm((current) => ({
                                  ...current,
                                  estimated_minutes: toNumberOrNull(event.target.value)
                                }))
                              }
                              className="rounded-xl border-border/70 bg-background/45"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/45 px-4 py-3">
                          <div>
                            <p className="font-medium">{t("detail.bonusDay")}</p>
                            <p className="text-sm text-muted-foreground">{t("detail.bonusHint")}</p>
                          </div>
                          <Switch
                            checked={Boolean(dayForm.is_bonus_day)}
                            onCheckedChange={(checked) => setDayForm((current) => ({...current, is_bonus_day: checked}))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("detail.content")}</Label>
                          <textarea
                            value={dayForm.content ?? ""}
                            onChange={(event) => setDayForm((current) => ({...current, content: event.target.value}))}
                            className="min-h-48 w-full rounded-xl border border-border/70 bg-background/45 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button type="button" className="rounded-xl" disabled={savingDay} onClick={() => void saveDay()}>
                            {savingDay ? t("actions.saving") : t("actions.saveDay")}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="rounded-3xl border border-border/70 bg-card/70 px-6 py-5 shadow-none">
                      <TabsList className="w-full justify-start overflow-x-auto">
                        <TabsTrigger value="resources">{t("detail.resourcesTab")}</TabsTrigger>
                        <TabsTrigger value="reading">{t("detail.readingTab")}</TabsTrigger>
                        <TabsTrigger value="listening">{t("detail.listeningTab")}</TabsTrigger>
                        <TabsTrigger value="enrollments">{t("detail.enrollmentsTab")}</TabsTrigger>
                        <TabsTrigger value="leaderboard">{t("detail.leaderboardTab")}</TabsTrigger>
                      </TabsList>

                      <TabsContent value="resources" className="space-y-4 pt-4">
                        <Card className="border-border/70 bg-background/45 shadow-none">
                          <CardHeader>
                            <CardTitle>{t("detail.resourcesTitle")}</CardTitle>
                            <CardDescription>{t("detail.resourcesDescription")}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <ResourceForm
                              t={t}
                              value={linkForm}
                              saving={savingLink}
                              isEditing={Boolean(editingLink)}
                              onChange={setLinkForm}
                              onSubmit={() => void upsertLink()}
                              onCancel={resetLinkForm}
                            />
                            <div className="space-y-2">
                              {selectedDay.external_links.length ? (
                                selectedDay.external_links.map((link) => (
                                  <div
                                    key={String(link.id)}
                                    className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/55 px-4 py-3"
                                  >
                                    <div className="min-w-0">
                                      <p className="font-medium">{link.title}</p>
                                      <a
                                        href={link.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="truncate text-sm text-blue-600 hover:underline dark:text-blue-300"
                                      >
                                        {link.url}
                                      </a>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="rounded-full">
                                        #{link.order}
                                      </Badge>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl"
                                        onClick={() => {
                                          setEditingLink(link);
                                          setLinkForm({title: link.title, url: link.url, order: link.order});
                                        }}
                                      >
                                        {t("actions.edit")}
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl text-rose-600 dark:text-rose-300"
                                        onClick={() => setDeletingLinkId(link.id)}
                                      >
                                        {t("actions.delete")}
                                      </Button>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground">{t("detail.resourcesEmpty")}</p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="reading" className="space-y-4 pt-4">
                        <Card className="border-border/70 bg-background/45 shadow-none">
                          <CardHeader>
                            <CardTitle>{t("detail.readingLibraryTitle")}</CardTitle>
                            <CardDescription>{t("detail.readingLibraryDescription")}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <ReadingPassageForm
                              t={t}
                              value={passageForm}
                              saving={savingPassage}
                              onChange={setPassageForm}
                              onSubmit={() => void upsertPassage()}
                            />

                            <div className="flex flex-wrap gap-3 rounded-2xl border border-dashed border-border/70 bg-card/55 px-4 py-3">
                              <Select value={selectedPassageId} onValueChange={setSelectedPassageId}>
                                <SelectTrigger className="w-full max-w-[320px] rounded-xl border-border/70 bg-background/50">
                                  <SelectValue placeholder={t("detail.assignPassage")} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">{t("detail.assignPassage")}</SelectItem>
                                  {unassignedPassages.map((item) => (
                                    <SelectItem key={String(item.id)} value={String(item.id)}>
                                      {item.title}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                type="button"
                                variant="outline"
                                className="rounded-xl"
                                disabled={selectedPassageId === "none"}
                                onClick={() => void assignPassage()}
                              >
                                {t("actions.assign")}
                              </Button>
                            </div>

                            <div className="space-y-2">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                {t("detail.assignedPassagesTitle")}
                              </p>
                              {selectedDay.reading_passages.length ? (
                                selectedDay.reading_passages.map((item) => (
                                  <div
                                    key={String(item.id)}
                                    className="rounded-2xl border border-border/70 bg-card/55 px-4 py-3"
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                      <div className="min-w-0">
                                        <p className="font-medium">{item.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                          {item.max_questions} {t("detail.questions")} • {formatMinutes(item.estimated_time_minutes)}
                                        </p>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="rounded-xl"
                                          onClick={() => openContentLinkEditor("passage", item.id, item.external_link)}
                                        >
                                          <Video className="size-4" />
                                          {item.external_link ? t("detail.editVideoLink") : t("detail.addVideoLink")}
                                        </Button>
                                        <Button asChild type="button" variant="outline" size="sm" className="rounded-xl">
                                          <Link href={`/${locale}/admin/marathons/${marathonId}/reading-passages/${item.id}/builder`}>
                                            <Wand2 className="size-4" />
                                            {t("detail.buildQuestions")}
                                          </Link>
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="rounded-xl"
                                          onClick={() => void unassignPassage(item.id)}
                                        >
                                          {t("actions.remove")}
                                        </Button>
                                      </div>
                                    </div>
                                    {item.external_link ? (
                                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50/70 px-3 py-2.5 dark:border-red-400/20 dark:bg-red-500/8">
                                        <a
                                          href={item.external_link.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground hover:text-red-600 dark:hover:text-red-300"
                                        >
                                          <Video className="size-4 shrink-0 text-red-600 dark:text-red-300" />
                                          <span className="truncate">{item.external_link.title || t("detail.videoLink")}</span>
                                          <ExternalLink className="size-3.5 shrink-0" />
                                        </a>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          disabled={savingContentLink}
                                          className="h-8 rounded-lg text-rose-600 hover:bg-rose-100 hover:text-rose-700 dark:text-rose-300 dark:hover:bg-rose-500/10"
                                          onClick={() => void removeContentLink("passage", item.id)}
                                        >
                                          {t("detail.removeVideoLink")}
                                        </Button>
                                      </div>
                                    ) : null}
                                    {contentLinkEditor?.kind === "passage" && String(contentLinkEditor.contentId) === String(item.id) ? (
                                      <div className="mt-3 grid gap-3 rounded-xl border border-border/70 bg-background/70 p-3 sm:grid-cols-2">
                                        <div className="space-y-1.5">
                                          <Label>{t("detail.videoTitle")}</Label>
                                          <Input
                                            value={contentLinkEditor.title}
                                            placeholder={t("detail.videoTitlePlaceholder")}
                                            onChange={(event) => setContentLinkEditor({...contentLinkEditor, title: event.target.value})}
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <Label>{t("detail.videoUrl")}</Label>
                                          <Input
                                            type="url"
                                            value={contentLinkEditor.url}
                                            placeholder={t("detail.videoUrlPlaceholder")}
                                            onChange={(event) => setContentLinkEditor({...contentLinkEditor, url: event.target.value})}
                                          />
                                        </div>
                                        <div className="flex flex-wrap gap-2 sm:col-span-2">
                                          <Button
                                            type="button"
                                            size="sm"
                                            disabled={savingContentLink || !contentLinkEditor.url.trim()}
                                            className="rounded-xl"
                                            onClick={() => void saveContentLink()}
                                          >
                                            {t("detail.saveVideoLink")}
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={savingContentLink}
                                            className="rounded-xl"
                                            onClick={() => setContentLinkEditor(null)}
                                          >
                                            {t("detail.cancelVideoLink")}
                                          </Button>
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground">{t("detail.noPassages")}</p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                {t("detail.libraryPassagesTitle")}
                              </p>
                              {readingPassages.length ? (
                                readingPassages.map((item) => (
                                  <div key={String(item.id)} className="rounded-2xl border border-border/70 bg-card/55 px-4 py-3">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <p className="font-medium">{item.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                          {item.topic || "-"} • {item.max_questions} {t("detail.questions")}
                                        </p>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <Button asChild type="button" variant="outline" size="sm" className="rounded-xl">
                                          <Link href={`/${locale}/admin/marathons/${marathonId}/reading-passages/${item.id}/builder`}>
                                            <Wand2 className="size-4" />
                                            {t("detail.buildQuestions")}
                                          </Link>
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="rounded-xl text-rose-600 dark:text-rose-300"
                                          onClick={() => setDeletingPassageId(item.id)}
                                        >
                                          <Trash2 className="size-4" />
                                          {t("actions.delete")}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground">{t("detail.libraryPassagesEmpty")}</p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="listening" className="space-y-4 pt-4">
                        <Card className="border-border/70 bg-background/45 shadow-none">
                          <CardHeader>
                            <CardTitle>{t("detail.listeningLibraryTitle")}</CardTitle>
                            <CardDescription>{t("detail.listeningLibraryDescription")}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <ListeningPartForm
                              t={t}
                              value={partForm}
                              saving={savingPart}
                              onChange={setPartForm}
                              onSubmit={() => void upsertPart()}
                            />

                            <div className="flex flex-wrap gap-3 rounded-2xl border border-dashed border-border/70 bg-card/55 px-4 py-3">
                              <Select value={selectedPartId} onValueChange={setSelectedPartId}>
                                <SelectTrigger className="w-full max-w-[320px] rounded-xl border-border/70 bg-background/50">
                                  <SelectValue placeholder={t("detail.assignPart")} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">{t("detail.assignPart")}</SelectItem>
                                  {unassignedParts.map((item) => (
                                    <SelectItem key={String(item.id)} value={String(item.id)}>
                                      {item.title}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                type="button"
                                variant="outline"
                                className="rounded-xl"
                                disabled={selectedPartId === "none"}
                                onClick={() => void assignPart()}
                              >
                                {t("actions.assign")}
                              </Button>
                            </div>

                            <div className="space-y-2">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                {t("detail.assignedPartsTitle")}
                              </p>
                              {selectedDay.listening_parts.length ? (
                                selectedDay.listening_parts.map((item) => (
                                  <div
                                    key={String(item.id)}
                                    className="rounded-2xl border border-border/70 bg-card/55 px-4 py-3"
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                      <div className="min-w-0">
                                        <p className="font-medium">{item.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                          {item.max_questions} {t("detail.questions")} • {formatMinutes(item.estimated_time_minutes)}
                                        </p>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        {item.audio_file_url || item.audio_url ? (
                                          <a
                                            href={item.audio_file_url ?? item.audio_url ?? "#"}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-sm text-blue-600 hover:underline dark:text-blue-300"
                                          >
                                            {t("detail.audioReady")}
                                          </a>
                                        ) : null}
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="rounded-xl"
                                          onClick={() => openContentLinkEditor("part", item.id, item.external_link)}
                                        >
                                          <Video className="size-4" />
                                          {item.external_link ? t("detail.editVideoLink") : t("detail.addVideoLink")}
                                        </Button>
                                        <Button asChild type="button" variant="outline" size="sm" className="rounded-xl">
                                          <Link href={`/${locale}/admin/marathons/${marathonId}/listening-parts/${item.id}/builder`}>
                                            <Wand2 className="size-4" />
                                            {t("detail.buildQuestions")}
                                          </Link>
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="rounded-xl"
                                          onClick={() => void unassignPart(item.id)}
                                        >
                                          {t("actions.remove")}
                                        </Button>
                                      </div>
                                    </div>
                                    {item.external_link ? (
                                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50/70 px-3 py-2.5 dark:border-red-400/20 dark:bg-red-500/8">
                                        <a
                                          href={item.external_link.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground hover:text-red-600 dark:hover:text-red-300"
                                        >
                                          <Video className="size-4 shrink-0 text-red-600 dark:text-red-300" />
                                          <span className="truncate">{item.external_link.title || t("detail.videoLink")}</span>
                                          <ExternalLink className="size-3.5 shrink-0" />
                                        </a>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          disabled={savingContentLink}
                                          className="h-8 rounded-lg text-rose-600 hover:bg-rose-100 hover:text-rose-700 dark:text-rose-300 dark:hover:bg-rose-500/10"
                                          onClick={() => void removeContentLink("part", item.id)}
                                        >
                                          {t("detail.removeVideoLink")}
                                        </Button>
                                      </div>
                                    ) : null}
                                    {contentLinkEditor?.kind === "part" && String(contentLinkEditor.contentId) === String(item.id) ? (
                                      <div className="mt-3 grid gap-3 rounded-xl border border-border/70 bg-background/70 p-3 sm:grid-cols-2">
                                        <div className="space-y-1.5">
                                          <Label>{t("detail.videoTitle")}</Label>
                                          <Input
                                            value={contentLinkEditor.title}
                                            placeholder={t("detail.videoTitlePlaceholder")}
                                            onChange={(event) => setContentLinkEditor({...contentLinkEditor, title: event.target.value})}
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <Label>{t("detail.videoUrl")}</Label>
                                          <Input
                                            type="url"
                                            value={contentLinkEditor.url}
                                            placeholder={t("detail.videoUrlPlaceholder")}
                                            onChange={(event) => setContentLinkEditor({...contentLinkEditor, url: event.target.value})}
                                          />
                                        </div>
                                        <div className="flex flex-wrap gap-2 sm:col-span-2">
                                          <Button
                                            type="button"
                                            size="sm"
                                            disabled={savingContentLink || !contentLinkEditor.url.trim()}
                                            className="rounded-xl"
                                            onClick={() => void saveContentLink()}
                                          >
                                            {t("detail.saveVideoLink")}
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={savingContentLink}
                                            className="rounded-xl"
                                            onClick={() => setContentLinkEditor(null)}
                                          >
                                            {t("detail.cancelVideoLink")}
                                          </Button>
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground">{t("detail.noParts")}</p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                {t("detail.libraryPartsTitle")}
                              </p>
                              {listeningParts.length ? (
                                listeningParts.map((item) => (
                                  <div key={String(item.id)} className="rounded-2xl border border-border/70 bg-card/55 px-4 py-3">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <p className="font-medium">{item.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                          {item.part_number || "-"} • {item.max_questions} {t("detail.questions")}
                                        </p>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <Button asChild type="button" variant="outline" size="sm" className="rounded-xl">
                                          <Link href={`/${locale}/admin/marathons/${marathonId}/listening-parts/${item.id}/builder`}>
                                            <Wand2 className="size-4" />
                                            {t("detail.buildQuestions")}
                                          </Link>
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="rounded-xl text-rose-600 dark:text-rose-300"
                                          onClick={() => setDeletingPartId(item.id)}
                                        >
                                          <Trash2 className="size-4" />
                                          {t("actions.delete")}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground">{t("detail.libraryPartsEmpty")}</p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="enrollments" className="pt-4">
                        <Card className="border-border/70 bg-background/45 shadow-none">
                          <CardHeader>
                            <CardTitle>{t("detail.enrollmentsTitle")}</CardTitle>
                            <CardDescription>{t("detail.enrollmentsDescription")}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>{t("table.student")}</TableHead>
                                    <TableHead>{t("table.status")}</TableHead>
                                    <TableHead>{t("table.progress")}</TableHead>
                                    <TableHead>{t("table.streak")}</TableHead>
                                    <TableHead>{t("table.lastActivity")}</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {enrollments.length ? (
                                    enrollments.map((item) => (
                                      <TableRow key={String(item.id)}>
                                        <TableCell>
                                          <div>
                                            <p className="font-medium">{item.student_full_name}</p>
                                            <p className="text-sm text-muted-foreground">{item.student_email}</p>
                                          </div>
                                        </TableCell>
                                        <TableCell>{item.status}</TableCell>
                                        <TableCell>
                                          {item.days_completed} / {marathon.marathon_days}
                                        </TableCell>
                                        <TableCell>{item.current_streak}</TableCell>
                                        <TableCell>{formatDateTime(item.last_activity_at)}</TableCell>
                                      </TableRow>
                                    ))
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        {t("detail.noEnrollments")}
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="leaderboard" className="pt-4">
                        <Card className="border-border/70 bg-background/45 shadow-none">
                          <CardHeader>
                            <CardTitle>{t("detail.leaderboardTitle")}</CardTitle>
                            <CardDescription>{t("detail.leaderboardDescription")}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>#</TableHead>
                                    <TableHead>{t("table.student")}</TableHead>
                                    <TableHead>{t("detail.score")}</TableHead>
                                    <TableHead>{t("table.streak")}</TableHead>
                                    <TableHead>{t("table.daysCompleted")}</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {leaderboard.length ? (
                                    leaderboard.map((item) => (
                                      <TableRow key={`${item.rank}-${item.student_full_name}`}>
                                        <TableCell>{item.rank}</TableCell>
                                        <TableCell className="font-medium">{item.student_full_name}</TableCell>
                                        <TableCell>{item.total_score ?? "-"}</TableCell>
                                        <TableCell>{item.current_streak}</TableCell>
                                        <TableCell>{item.days_completed}</TableCell>
                                      </TableRow>
                                    ))
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        {t("detail.noLeaderboard")}
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </div>
                ) : null}
              </>
            ) : null}
          </main>
        </div>
      </div>

      <ConfirmModal
        open={deletingLinkId != null}
        title={t("detail.deleteLinkTitle")}
        description={t("detail.deleteLinkDescription")}
        confirmText={t("actions.delete")}
        cancelText={t("actions.cancel")}
        confirmVariant="destructive"
        onCancel={() => setDeletingLinkId(null)}
        onConfirm={() => void removeLink()}
      />

      <ConfirmModal
        open={deletingPassageId != null}
        title={t("detail.deletePassageTitle")}
        description={t("detail.deletePassageDescription")}
        confirmText={t("actions.delete")}
        cancelText={t("actions.cancel")}
        confirmVariant="destructive"
        onCancel={() => setDeletingPassageId(null)}
        onConfirm={() => void removePassage()}
      />

      <ConfirmModal
        open={deletingPartId != null}
        title={t("detail.deletePartTitle")}
        description={t("detail.deletePartDescription")}
        confirmText={t("actions.delete")}
        cancelText={t("actions.cancel")}
        confirmVariant="destructive"
        onCancel={() => setDeletingPartId(null)}
        onConfirm={() => void removePart()}
      />

      <SiteToast notice={notice} />
    </div>
  );
}
