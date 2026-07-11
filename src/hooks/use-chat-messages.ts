"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { ChatMessage } from "@/types";

const PAGE_SIZE = 50;

interface UseChatMessagesResult {
  messages: ChatMessage[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  sendMessage: (text: string, replyToId?: string) => Promise<void>;
  editMessage: (messageId: string, newText: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
}

/**
 * Gerencia mensagens de um canal de chat.
 * - Carrega histórico paginado (50 por página).
 * - Subscreve Realtime para novas mensagens, edições e remoções.
 * - Enriquece sender_full_name e reply_to_text via join manual
 *   (Supabase RLS não permite .select() com foreign tables em
 *   políticas cross-table — usamos queries separadas e memoizamos).
 */
export function useChatMessages(channelId: string | null): UseChatMessagesResult {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  // Cache de perfis já carregados: user_id → { full_name, avatar_url }
  const profileCacheRef = useRef<Map<string, { full_name: string; avatar_url: string | null }>>(
    new Map()
  );

  const enrichMessages = useCallback(
    async (rows: ChatMessage[]): Promise<ChatMessage[]> => {
      if (rows.length === 0) return rows;
      const supabase = createClient();

      // IDs de senders que ainda não estão em cache.
      const missingIds = [...new Set(rows.map((m) => m.sender_id))].filter(
        (id) => !profileCacheRef.current.has(id)
      );

      if (missingIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", missingIds);

        for (const p of profiles ?? []) {
          profileCacheRef.current.set(p.user_id as string, {
            full_name: (p.full_name as string) ?? "Membro",
            avatar_url: p.avatar_url as string | null,
          });
        }
      }

      // IDs de mensagens referenciadas (reply_to_id).
      const replyIds = rows
        .map((m) => m.reply_to_id)
        .filter(Boolean) as string[];

      let replyMap = new Map<string, { text: string; senderName: string }>();
      if (replyIds.length > 0) {
        const { data: replyRows } = await supabase
          .from("chat_messages")
          .select("id, content_text, sender_id")
          .in("id", replyIds);

        for (const r of replyRows ?? []) {
          const senderProfile = profileCacheRef.current.get(r.sender_id as string);
          replyMap.set(r.id as string, {
            text: r.content_text as string,
            senderName: senderProfile?.full_name ?? "Membro",
          });
        }
      }

      return rows.map((m) => {
        const sender = profileCacheRef.current.get(m.sender_id);
        const reply = m.reply_to_id ? replyMap.get(m.reply_to_id) : undefined;
        return {
          ...m,
          sender_full_name: sender?.full_name ?? "Membro",
          sender_avatar_url: sender?.avatar_url ?? null,
          reply_to_text: reply?.text ?? null,
          reply_to_sender_name: reply?.senderName ?? null,
        };
      });
    },
    []
  );

  // Carregamento inicial quando o canal muda.
  useEffect(() => {
    if (!channelId) {
      setMessages([]);
      setHasMore(false);
      return;
    }

    setLoading(true);
    setMessages([]);

    const supabase = createClient();
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("channel_id", channelId)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (cancelled || error || !data) {
        setLoading(false);
        return;
      }

      const reversed = (data as ChatMessage[]).reverse();
      const enriched = await enrichMessages(reversed);
      if (!cancelled) {
        setMessages(enriched);
        setHasMore(data.length === PAGE_SIZE);
      }
      setLoading(false);
    })();

    // Realtime: novas mensagens, edições, remoções.
    const channel = supabase
      .channel(`chat-messages:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          if (cancelled) return;
          const [enriched] = await enrichMessages([payload.new as ChatMessage]);
          setMessages((prev) => {
            // Evita duplicatas (optimistic update já pode tê-la).
            if (prev.some((m) => m.id === enriched.id)) return prev;
            return [...prev, enriched];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          if (cancelled) return;
          const updated = payload.new as ChatMessage;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === updated.id
                ? { ...m, content_text: updated.content_text, edited_at: updated.edited_at }
                : m
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "chat_messages",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          if (cancelled) return;
          const deleted = payload.old as Partial<ChatMessage>;
          setMessages((prev) => prev.filter((m) => m.id !== deleted.id));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [channelId, enrichMessages]);

  // Carrega página anterior (scroll infinito).
  const loadMore = useCallback(async () => {
    if (!channelId || !hasMore || messages.length === 0) return;
    const supabase = createClient();
    const oldest = messages[0].created_at;

    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("channel_id", channelId)
      .lt("created_at", oldest)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (error || !data) return;

    const reversed = (data as ChatMessage[]).reverse();
    const enriched = await enrichMessages(reversed);
    setMessages((prev) => [...enriched, ...prev]);
    setHasMore(data.length === PAGE_SIZE);
  }, [channelId, hasMore, messages, enrichMessages]);

  // Envia mensagem (optimistic).
  const sendMessage = useCallback(
    async (text: string, replyToId?: string) => {
      if (!channelId || !user) return;
      const supabase = createClient();

      // Optimistic: adiciona imediatamente com dados do caller.
      const optimisticId = `optimistic-${Date.now()}`;
      const senderProfile = profileCacheRef.current.get(user.id);
      const optimistic: ChatMessage = {
        id: optimisticId,
        channel_id: channelId,
        sender_id: user.id,
        content_text: text.trim(),
        reply_to_id: replyToId ?? null,
        created_at: new Date().toISOString(),
        edited_at: null,
        sender_full_name: senderProfile?.full_name ?? "Você",
        sender_avatar_url: senderProfile?.avatar_url ?? null,
        reply_to_text: null,
        reply_to_sender_name: null,
      };
      setMessages((prev) => [...prev, optimistic]);

      const { error } = await supabase.from("chat_messages").insert({
        channel_id: channelId,
        sender_id: user.id,
        content_text: text.trim(),
        reply_to_id: replyToId ?? null,
      });

      if (error) {
        // Reverte optimistic em caso de erro.
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        console.error("[useChatMessages] sendMessage error:", error.message);
      }
    },
    [channelId, user]
  );

  // Edita mensagem própria.
  const editMessage = useCallback(
    async (messageId: string, newText: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("chat_messages")
        .update({ content_text: newText.trim(), edited_at: new Date().toISOString() })
        .eq("id", messageId);

      if (error) {
        console.error("[useChatMessages] editMessage error:", error.message);
      }
    },
    []
  );

  // Remove mensagem própria.
  const deleteMessage = useCallback(
    async (messageId: string) => {
      // Optimistic delete: remove localmente primeiro para resposta instantânea.
      setMessages((prev) => prev.filter((m) => m.id !== messageId));

      const supabase = createClient();
      const { error } = await supabase
        .from("chat_messages")
        .delete()
        .eq("id", messageId);

      if (error) {
        console.error("[useChatMessages] deleteMessage error:", error.message);
        // Em caso de erro, o re-fetch do Realtime ou reload trará de volta se falhou.
      }
    },
    []
  );

  return { messages, loading, hasMore, loadMore, sendMessage, editMessage, deleteMessage };
}
