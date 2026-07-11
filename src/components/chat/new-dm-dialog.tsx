"use client";

import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Search, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { PresenceStatus } from "@/lib/presence";

interface Member {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

interface NewDmDialogProps {
  open: boolean;
  accountId: string;
  currentUserId: string;
  getPresence: (userId: string) => PresenceStatus;
  onClose: () => void;
  onOpened: (channelId: string) => void;
}

function PresenceDot({ status }: { status: PresenceStatus }) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 shrink-0 rounded-full",
        status === "online" && "bg-emerald-400",
        status === "away" && "bg-amber-400",
        status === "offline" && "bg-muted-foreground/40"
      )}
    />
  );
}

export function NewDmDialog({
  open,
  accountId,
  currentUserId,
  getPresence,
  onClose,
  onOpened,
}: NewDmDialogProps) {
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);

  // Carrega membros do account quando o dialog abre.
  useEffect(() => {
    if (!open || !accountId) return;
    setLoadingMembers(true);

    const supabase = createClient();
    supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .eq("account_id", accountId)
      .neq("user_id", currentUserId)
      .then(({ data }) => {
        setMembers(
          (data ?? []).map((p) => ({
            user_id: p.user_id as string,
            full_name: (p.full_name as string) ?? "Membro",
            avatar_url: p.avatar_url as string | null,
          }))
        );
        setLoadingMembers(false);
      });
  }, [open, accountId, currentUserId]);

  const handleOpenDm = useCallback(
    async (userId: string) => {
      setOpeningId(userId);
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc("open_or_create_dm", {
          p_other_user_id: userId,
        });
        if (error) throw new Error(error.message);
        onOpened(data as string);
        onClose();
        setSearch("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao abrir conversa");
      } finally {
        setOpeningId(null);
      }
    },
    [onOpened, onClose]
  );

  const filtered = search
    ? members.filter((m) =>
        m.full_name.toLowerCase().includes(search.toLowerCase())
      )
    : members;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-card shadow-xl">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Nova mensagem direta</h2>
        </div>

        {/* Busca */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            type="text"
            placeholder="Buscar membro…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        {/* Lista de membros */}
        <ul className="max-h-72 overflow-y-auto py-2">
          {loadingMembers && (
            <li className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </li>
          )}
          {!loadingMembers && filtered.length === 0 && (
            <li className="py-6 text-center text-sm text-muted-foreground">
              {search ? "Nenhum membro encontrado" : "Nenhum outro membro"}
            </li>
          )}
          {!loadingMembers &&
            filtered.map((m) => {
              const presence = getPresence(m.user_id);
              const initials = m.full_name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              return (
                <li key={m.user_id}>
                  <button
                    type="button"
                    onClick={() => handleOpenDm(m.user_id)}
                    disabled={!!openingId}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={m.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-0.5 -right-0.5">
                        <PresenceDot status={presence} />
                      </span>
                    </div>
                    <span className="flex-1 truncate text-left text-foreground">
                      {m.full_name}
                    </span>
                    {openingId === m.user_id && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </button>
                </li>
              );
            })}
        </ul>

        <div className="border-t border-border px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
