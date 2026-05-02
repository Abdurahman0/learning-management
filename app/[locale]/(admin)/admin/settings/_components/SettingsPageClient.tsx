"use client";

import {AdminSidebar} from "../../_components/AdminSidebar";
import {GlobalReasonUsageLimitsCard} from "./GlobalReasonUsageLimitsCard";
import {SettingsHeader} from "./SettingsHeader";

export function SettingsPageClient() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <SettingsHeader
            hasChanges={false}
            saveDisabled
            resetDisabled
            showSaveActions={false}
            onResetToDefault={() => undefined}
            onSaveChanges={() => undefined}
          />

          <main className="mx-auto min-w-0 w-full max-w-[1480px] space-y-5 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            <GlobalReasonUsageLimitsCard />
          </main>
        </div>
      </div>
    </div>
  );
}
