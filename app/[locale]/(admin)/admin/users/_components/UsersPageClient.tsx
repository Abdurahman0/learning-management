"use client";

import {useEffect, useMemo, useState} from "react";
import {useTranslations} from "next-intl";

import {
  PLAN_FILTER_OPTIONS,
  ROLE_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
  deriveUserStats,
  type AdminUser,
  type PlanFilterValue,
  type RoleFilterValue,
  type StatusFilterValue
} from "@/data/admin-users";
import {adminUsersService} from "@/src/services/admin/users.service";

import {AdminSidebar} from "../../_components/AdminSidebar";
import {UserProfileDrawer} from "./UserProfileDrawer";
import {UserStatsCards} from "./UserStatsCards";
import {UsersFilters} from "./UsersFilters";
import {UsersHeader} from "./UsersHeader";
import {UsersTable} from "./UsersTable";

const PAGE_SIZE = 6;

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
  if (!value) return "2026-01";
  return value.slice(0, 7);
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
      score: `${attempt.score}/${attempt.total}`,
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
  const [planFilter, setPlanFilter] = useState<PlanFilterValue>("all");
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [metrics, setMetrics] = useState({totalUsers: 0, activeToday: 0, newThisMonth: 0});

  useEffect(() => {
    let active = true;

    const loadUsers = async () => {
      try {
        const response = await adminUsersService.list({page: 1, pageSize: 200, search: initialQuery || undefined});
        if (!active) return;

        setMetrics(response.metrics);
        setUsers(response.results.map(mapUserListItemToAdminUser));
      } catch {
        if (!active) return;
        setUsers([]);
      }
    };

    void loadUsers();

    return () => {
      active = false;
    };
  }, [initialQuery]);

  const stats = useMemo(() => {
    const fallback = deriveUserStats(users);
    return fallback.map((item) => {
      if (item.id === "totalUsers") {
        return {...item, value: metrics.totalUsers || item.value};
      }
      if (item.id === "activeToday") {
        return {...item, value: metrics.activeToday || item.value};
      }
      if (item.id === "newThisMonth") {
        return {...item, value: metrics.newThisMonth || item.value};
      }
      return item;
    });
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

      if (planFilter !== "all" && user.plan !== planFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query) || user.id.toLowerCase().includes(query);
    });
  }, [users, searchValue, statusFilter, roleFilter, planFilter]);

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
    setPlanFilter("all");
    setPage(1);
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
            onSearchChange={(value) => {
              setSearchValue(value);
              setPage(1);
            }}
          />

          <main className="mx-auto min-w-0 w-full max-w-[1480px] space-y-5 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            <UserStatsCards stats={stats} />

            <UsersFilters
              statusValue={statusFilter}
              roleValue={roleFilter}
              planValue={planFilter}
              statusOptions={STATUS_FILTER_OPTIONS}
              roleOptions={ROLE_FILTER_OPTIONS}
              planOptions={PLAN_FILTER_OPTIONS}
              onStatusChange={(value) => setFilterAndResetPage(setStatusFilter, value)}
              onRoleChange={(value) => setFilterAndResetPage(setRoleFilter, value)}
              onPlanChange={(value) => setFilterAndResetPage(setPlanFilter, value)}
              onReset={handleResetFilters}
            />

            <UsersTable
              users={paginatedUsers}
              selectedUserId={selectedUserId}
              page={safePage}
              pageSize={PAGE_SIZE}
              totalItems={filteredUsers.length}
              totalPages={totalPages}
              onRowClick={handleSelectUser}
              onPageChange={(nextPage) => setPage(Math.min(Math.max(1, nextPage), totalPages))}
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
      />
    </div>
  );
}
