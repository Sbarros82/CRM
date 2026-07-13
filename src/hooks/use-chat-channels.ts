"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { ChatChannel, ChatMessage } from "@/types";

/**
 * Carrega canais e DMs do account do caller, calcula unread_count
 * por canal e mantém tudo sincronizado via Supabase Realtime.
 *
 * Também expõe:
 *   - availableChannels: canais públicos existentes nos quais o caller ainda NÃO é membro.
 *   - joinChannel(channelId): entra num canal público via RPC join_chat_channel.
 *
 * unread_count = número de mensagens criadas depois de last_read_at
 * do caller naquele canal. Atualiza em tempo real ao receber
 * novos chat_messages ou ao marcar um canal como lido.
 */
export function useChatChannels() {
  const { user, accountId } = useAuth();
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [availableChannels, setAvailableChannels] = useState<ChatChannel[]>([]);
  const [loading, setLoading] = useState(true);

  // Espelho local de {channel_id: last_read_at} para calcular
  // unread sem re-fetch completo a cada mensagem.
  const lastReadRef = useRef<Map<string, string | null>>(new Map());

  const fetchChannels = useCallback(async () => {
    if (!user || !accountId) return;
    const supabase = createClient();

    // 1. Canais dos quais o caller é membro.
    const { data: memberRows } = await supabase
      .from("chat_channel_members")
      .select("channel_id, last_read_at")
      .eq("user_id", user.id);

    // Guarda last_read_at por canal.
    const newLastRead = new Map<string, string | null>();
    for (const r of memberRows ?? []) {
      newLastRead.set(r.channel_id as string, r.last_read_at as string | null);
    }
    lastReadRef.current = newLastRead;

    const channelIds = (memberRows ?? []).map((r) => r.channel_id as string);

    // 2. Dados dos canais onde é membro.
    const memberChannelRows = channelIds.length > 0
      ? (await supabase
          .from("chat_channels")
          .select("*")
          .in("id", channelIds)
          .eq("account_id", accountId)
          .order("created_at", { ascending: true })
        ).data ?? []
      : [];

    // 3. Última mensagem de cada canal (para preview e unread).
    const { data: lastMsgRows } = channelIds.length > 0
      ? await supabase
          .from("chat_messages")
          .select("channel_id, content_text, created_at, sender_id")
          .in("channel_id", channelIds)
          .order("created_at", { ascending: false })
      : { data: [] };

    // Agrupa última mensagem por canal.
    const lastMsgMap = new Map<string, { text: string; at: string }>();
    for (const m of lastMsgRows ?? []) {
      const cid = m.channel_id as string;
      if (!lastMsgMap.has(cid)) {
        lastMsgMap.set(cid, {
          text: m.content_text as string,
          at: m.created_at as string,
        });
      }
    }

    // 4. Contagem de não-lidas por canal.
    const unreadMap = new Map<string, number>();
    for (const cid of channelIds) {
      const lastRead = lastReadRef.current.get(cid);
      const msgs = (lastMsgRows ?? []).filter(
        (m) =>
          m.channel_id === cid &&
          m.sender_id !== user.id &&
          (!lastRead || new Date(m.created_at as string) > new Date(lastRead))
      );
      unreadMap.set(cid, msgs.length);
    }

    const enriched: ChatChannel[] = (memberChannelRows as ChatChannel[]).map((ch) => ({
      ...ch,
      unread_count: unreadMap.get(ch.id) ?? 0,
      last_message_text: lastMsgMap.get(ch.id)?.text,
      last_message_at: lastMsgMap.get(ch.id)?.at,
    }));

    setChannels(enriched);

    // 5. Canais públicos disponíveis (não-membro, não-privados, não-DMs).
    const { data: allPublicRows } = await supabase
      .from("chat_channels")
      .select("*")
      .eq("account_id", accountId)
      .eq("is_dm", false)
      .eq("is_private", false)
      .order("created_at", { ascending: true });

    const memberSet = new Set(channelIds);
    const available = (allPublicRows ?? []).filter(
      (ch) => !memberSet.has(ch.id)
    ) as ChatChannel[];

    setAvailableChannels(available);
    setLoading(false);
  }, [user, accountId]);

  useEffect(() => {
    if (!user || !accountId) return;
    setLoading(true);
    fetchChannels();

    const supabase = createClient();

    // Subscreve novas mensagens para atualizar unread e preview.
    const msgChannel = supabase
      .channel("chat-channels-messages-watch")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setChannels((prev) =>
            prev.map((ch) => {
              if (ch.id !== msg.channel_id) return ch;
              const lastRead = lastReadRef.current.get(ch.id);
              const isUnread =
                msg.sender_id !== user.id &&
                (!lastRead || new Date(msg.created_at) > new Date(lastRead));
              return {
                ...ch,
                last_message_text: msg.content_text,
                last_message_at: msg.created_at,
                unread_count: (ch.unread_count ?? 0) + (isUnread ? 1 : 0),
              };
            })
          );
        }
      )
      // Subscreve membros para detectar novos canais/DMs.
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_channel_members",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Novo canal/DM adicionado — re-fetch completo.
          fetchChannels();
        }
      )
      // Subscreve criação de canais para atualizar a lista de disponíveis.
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_channels" },
        () => {
          fetchChannels();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
    };
  }, [user, accountId, fetchChannels]);

  /**
   * Marca um canal como lido localmente (sem esperar o servidor).
   * Chame após invocar o RPC mark_channel_read.
   */
  const markAsRead = useCallback((channelId: string) => {
    const now = new Date().toISOString();
    lastReadRef.current.set(channelId, now);
    setChannels((prev) => {
      const target = prev.find((ch) => ch.id === channelId);
      if (!target || target.unread_count === 0) return prev;
      return prev.map((ch) =>
        ch.id === channelId ? { ...ch, unread_count: 0 } : ch
      );
    });
  }, []);

  /**
   * Entra num canal público via RPC join_chat_channel.
   * Após sucesso, re-fetch para mover o canal de "disponível" para "meus canais".
   */
  const joinChannel = useCallback(
    async (channelId: string): Promise<boolean> => {
      if (!user) return false;
      const supabase = createClient();
      const { error } = await supabase.rpc("join_chat_channel", {
        p_channel_id: channelId,
      });
      if (error) {
        console.error("[useChatChannels] joinChannel error:", error.message);
        return false;
      }
      await fetchChannels();
      return true;
    },
    [user, fetchChannels]
  );

  return { channels, availableChannels, loading, refetch: fetchChannels, markAsRead, joinChannel };
}
