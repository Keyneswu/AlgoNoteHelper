"use client";

import { Toast } from "@heroui/react";

/** App-wide toast region — bottom-right, auto-dismiss via HeroUI defaults. */
export function AppToastProvider() {
  return <Toast.Provider placement="bottom end" maxVisibleToasts={3} />;
}
