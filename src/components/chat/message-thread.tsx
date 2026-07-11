"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Loader2, Hash, MessageCircle, ArrowDown } from "lucide-react";
import { MessageBubble, DateSeparator } from "@/components/chat/message-bubble";
import { MessageComposer } from "@/components/chat/message-composer";
import { useChatMessages } from "@/hooks/use-chat-messages";
import type { ChatChannel, ChatMessage } from "@/types";

interface MessageThreadProps {
  channel: ChatChannel | null;
  currentUserId: string;
  dmPartnerName?: string;
  onMarkRead: (channelId: string) => void;
}

/**
 * Verifica se duas mensagens consecutivas devem ser agrupadas.
 * Agrupa se: mesmo sender, dentro de 5 minutos, sem reply.
 */
function shouldGroup(prev: ChatMessage, curr: ChatMessage): boolean {
  if (prev.sender_id !== curr.sender_id) return false;
  if (curr.reply_to_id) return false;
  const diff = new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime();
  return diff < 5 * 60 * 1000;
}

/**
 * Verifica se dois timestamps são de dias diferentes.
 */
function isDifferentDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() !== db.getFullYear() ||
    da.getMonth() !== db.getMonth() ||
    da.getDate() !== db.getDate()
  );
}

export function MessageThread({
  channel,
  currentUserId,
  dmPartnerName,
  onMarkRead,
}: MessageThreadProps) {
  const { messages, loading, hasMore, loadMore, sendMessage, editMessage, deleteMessage } =
    useChatMessages(channel?.id ?? null);

  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMsg, setEditingMsg] = useState<ChatMessage | null>(null);
  const [editText, setEditText] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  // Scroll para o fundo quando há novas mensagens e o usuário já estava no fundo.
  useEffect(() => {
    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Marca como lido quando o canal abre.
  const channelId = channel?.id;
  useEffect(() => {
    if (!channelId) return;
    onMarkRead(channelId);
    // Marca no servidor via RPC.
    import("@/lib/supabase/client").then(({ createClient }) => {
      createClient().rpc("mark_channel_read", { p_channel_id: channelId });
    });
  }, [channelId, onMarkRead]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isAtBottomRef.current = distFromBottom < 60;
    setShowScrollBtn(distFromBottom > 200);

    // Carrega mais ao chegar no topo.
    if (el.scrollTop < 60 && hasMore && !loading) {
      const prevHeight = el.scrollHeight;
      loadMore().then(() => {
        // Mantém posição de scroll após carregar mais.
        el.scrollTop = el.scrollHeight - prevHeight;
      });
    }
  }, [hasMore, loading, loadMore]);

  const handleEdit = useCallback((msg: ChatMessage) => {
    setEditingMsg(msg);
    setEditText(msg.content_text);
  }, []);

  const handleEditSave = useCallback(async () => {
    if (!editingMsg || !editText.trim()) return;
    await editMessage(editingMsg.id, editText.trim());
    setEditingMsg(null);
    setEditText("");
  }, [editingMsg, editText, editMessage]);

  if (!channel) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <MessageCircle className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          Selecione um canal ou conversa para começar
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Cabeçalho do canal */}
      <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-3">
        {channel.is_dm ? (
          <MessageCircle className="h-5 w-5 shrink-0 text-muted-foreground" />
        ) : (
          <Hash className="h-5 w-5 shrink-0 text-muted-foreground" />
        )}
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {channel.is_dm ? (dmPartnerName ?? "Conversa direta") : channel.name}
          </h2>
          {channel.description && (
            <p className="text-xs text-muted-foreground">{channel.description}</p>
          )}
        </div>
      </div>

      {/* Thread de mensagens */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-y-auto"
      >
        {/* Loader de histórico */}
        {loading && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Mensagens */}
        <div className="pb-2 pt-4">
          {messages.map((msg, idx) => {
            const prev = idx > 0 ? messages[idx - 1] : null;
            const showDate =
              !prev || isDifferentDay(prev.created_at, msg.created_at);
            const grouped = prev ? shouldGroup(prev, msg) : false;
            const showHeader = !grouped;
            const showAvatar = !grouped;

            return (
              <div key={msg.id}>
                {showDate && <DateSeparator date={msg.created_at} />}

                {/* Modo edição inline */}
                {editingMsg?.id === msg.id ? (
                  <div className="px-4 py-1">
                    <textarea
                      autoFocus
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleEditSave();
                        }
                        if (e.key === "Escape") {
                          setEditingMsg(null);
                          setEditText("");
                        }
                      }}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
                      rows={2}
                    />
                    <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
                      <button
                        type="button"
                        onClick={handleEditSave}
                        className="text-primary hover:underline"
                      >
                        Salvar
                      </button>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMsg(null);
                          setEditText("");
                        }}
                        className="hover:underline"
                      >
                        Cancelar (Esc)
                      </button>
                    </div>
                  </div>
                ) : (
                  <MessageBubble
                    message={msg}
                    isOwn={msg.sender_id === currentUserId}
                    showAvatar={showAvatar}
                    showHeader={showHeader}
                    onReply={setReplyTo}
                    onEdit={handleEdit}
                    onDelete={deleteMessage}
                  />
                )}
              </div>
            );
          })}

          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              {channel.is_dm ? (
                <MessageCircle className="mb-3 h-10 w-10 text-muted-foreground/40" />
              ) : (
                <Hash className="mb-3 h-10 w-10 text-muted-foreground/40" />
              )}
              <p className="text-sm font-medium text-foreground">
                {channel.is_dm
                  ? `Início da sua conversa com ${dmPartnerName ?? "este membro"}`
                  : `Bem-vindo ao #${channel.name}!`}
              </p>
              {channel.description && (
                <p className="mt-1 text-xs text-muted-foreground">{channel.description}</p>
              )}
            </div>
          )}
        </div>
        <div ref={bottomRef} />

        {/* Botão de scroll para o fundo */}
        <button
          type="button"
          onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
          className={cn(
            "absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs shadow-md transition-all",
            showScrollBtn ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-2"
          )}
        >
          <ArrowDown className="h-3.5 w-3.5" />
          Ir para o fim
        </button>
      </div>

      {/* Compositor */}
      <MessageComposer
        channelName={channel.name}
        isDm={channel.is_dm}
        dmPartnerName={dmPartnerName}
        replyTo={replyTo}
        onClearReply={() => setReplyTo(null)}
        onSend={sendMessage}
      />
    </div>
  );
}
