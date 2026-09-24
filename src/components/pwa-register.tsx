"use client";

import { useEffect } from "react";

/**
 * Registers a minimal service worker (installability only).
 * Reloads once when an *updated* SW takes control so Android drops the
 * broken v2 fetch interceptor that broke post-login navigation.
 */
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

    const hadController = Boolean(navigator.serviceWorker.controller);
    let refreshing = false;
    const onControllerChange = () => {
      if (!hadController || refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => reg.update().catch(() => undefined))
      .catch(() => undefined);

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, []);

  return null;
}
