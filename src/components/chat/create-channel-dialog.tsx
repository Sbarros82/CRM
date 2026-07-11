"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Hash, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface CreateChannelDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (channelId: string) => void;
}

export function CreateChannelDialog({
  open,
  onClose,
  onCreated,
}: CreateChannelDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  // Slugifica o nome: lowercase, sem espaços, sem acentos, apenas a-z0-9-.
  const slugify = (v: string) =>
    v
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);

  const handleCreate = useCallback(async () => {
    const slug = slugify(name);
    if (!slug) {
      toast.error("Nome do canal inválido");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("create_chat_channel", {
        p_name: slug,
        p_description: description.trim() || null,
      });

      if (error) throw new Error(error.message);

      toast.success(`Canal #${slug} criado`);
      setName("");
      setDescription("");
      onCreated(data as string);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar canal");
    } finally {
      setLoading(false);
    }
  }, [name, description, onCreated, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold text-foreground">Criar canal</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Canais são onde a equipa se comunica. Crie um para um tema específico.
        </p>

        {/* Nome */}
        <label className="mb-3 block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Nome</span>
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
            <Hash className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="text"
              autoFocus
              placeholder="ex: marketing, ti, geral"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              maxLength={50}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          {name && (
            <p className="mt-1 text-xs text-muted-foreground">
              Será criado como: <span className="font-mono text-foreground">#{slugify(name)}</span>
            </p>
          )}
        </label>

        {/* Descrição */}
        <label className="mb-6 block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">
            Descrição <span className="text-muted-foreground">(opcional)</span>
          </span>
          <input
            type="text"
            placeholder="Para que serve este canal?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={120}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </label>

        {/* Ações */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!name.trim() || loading}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              name.trim() && !loading
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "cursor-not-allowed bg-muted text-muted-foreground"
            )}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Criar canal
          </button>
        </div>
      </div>
    </div>
  );
}
