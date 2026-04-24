"use client";

import {useEffect, useRef} from "react";

import {syncGuestPendingAttemptsOnce} from "@/lib/guest-attempt-sync";

import {useAppSessionRole} from "./AppSessionContext";

export function GuestAttemptSyncClient() {
  const role = useAppSessionRole();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    if (role === "guest") return;
    ranRef.current = true;
    void syncGuestPendingAttemptsOnce();
  }, [role]);

  return null;
}

