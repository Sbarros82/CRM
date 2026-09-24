"use client";

import { useEffect } from "react";

/** Registers a tiny service worker so Android can install Snap as a PWA. */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    const host = window.location.hostname;
    if (host !== "app.snap.ia.br" && host !== "localhost" && !host.endsWith(".vercel.app")) {
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* installability is best-effort */
    });
  }, []);

  return null;
}
