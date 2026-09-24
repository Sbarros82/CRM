"use client";

import { useEffect } from "react";

/** Registers the Snap service worker (needed for Android install + updates). */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    const host = window.location.hostname;
    if (
      host !== "app.snap.ia.br" &&
      host !== "localhost" &&
      !host.endsWith(".vercel.app")
    ) {
      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        // Force check so f5b9ac7 → next deploy picks up sw.js changes.
        reg.update().catch(() => undefined);
      })
      .catch(() => undefined);
  }, []);

  return null;
}
