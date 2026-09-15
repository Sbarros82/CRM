"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useChatDesktopAlerts } from "@/hooks/use-chat-desktop-alerts";
import { getFocusedChatChannel } from "@/lib/chat/focused-channel";
import { shouldNotifyChatMessage } from "@/lib/chat/notify";
import type { ChatMessage } from "@/types";

interface AlertItem {
  id: string;
  channelId: string;
  title: string;
  body: string;
  href: string;
}

export function ChatScreenPush() {
  const { user } = useAuth();
  const router = useRouter();
  const { alertChat } = useChatDesktopAlerts();
  const [queue, setQueue] = useState<AlertItem[]>([]);
  const memberChannels = useRef<Set<string>>(new Set());
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
      osc.frequency.value = 988;
      gain.gain.value = 0.08;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch {
      // Autoplay policies may block until a click; ignore.
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("chat_channel_members")
        .select("channel_id")
        .eq("user_id", user.id);
      if (cancelled || !data) return;
      memberChannels.current = new Set(data.map((row) => row.channel_id as string));
    })();

    const channel = supabase
      .channel("chat-screen-push")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_channel_members",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as { channel_id: string };
          if (row.channel_id) memberChannels.current.add(row.channel_id);
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const msg = payload.new as ChatMessage;
          void (async () => {
            if (
              !shouldNotifyChatMessage({
                senderId: msg.sender_id,
                currentUserId: user.id,
                channelId: msg.channel_id,
                focusedChannelId: getFocusedChatChannel(),
                tabVisible: document.visibilityState === "visible",
              })
            ) {
              return;
            }

            if (!memberChannels.current.has(msg.channel_id)) {
              const { data: membership } = await supabase
                .from("chat_channel_members")
                .select("channel_id")
                .eq("channel_id", msg.channel_id)
                .eq("user_id", user.id)
                .maybeSingle();
              if (!membership) return;
              memberChannels.current.add(msg.channel_id);
            }

            const [{ data: profile }, { data: chatChannel }] = await Promise.all([
              supabase
                .from("profiles")
                .select("full_name")
                .eq("user_id", msg.sender_id)
                .maybeSingle(),
              supabase
                .from("chat_channels")
                .select("id, name, is_dm")
                .eq("id", msg.channel_id)
                .maybeSingle(),
            ]);

            const sender =
              (profile?.full_name as string | undefined)?.trim() || "Membro";
            const isDm = Boolean(chatChannel?.is_dm);
            const title = isDm
              ? `Mensagem direta de ${sender}`
              : `#${(chatChannel?.name as string | undefined) || "canal"}`;
            const body = isDm
              ? msg.content_text.slice(0, 140)
              : `${sender}: ${msg.content_text.slice(0, 120)}`;
            const href = `/chat?c=${encodeURIComponent(msg.channel_id)}`;

            setQueue((prev) => {
              if (prev.some((item) => item.id === msg.id)) return prev;
              return [
                ...prev,
                { id: msg.id, channelId: msg.channel_id, title, body, href },
              ];
            });
            chime();
            alertChat({
              title: `Snap: ${title}`,
              body,
              tag: `chat-${msg.channel_id}`,
              href,
            });
          })();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user, alertChat, chime]);

  const current = queue[0];
  if (!current) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center p-3 sm:top-3 sm:p-0">
      <div className="flex w-full max-w-lg items-start gap-3 rounded-xl border border-primary/40 bg-card p-4 text-foreground shadow-xl">
        <Bell className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{current.title}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {current.body}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setQueue((prev) => prev.filter((p) => p.id !== current.id));
                router.push(current.href);
              }}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              Abrir conversa
            </button>
            <button
              type="button"
              onClick={() =>
                setQueue((prev) => prev.filter((p) => p.id !== current.id))
              }
              className="rounded-md px-3 py-1.5 text-xs hover:bg-accent"
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
          className="rounded-md p-1 hover:bg-accent"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
