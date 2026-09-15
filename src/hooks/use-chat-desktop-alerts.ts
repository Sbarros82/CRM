"use client";

import { useCallback, useEffect, useState } from "react";

export function useChatDesktopAlerts() {
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");

  useEffect(() => {
    if (typeof Notification === "undefined") {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  const alertChat = useCallback(
    (opts: { title: string; body: string; tag: string; href: string }) => {
      if (typeof Notification === "undefined") return;
      if (Notification.permission !== "granted") return;
      try {
        const n = new Notification(opts.title, {
          body: opts.body,
          tag: opts.tag,
        });
        n.onclick = () => {
          window.focus();
          if (opts.href) window.location.assign(opts.href);
          n.close();
        };
      } catch {
        // Notification constructor can throw if the user revoked mid-session.
      }
    },
    [],
  );

  return { permission, alertChat };
}
