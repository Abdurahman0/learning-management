"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {useTranslations} from "next-intl";

import {
  type AdminUser,
  type FilterOption,
  type RoleFilterValue,
  type StatusFilterValue,
  type UserStatCard
} from "@/data/admin-users";
import {adminUsersService} from "@/src/services/admin/users.service";

import {AdminSidebar} from "../../_components/AdminSidebar";
import {UserProfileDrawer} from "./UserProfileDrawer";
import {UserStatsCards} from "./UserStatsCards";
import {UsersFilters} from "./UsersFilters";
import {UsersHeader} from "./UsersHeader";
import {UsersTable} from "./UsersTable";

const PAGE_SIZE = 6;
const STATUS_FILTER_OPTIONS: FilterOption<StatusFilterValue>[] = [
  {value: "all", labelKey: "filters.status.all"},
  {value: "active", labelKey: "filters.status.active"},
  {value: "suspended", labelKey: "filters.status.suspended"}
];
const ROLE_FILTER_OPTIONS: FilterOption<RoleFilterValue>[] = [
  {value: "all", labelKey: "filters.role.all"},
  {value: "student", labelKey: "filters.role.student"},
  {value: "admin", labelKey: "filters.role.admin"},
  {value: "tutor", labelKey: "filters.role.tutor"}
];
type UsersPageClientProps = {
  initialQuery?: string;
};

function initialsFromName(name: string) {
  const parts = name
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

function toJoinedAt(value: string) {
  return value || "";
}

function mapRole(value: string): AdminUser["role"] {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized.includes("admin")) return "admin";
  if (normalized.includes("teacher") || normalized.includes("tutor")) return "tutor";
  return "student";
}

function mapStatus(isActive: boolean): AdminUser["status"] {
  return isActive ? "active" : "suspended";
}

function mapPlan(role: string, targetBand: number): AdminUser["plan"] {
  const normalizedRole = String(role ?? "").trim().toLowerCase();
  if (normalizedRole.includes("admin")) return "premium";
  if (targetBand >= 7) return "pro";
  return "free";
}

function toSeverity(accuracy: number): "critical" | "improving" | "stable" {
  if (accuracy < 50) return "critical";
  if (accuracy < 75) return "improving";
  return "stable";
}

function mapUserListItemToAdminUser(item: Awaited<ReturnType<typeof adminUsersService.list>>["results"][number]): AdminUser {
  return {
    id: item.id,
    name: item.fullName || item.email,
    email: item.email,
    avatarFallback: initialsFromName(item.fullName || item.email || "User"),
    plan: mapPlan(item.role, item.targetBand),
    role: mapRole(item.role),
    status: mapStatus(item.isActive),
    locale: "en",
    overallBand: item.overallBand,
    targetBand: item.targetBand,
    joinedAt: toJoinedAt(item.dateJoined),
    isActiveToday: Boolean(item.lastActivityAt),
    isPremium: item.isPremium,
    stats: {
      reading: item.readingBand,
      listening: item.listeningBand,
      writing: 0,
      speaking: 0
    },
    weakAreas: [],
    bandProgress: [],
    history: [],
    payments: []
  };
}

function mapUserDetail(base: AdminUser, detail: Awaited<ReturnType<typeof adminUsersService.getById>>): AdminUser {
  return {
    ...base,
    name: detail.fullName || base.name,
    email: detail.email || base.email,
    avatarFallback: initialsFromName(detail.fullName || detail.email || base.name),
    plan: mapPlan(detail.role, detail.targetBand),
    role: mapRole(detail.role),
    status: mapStatus(detail.isActive),
    overallBand: detail.overallBand,
    targetBand: detail.targetBand,
    joinedAt: toJoinedAt(detail.dateJoined),
    isActiveToday: Boolean(detail.lastActivityAt),
    isPremium: detail.isPremium,
    stats: {
      reading: detail.modulePerformance.reading,
      listening: detail.modulePerformance.listening,
      writing: 0,
      speaking: 0
    },
    weakAreas: detail.weakAreas.map((area, index) => ({
      id: `${detail.id}-${area.questionType}-${index}`,
      label: area.questionTypeLabel || area.questionType,
      severity: toSeverity(area.accuracy)
    })),
    bandProgress: detail.bandProgression.map((point) => ({
      label: point.label,
      value: point.bandScore
    })),
    history: detail.recentAttempts.map((attempt) => ({
      id: attempt.attemptId,
      testName: attempt.testTitle,
      module: String(attempt.module ?? "reading").toLowerCase().includes("listen") ? "listening" : "reading",
      score: attempt.bandScore > 0 ? `${attempt.score}/${attempt.total} · Band ${attempt.bandScore.toFixed(1)}` : `${attempt.score}/${attempt.total}`,
      date: attempt.completedAt
    })),
    payments: []
  };
}

export function UsersPageClient({initialQuery = ""}: UsersPageClientProps) {
  const t = useTranslations("adminUsers");
  const [searchValue, setSearchValue] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilterValue>("all");
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [metrics, setMetrics] = useState({totalUsers: 0, activeToday: 0, newThisMonth: 0});
  const [premiumLoading, setPremiumLoading] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useMemo(
    () => async (query: string) => {
      setIsSearching(true);
      try {
        const response = await adminUsersService.list({page: 1, pageSize: 200, search: query || undefined});
        setMetrics(response.metrics);
        setUsers(response.results.map(mapUserListItemToAdminUser));
      } catch {
        setUsers([]);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  useEffect(() => {
    void fetchUsers(initialQuery);
  }, [initialQuery, fetchUsers]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchUsers(value);
    }, 400);
  };

  const stats = useMemo<UserStatCard[]>(() => {
    return [
      {id: "totalUsers", value: metrics.totalUsers || users.length, change: "+0.0%", icon: "users"},
      {id: "activeToday", value: metrics.activeToday, change: "+0.0%", icon: "activity"},
      {id: "newThisMonth", value: metrics.newThisMonth, change: "+0.0%", icon: "newUsers"}
    ];
  }, [metrics, users]);

  const filteredUsers = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    return users.filter((user) => {
      if (statusFilter !== "all" && user.status !== statusFilter) {
        return false;
      }

      if (roleFilter !== "all" && user.role !== roleFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query) || user.id.toLowerCase().includes(query);
    });
  }, [users, searchValue, statusFilter, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paginatedUsers = useMemo(
    () => filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredUsers, safePage]
  );

  const selectedUser = useMemo(() => users.find((user) => user.id === selectedUserId) ?? null, [users, selectedUserId]);

  const setFilterAndResetPage = <T,>(setter: (value: T) => void, value: T) => {
    setter(value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchValue("");
    setStatusFilter("all");
    setRoleFilter("all");
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    void fetchUsers("");
  };

  const handleSelectUser = async (userId: string) => {
    setSelectedUserId(userId);
    setDrawerOpen(true);

    const base = users.find((item) => item.id === userId);
    if (!base) return;

    try {
      const detail = await adminUsersService.getById(userId);
      setUsers((current) => current.map((item) => (item.id === userId ? mapUserDetail(item, detail) : item)));
    } catch {
      // Keep already available list-level data.
    }
  };

  const handleSendMessage = async (user: AdminUser) => {
    try {
      await adminUsersService.sendMessage(user.id, {
        subject: "Admin notification",
        message: "Please check your account activity."
      });
      console.info(t("actionFeedback.sendMessage", {name: user.name}));
    } catch {
      console.info(t("actionFeedback.sendMessage", {name: user.name}));
    }
  };

  const handleTogglePremium = async (userId: string, enable: boolean) => {
    setPremiumLoading((prev) => new Set(prev).add(userId));
    try {
      if (enable) {
        await adminUsersService.enablePremium(userId);
      } else {
        await adminUsersService.disablePremium(userId);
      }
      setUsers((current) =>
        current.map((item) => (item.id === userId ? {...item, isPremium: enable} : item))
      );
    } catch {
      // silent — user sees no change
    } finally {
      setPremiumLoading((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleResetPassword = async (user: AdminUser) => {
    const confirmed = window.confirm(t("drawer.confirmResetPassword", {name: user.name}));
    if (!confirmed) {
      console.info(t("actionFeedback.resetCancelled", {name: user.name}));
      return;
    }

    try {
      await adminUsersService.resetPassword(user.id, "TempPass#123");
      console.info(t("actionFeedback.resetPassword", {name: user.name}));
    } catch {
      console.info(t("actionFeedback.resetPassword", {name: user.name}));
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <UsersHeader
            searchValue={searchValue}
            onSearchChange={handleSearchChange}
            isSearching={isSearching}
          />

          <main className="mx-auto min-w-0 w-full max-w-[1480px] space-y-5 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            <UserStatsCards stats={stats} />

            <UsersFilters
              statusValue={statusFilter}
              roleValue={roleFilter}
              statusOptions={STATUS_FILTER_OPTIONS}
              roleOptions={ROLE_FILTER_OPTIONS}
              onStatusChange={(value) => setFilterAndResetPage(setStatusFilter, value)}
              onRoleChange={(value) => setFilterAndResetPage(setRoleFilter, value)}
              onReset={handleResetFilters}
            />

            <UsersTable
              users={paginatedUsers}
              selectedUserId={selectedUserId}
              page={safePage}
              pageSize={PAGE_SIZE}
              totalItems={filteredUsers.length}
              totalPages={totalPages}
              premiumLoading={premiumLoading}
              onRowClick={handleSelectUser}
              onPageChange={(nextPage) => setPage(Math.min(Math.max(1, nextPage), totalPages))}
              onTogglePremium={handleTogglePremium}
            />
          </main>
        </div>
      </div>

      <UserProfileDrawer
        open={drawerOpen}
        user={selectedUser}
        onOpenChange={setDrawerOpen}
        onSendMessage={handleSendMessage}
        onResetPassword={handleResetPassword}
        onTogglePremium={handleTogglePremium}
        premiumLoading={premiumLoading}
      />
    </div>
  );
}
