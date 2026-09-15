"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Conversation } from "@/types";

export function isHandoffAlert(
  prev: Partial<Conversation> | undefined,
  next: Conversation,
): boolean {
  if (!next.ai_paused || next.status !== "pending") return false;
  if (prev?.status === "pending" && prev.ai_paused) return false;
  return true;
}

export function useHandoffDesktopAlerts() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "default",
  );

  useEffect(() => {
    if (typeof Notification === "undefined") {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  const enable = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    const next = await Notification.requestPermission();
    setPermission(next);
    if (next === "granted") {
      toast.success("Avisos do navegador ligados para handoff da IA");
    }
  }, []);

  const alertHandoff = useCallback(
    (conv: Conversation, opts?: { skipToast?: boolean }) => {
      const name = conv.contact?.name || conv.contact?.phone || "Lead";
      const body =
        conv.last_message_text?.slice(0, 140) || "A IA passou o atendimento.";

      if (!opts?.skipToast) {
        toast.warning(`${name} aguardando humano`, {
          description: body,
          duration: 8000,
        });
      }

      if (typeof Notification === "undefined") return;
      if (Notification.permission !== "granted") return;

      try {
        const n = new Notification(`Snap: ${name} quer fechar`, {
          body,
          tag: `handoff-${conv.id}`,
        });
        n.onclick = () => {
          window.focus();
          n.close();
        };
      } catch {
        // Notification constructor can throw if the user revoked mid-session.
      }
    },
    [],
  );

  return { permission, enable, alertHandoff };
}
