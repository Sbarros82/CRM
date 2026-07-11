"use client";

import { cn } from "@/lib/utils";
import { CornerDownLeft, Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ChatMessage } from "@/types";

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
  showHeader: boolean;
  onReply: (message: ChatMessage) => void;
  onEdit: (message: ChatMessage) => void;
  onDelete: (messageId: string) => void;
}

function DateSeparator({ date }: { date: string }) {
  const d = new Date(date);
  let label: string;
  if (isToday(d)) label = "Hoje";
  else if (isYesterday(d)) label = "Ontem";
  else label = format(d, "d 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="relative my-4 flex items-center gap-3">
      <div className="flex-1 border-t border-border" />
      <span className="shrink-0 rounded-full border border-border bg-card px-3 py-0.5 text-xs text-muted-foreground">
        {label}
      </span>
      <div className="flex-1 border-t border-border" />
    </div>
  );
}

export { DateSeparator };

export function MessageBubble({
  message,
  isOwn,
  showAvatar,
  showHeader,
  onReply,
  onEdit,
  onDelete,
}: MessageBubbleProps) {
  const initials = (message.sender_full_name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const time = format(new Date(message.created_at), "HH:mm");

  return (
    <div
      className={cn(
        "group relative flex gap-3 px-4 py-0.5 hover:bg-accent/30 transition-colors",
        showHeader && "mt-3"
      )}
    >
      {/* Avatar */}
      <div className="w-9 shrink-0">
        {showAvatar ? (
          <Avatar className="h-9 w-9">
            <AvatarImage src={message.sender_avatar_url ?? undefined} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        ) : (
          <span className="invisible group-hover:visible block text-center text-[10px] leading-9 text-muted-foreground">
            {time}
          </span>
        )}
      </div>

      {/* Conteúdo */}
      <div className="min-w-0 flex-1">
        {/* Cabeçalho com nome + hora */}
        {showHeader && (
          <div className="mb-0.5 flex items-baseline gap-2">
            <span className={cn("text-sm font-semibold", isOwn ? "text-primary" : "text-foreground")}>
              {message.sender_full_name ?? "Membro"}
            </span>
            <span className="text-xs text-muted-foreground">{time}</span>
          </div>
        )}

        {/* Quote (reply) */}
        {message.reply_to_id && message.reply_to_text && (
          <div className="mb-1.5 flex items-start gap-1.5 rounded-md border-l-2 border-primary/60 bg-muted/40 px-2 py-1">
            <CornerDownLeft className="mt-0.5 h-3 w-3 shrink-0 text-primary/60" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-primary/80">
                {message.reply_to_sender_name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {message.reply_to_text}
              </p>
            </div>
          </div>
        )}

        {/* Texto */}
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
          {message.content_text}
        </p>

        {/* Badge editado */}
        {message.edited_at && (
          <span className="text-[10px] text-muted-foreground">(editado)</span>
        )}
      </div>

      {/* Ações ao hover */}
      <div className="absolute right-4 top-1 hidden items-center gap-1 rounded-md border border-border bg-card px-1 py-0.5 shadow-sm group-hover:flex">
        <button
          type="button"
          onClick={() => onReply(message)}
          title="Responder"
          className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <CornerDownLeft className="h-3.5 w-3.5" />
        </button>
        {isOwn && (
          <>
            <button
              type="button"
              onClick={() => onEdit(message)}
              title="Editar"
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(message.id)}
              title="Apagar"
              className="rounded p-1 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
