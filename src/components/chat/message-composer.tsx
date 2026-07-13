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
import { Send, X, Paperclip, FileText, ImageIcon, Loader2 } from "lucide-react";
import type { ChatMessage } from "@/types";
import type { AttachmentPayload } from "@/hooks/use-chat-messages";

const ACCEPTED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "video/mp4", "video/webm",
  "audio/mpeg", "audio/ogg", "audio/wav",
].join(",");

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface MessageComposerProps {
  channelName: string | null;
  isDm: boolean;
  dmPartnerName?: string;
  disabled?: boolean;
  replyTo: ChatMessage | null;
  onClearReply: () => void;
  onSend: (text: string, replyToId?: string, attachment?: AttachmentPayload) => Promise<void>;
  onUpload: (file: File) => Promise<AttachmentPayload | null>;
}

export interface MessageComposerHandle {
  focus: () => void;
}

export const MessageComposer = forwardRef<MessageComposerHandle, MessageComposerProps>(
  function MessageComposer(
    { channelName, isDm, dmPartnerName, disabled, replyTo, onClearReply, onSend, onUpload },
    ref
  ) {
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);
    const [pendingAttachment, setPendingAttachment] = useState<AttachmentPayload | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Revoga URL de preview ao desmontar ou trocar de arquivo.
    useEffect(() => {
      return () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      };
    }, [previewUrl]);

    const handleFileChange = useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // Reseta o input para permitir selecionar o mesmo arquivo novamente.
        e.target.value = "";

        setFileError(null);

        if (file.size > MAX_FILE_SIZE) {
          setFileError(`Arquivo muito grande. Máximo: 20 MB.`);
          return;
        }

        // Preview local para imagens.
        if (file.type.startsWith("image/")) {
          if (previewUrl) URL.revokeObjectURL(previewUrl);
          setPreviewUrl(URL.createObjectURL(file));
        } else {
          setPreviewUrl(null);
        }

        setUploading(true);
        const result = await onUpload(file);
        setUploading(false);

        if (!result) {
          setFileError("Falha no upload. Tente novamente.");
          setPreviewUrl(null);
          return;
        }

        setPendingAttachment(result);
        textareaRef.current?.focus();
      },
      [onUpload, previewUrl]
    );

    const clearAttachment = useCallback(() => {
      setPendingAttachment(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setFileError(null);
    }, [previewUrl]);

    const handleSend = useCallback(async () => {
      const trimmed = text.trim();
      if ((!trimmed && !pendingAttachment) || sending || disabled || uploading) return;

      setSending(true);
      const attachmentToSend = pendingAttachment ?? undefined;
      setText("");
      setPendingAttachment(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      onClearReply();

      try {
        await onSend(trimmed, replyTo?.id, attachmentToSend);
      } finally {
        setSending(false);
        textareaRef.current?.focus();
      }
    }, [text, pendingAttachment, sending, disabled, uploading, onSend, replyTo, onClearReply, previewUrl]);

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

    const isImage = pendingAttachment?.file.type.startsWith("image/");
    const canSend = (text.trim() || pendingAttachment) && !sending && !disabled && !uploading;

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

        {/* Preview do anexo pendente */}
        {(pendingAttachment || uploading) && (
          <div className="mb-2 flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Enviando arquivo…</span>
              </>
            ) : isImage && previewUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-12 w-12 rounded-md object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">
                    {pendingAttachment!.file.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatFileSize(pendingAttachment!.file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearAttachment}
                  className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive"
                  title="Remover anexo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <>
                <FileText className="h-8 w-8 shrink-0 text-primary/70" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">
                    {pendingAttachment!.file.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatFileSize(pendingAttachment!.file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearAttachment}
                  className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive"
                  title="Remover anexo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        )}

        {/* Erro de arquivo */}
        {fileError && (
          <p className="mb-1 text-xs text-destructive">{fileError}</p>
        )}

        {/* Input oculto de arquivo */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={handleFileChange}
        />

        <div
          className={cn(
            "flex items-end gap-2 rounded-xl border border-border bg-background px-3 py-2",
            "focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20",
            disabled && "opacity-50"
          )}
        >
          {/* Botão de anexo */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || sending || uploading}
            title="Anexar arquivo"
            className={cn(
              "shrink-0 rounded-lg p-2 transition-colors",
              "text-muted-foreground hover:bg-muted hover:text-foreground",
              (disabled || sending || uploading) && "cursor-not-allowed opacity-50"
            )}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
          </button>

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
            disabled={!canSend}
            className={cn(
              "shrink-0 rounded-lg p-2 transition-colors",
              canSend
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
            title="Enviar (Enter)"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-1 text-right text-[10px] text-muted-foreground">
          Enter para enviar · Shift+Enter para nova linha · 📎 até 20 MB
        </p>
      </div>
    );
  }
);
