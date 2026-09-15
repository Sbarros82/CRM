"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Contact } from "@/types";
import { CONTACT_AVATAR_MAX_BYTES, CONTACT_AVATAR_MIME } from "@/lib/contacts/avatar";

type ContactAvatar = Pick<Contact, "id" | "name" | "phone" | "avatar_url">;

interface ContactAvatarPickerProps {
  contact: ContactAvatar;
  onPatched?: (patch: Partial<Contact>) => void;
  className?: string;
  editable?: boolean;
}

export function ContactAvatarPicker({
  contact,
  onPatched,
  className,
  editable = true,
}: ContactAvatarPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const displayName = contact.name || contact.phone || "?";
  const initial = displayName.charAt(0).toUpperCase();

  const apply = (avatar_url: string | null) => {
    onPatched?.({ avatar_url });
  };

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!CONTACT_AVATAR_MIME.has(file.type)) {
      toast.error("Use PNG, JPG, WebP ou GIF");
      return;
    }
    if (file.size > CONTACT_AVATAR_MAX_BYTES) {
      toast.error("A foto pode ter no máximo 2 MB");
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(`/api/contacts/${contact.id}/avatar`, {
        method: "POST",
        body,
      });
      const json = (await res.json().catch(() => null)) as
        | { avatar_url?: string; error?: string }
        | null;
      if (!res.ok) {
        throw new Error(json?.error || "Falha no envio");
      }
      apply(json?.avatar_url ?? null);
      toast.success("Foto do contato atualizada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no envio");
    } finally {
      setBusy(false);
    }
  };

  const onRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!contact.avatar_url || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/contacts/${contact.id}/avatar`, {
        method: "DELETE",
      });
      const json = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!res.ok) {
        throw new Error(json?.error || "Não foi possível remover");
      }
      apply(null);
      toast.success("Foto removida");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível remover");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        disabled={!editable || busy}
        onClick={() => editable && inputRef.current?.click()}
        title={editable ? "Enviar foto do contato" : undefined}
        className={cn(
          "group relative flex items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-medium text-foreground",
          editable && "cursor-pointer hover:ring-2 hover:ring-primary/40",
          className,
        )}
      >
        {contact.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={contact.avatar_url}
            alt={displayName}
            className="h-full w-full object-cover"
          />
        ) : (
          initial
        )}
        {editable && (
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-black/45 text-white transition-opacity",
              busy ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </span>
        )}
      </button>
      {editable && (
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={onPick}
        />
      )}
      {editable && contact.avatar_url && !busy && (
        <button
          type="button"
          onClick={onRemove}
          title="Remover foto"
          className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
