"use client";

import {
  useEffect,
  useRef,
  useCallback,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { cn } from "@/lib/utils";
import { Send, X } from "lucide-react";
import type { ChatMessage } from "@/types";

interface MessageComposerProps {
  channelName: string | null;
  isDm: boolean;
  dmPartnerName?: string;
  disabled?: boolean;
  replyTo: ChatMessage | null;
  onClearReply: () => void;
  onSend: (text: string, replyToId?: string) => Promise<void>;
}

export interface MessageComposerHandle {
  focus: () => void;
}

export const MessageComposer = forwardRef<MessageComposerHandle, MessageComposerProps>(
  function MessageComposer(
    { channelName, isDm, dmPartnerName, disabled, replyTo, onClearReply, onSend },
    ref
  ) {
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
    }));

    // Auto-resize da textarea conforme o texto cresce.
    useEffect(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }, [text]);

    // Foca ao trocar de canal.
    useEffect(() => {
      if (!disabled) textareaRef.current?.focus();
    }, [channelName, disabled]);

    const handleSend = useCallback(async () => {
      const trimmed = text.trim();
      if (!trimmed || sending || disabled) return;

      setSending(true);
      setText("");
      onClearReply();

      try {
        await onSend(trimmed, replyTo?.id);
      } finally {
        setSending(false);
        textareaRef.current?.focus();
      }
    }, [text, sending, disabled, onSend, replyTo, onClearReply]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      },
      [handleSend]
    );

    const placeholder = isDm
      ? `Mensagem para ${dmPartnerName ?? "membro"}…`
      : `Mensagem em #${channelName ?? "canal"}…`;

    return (
      <div className="border-t border-border bg-card px-4 pb-4 pt-2">
        {/* Preview do reply */}
        {replyTo && (
          <div className="mb-2 flex items-start gap-2 rounded-md border-l-2 border-primary/60 bg-muted/50 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-primary">
                Respondendo a {replyTo.sender_full_name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {replyTo.content_text}
              </p>
            </div>
            <button
              type="button"
              onClick={onClearReply}
              className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div
          className={cn(
            "flex items-end gap-2 rounded-xl border border-border bg-background px-3 py-2",
            "focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20",
            disabled && "opacity-50"
          )}
        >
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || sending}
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
            style={{ maxHeight: 160 }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!text.trim() || sending || disabled}
            className={cn(
              "shrink-0 rounded-lg p-2 transition-colors",
              text.trim() && !disabled
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
            title="Enviar (Enter)"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-1 text-right text-[10px] text-muted-foreground">
          Enter para enviar · Shift+Enter para nova linha
        </p>
      </div>
    );
  }
);
