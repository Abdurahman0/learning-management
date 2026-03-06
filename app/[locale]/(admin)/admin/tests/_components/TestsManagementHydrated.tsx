"use client";

import {useEffect, useState} from "react";

import {TestsManagementClient} from "./TestsManagementClient";

export function TestsManagementHydrated() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <TestsManagementClient />;
}

