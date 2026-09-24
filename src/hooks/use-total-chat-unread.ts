"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { onChatChannelRead } from "@/lib/chat/read-events";
import type { ChatMessage } from "@/types";

/**
 * Total de mensagens não-lidas em todos os canais de chat do caller.
 * Usado pelo badge na sidebar principal — mesmo padrão que
 * useTotalUnread para conversas do WhatsApp.
 *
 * Mantém um espelho local {channel_id: unread_count} para que
 * eventos Realtime possam atualizar o total em O(1) sem re-fetch.
 */
export function useTotalChatUnread(): number {
  const { user } = useAuth();
  const [total, setTotal] = useState(0);

  // {channel_id: unread_count}
  const unreadMapRef = useRef<Map<string, number>>(new Map());
  // {channel_id: last_read_at ISO string | null}
  const lastReadRef = useRef<Map<string, string | null>>(new Map());

  const recompute = () => {
    let sum = 0;
    for (const n of unreadMapRef.current.values()) sum += n;
    setTotal(sum);
  };

  // Optimistic clear when any screen marks a channel read (mobile nav
  // badge was stuck because Realtime often skipped the member UPDATE).
  useEffect(() => {
    return onChatChannelRead((channelId, lastReadAt) => {
      lastReadRef.current.set(channelId, lastReadAt);
      unreadMapRef.current.set(channelId, 0);
      recompute();
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      // 1. Busca canais do caller e seus last_read_at.
      const { data: memberRows } = await supabase
        .from("chat_channel_members")
        .select("channel_id, last_read_at")
        .eq("user_id", user.id);

      if (cancelled || !memberRows) return;

      const channelIds = memberRows.map((r) => r.channel_id as string);
      for (const r of memberRows) {
        lastReadRef.current.set(r.channel_id as string, r.last_read_at as string | null);
      }

      if (channelIds.length === 0) {
        setTotal(0);
        return;
      }

      // 2. Conta mensagens mais recentes que last_read_at por canal.
      const { data: msgRows } = await supabase
        .from("chat_messages")
        .select("id, channel_id, created_at, sender_id")
        .in("channel_id", channelIds)
        .neq("sender_id", user.id);

      if (cancelled || !msgRows) return;

      // Reinicia mapa.
      unreadMapRef.current = new Map(channelIds.map((id) => [id, 0]));

      for (const m of msgRows as { id: string; channel_id: string; created_at: string; sender_id: string }[]) {
        const lastRead = lastReadRef.current.get(m.channel_id);
        const isUnread = !lastRead || new Date(m.created_at) > new Date(lastRead);
        if (isUnread) {
          unreadMapRef.current.set(
            m.channel_id,
            (unreadMapRef.current.get(m.channel_id) ?? 0) + 1
          );
        }
      }

      recompute();
    })();

    // Unique topic per mount — same dual Sidebar/MobileBottomNav issue
    // as useTotalUnread (shared name → callbacks after subscribe crash).
    const channel = supabase
      .channel(`total-chat-unread-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const msg = payload.new as ChatMessage;
          if (msg.sender_id === user.id) return;
          // DM nova: o canal ainda não estava no mapa na hora do INSERT.
          if (!unreadMapRef.current.has(msg.channel_id)) {
            unreadMapRef.current.set(msg.channel_id, 0);
            lastReadRef.current.set(msg.channel_id, null);
          }
          const lastRead = lastReadRef.current.get(msg.channel_id);
          const isUnread = !lastRead || new Date(msg.created_at) > new Date(lastRead);
          if (!isUnread) return;
          unreadMapRef.current.set(
            msg.channel_id,
            (unreadMapRef.current.get(msg.channel_id) ?? 0) + 1
          );
          recompute();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_channel_members",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Caller marcou canal como lido.
          const updated = payload.new as { channel_id: string; last_read_at: string };
          lastReadRef.current.set(updated.channel_id, updated.last_read_at);
          unreadMapRef.current.set(updated.channel_id, 0);
          recompute();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_channel_members",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Caller entrou num novo canal (DM aberta por outra pessoa).
          // Não zera se a primeira mensagem já incrementou o contador.
          const m = payload.new as { channel_id: string; last_read_at: string | null };
          lastReadRef.current.set(m.channel_id, m.last_read_at);
          if (!unreadMapRef.current.has(m.channel_id)) {
            unreadMapRef.current.set(m.channel_id, 0);
          }
          recompute();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  return total;
}
