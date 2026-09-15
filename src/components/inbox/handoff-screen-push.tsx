"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRealtime } from "@/hooks/use-realtime";
import {
  isHandoffAlert,
  useHandoffDesktopAlerts,
} from "@/hooks/use-handoff-desktop-alerts";
import type { Conversation } from "@/types";

interface AlertItem {
  id: string;
  title: string;
  body: string;
}

export function HandoffScreenPush() {
  const router = useRouter();
  const { enable, permission, alertHandoff } = useHandoffDesktopAlerts();
  const [queue, setQueue] = useState<AlertItem[]>([]);
  const known = useRef<Map<string, Partial<Conversation>>>(new Map());
  const audioCtx = useRef<AudioContext | null>(null);

  const chime = useCallback(() => {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx.current) audioCtx.current = new Ctx();
      const ctx = audioCtx.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.value = 0.08;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {
      // Autoplay policies may block until a click; ignore.
    }
  }, []);

  const pushAlert = useCallback(
    (conv: Conversation) => {
      const title = conv.contact?.name || conv.contact?.phone || "Lead";
      const body =
        conv.last_message_text?.slice(0, 140) ||
        "A IA passou o atendimento para um humano.";
      setQueue((prev) => {
        if (prev.some((p) => p.id === conv.id)) return prev;
        return [...prev, { id: conv.id, title, body }];
      });
      chime();
      alertHandoff(conv, { skipToast: true });
    },
    [alertHandoff, chime],
  );

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("conversations")
        .select("id, status, ai_paused")
        .in("status", ["open", "pending"]);
      if (cancelled || !data) return;
      for (const row of data as Conversation[]) {
        known.current.set(row.id, row);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useRealtime({
    channelName: "handoff-screen-push",
    onConversationEvent: (event) => {
      if (event.eventType !== "UPDATE") return;
      const next = event.new;
      const prev = event.old ?? known.current.get(next.id);
      known.current.set(next.id, next);
      if (isHandoffAlert(prev, next)) {
        void (async () => {
          const supabase = createClient();
          const { data } = await supabase
            .from("conversations")
            .select("*, contact:contacts(name, phone)")
            .eq("id", next.id)
            .maybeSingle();
          pushAlert((data as Conversation | null) ?? next);
        })();
      }
    },
  });

  const current = queue[0];
  if (!current) {
    if (permission === "default") {
      return (
        <button
          type="button"
          onClick={() => void enable()}
          className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs text-foreground shadow-lg"
        >
          <Bell className="h-3.5 w-3.5" />
          Ativar avisos na tela
        </button>
      );
    }
    return null;
  }

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center p-3 sm:top-3 sm:p-0">
      <div className="flex w-full max-w-lg items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-50 p-4 text-amber-950 shadow-xl dark:bg-amber-950 dark:text-amber-50">
        <Bell className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Lead pronto para um humano</p>
          <p className="mt-0.5 truncate text-sm">{current.title}</p>
          <p className="mt-0.5 line-clamp-2 text-xs opacity-80">{current.body}</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setQueue((prev) => prev.filter((p) => p.id !== current.id));
                router.push(`/inbox?c=${current.id}`);
              }}
              className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
            >
              Abrir conversa
            </button>
            <button
              type="button"
              onClick={() =>
                setQueue((prev) => prev.filter((p) => p.id !== current.id))
              }
              className="rounded-md px-3 py-1.5 text-xs hover:bg-black/5 dark:hover:bg-white/10"
            >
              Dispensar
            </button>
          </div>
        </div>
        <button
          type="button"
          aria-label="Fechar"
          onClick={() =>
            setQueue((prev) => prev.filter((p) => p.id !== current.id))
          }
          className="rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
