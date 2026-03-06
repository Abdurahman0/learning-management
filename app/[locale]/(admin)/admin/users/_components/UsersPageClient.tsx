"use client";

import {useMemo, useState} from "react";
import {useTranslations} from "next-intl";

import {
  ADMIN_USERS,
  LOCALE_FILTER_OPTIONS,
  PLAN_FILTER_OPTIONS,
  ROLE_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
  deriveUserStats,
  type AdminUser,
  type LocaleFilterValue,
  type PlanFilterValue,
  type RoleFilterValue,
  type StatusFilterValue
} from "@/data/admin-users";

import {AdminSidebar} from "../../_components/AdminSidebar";
import {UserProfileDrawer} from "./UserProfileDrawer";
import {UserStatsCards} from "./UserStatsCards";
import {UsersFilters} from "./UsersFilters";
import {UsersHeader} from "./UsersHeader";
import {UsersTable} from "./UsersTable";

const PAGE_SIZE = 6;

export function UsersPageClient() {
  const t = useTranslations("adminUsers");
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilterValue>("all");
  const [planFilter, setPlanFilter] = useState<PlanFilterValue>("all");
  const [localeFilter, setLocaleFilter] = useState<LocaleFilterValue>("all");
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const stats = useMemo(() => deriveUserStats(ADMIN_USERS), []);

  const filteredUsers = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    return ADMIN_USERS.filter((user) => {
      if (statusFilter !== "all" && user.status !== statusFilter) {
        return false;
      }

      if (roleFilter !== "all" && user.role !== roleFilter) {
        return false;
      }

      if (planFilter !== "all" && user.plan !== planFilter) {
        return false;
      }

      if (localeFilter !== "all" && user.locale !== localeFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query) || user.id.toLowerCase().includes(query);
    });
  }, [searchValue, statusFilter, roleFilter, planFilter, localeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paginatedUsers = useMemo(
    () => filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredUsers, safePage]
  );

  const selectedUser = useMemo(() => ADMIN_USERS.find((user) => user.id === selectedUserId) ?? null, [selectedUserId]);

  const setFilterAndResetPage = <T,>(setter: (value: T) => void, value: T) => {
    setter(value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchValue("");
    setStatusFilter("all");
    setRoleFilter("all");
    setPlanFilter("all");
    setLocaleFilter("all");
    setPage(1);
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    setDrawerOpen(true);
  };

  const handleSendMessage = (user: AdminUser) => {
    console.info("[admin-users] send message", {userId: user.id, name: user.name});
    console.info(t("actionFeedback.sendMessage", {name: user.name}));
  };

  const handleResetPassword = (user: AdminUser) => {
    const confirmed = window.confirm(t("drawer.confirmResetPassword", {name: user.name}));
    if (!confirmed) {
      console.info(t("actionFeedback.resetCancelled", {name: user.name}));
      return;
    }

    console.info("[admin-users] reset password", {userId: user.id, name: user.name});
    console.info(t("actionFeedback.resetPassword", {name: user.name}));
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
              localeValue={localeFilter}
              statusOptions={STATUS_FILTER_OPTIONS}
              roleOptions={ROLE_FILTER_OPTIONS}
              planOptions={PLAN_FILTER_OPTIONS}
              localeOptions={LOCALE_FILTER_OPTIONS}
              onStatusChange={(value) => setFilterAndResetPage(setStatusFilter, value)}
              onRoleChange={(value) => setFilterAndResetPage(setRoleFilter, value)}
              onPlanChange={(value) => setFilterAndResetPage(setPlanFilter, value)}
              onLocaleChange={(value) => setFilterAndResetPage(setLocaleFilter, value)}
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

