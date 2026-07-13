"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Hash,
  MessageCircle,
  Plus,
  ChevronDown,
  ChevronRight,
  Search,
  Globe,
  Lock,
  LogIn,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ChatChannel, ChatChannelMember } from "@/types";
import type { PresenceStatus } from "@/lib/presence";

interface ChannelSidebarProps {
  channels: ChatChannel[];
  availableChannels: ChatChannel[];
  activeChannelId: string | null;
  members: ChatChannelMember[];
  getPresence: (userId: string) => PresenceStatus;
  currentUserId: string;
  onSelectChannel: (channelId: string) => void;
  onCreateChannel: () => void;
  onStartDm: () => void;
  onJoinChannel: (channelId: string) => Promise<void>;
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

function UnreadBadge({ count }: { count: number }) {
  if (!count || count === 0) return null;
  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function ChannelSidebar({
  channels,
  availableChannels,
  activeChannelId,
  members,
  getPresence,
  currentUserId,
  onSelectChannel,
  onCreateChannel,
  onStartDm,
  onJoinChannel,
}: ChannelSidebarProps) {
  const [channelsSectionOpen, setChannelsSectionOpen] = useState(true);
  const [dmsSectionOpen, setDmsSectionOpen] = useState(true);
  const [availableSectionOpen, setAvailableSectionOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const publicChannels = channels.filter((c) => !c.is_dm);
  const dms = channels.filter((c) => c.is_dm);

  // Outros membros (para DMs) — excluindo o próprio caller.
  const otherMembers = members.filter((m) => m.user_id !== currentUserId);

  const filtered = search
    ? publicChannels.filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()))
    : publicChannels;

  const filteredAvailable = search
    ? availableChannels.filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()))
    : availableChannels;

  const handleJoin = async (channelId: string) => {
    setJoiningId(channelId);
    try {
      await onJoinChannel(channelId);
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden border-r border-border bg-card">
      {/* Cabeçalho */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar canal…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {/* ── Seção Meus Canais ── */}
        <section className="mb-2">
          <button
            type="button"
            onClick={() => setChannelsSectionOpen((v) => !v)}
            className="flex w-full items-center gap-1 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            {channelsSectionOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            Canais
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCreateChannel();
              }}
              className="ml-auto rounded p-0.5 hover:bg-accent hover:text-foreground"
              title="Criar canal"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </button>

          {channelsSectionOpen && (
            <ul className="mt-1 space-y-0.5 px-2">
              {filtered.length === 0 && (
                <li className="px-2 py-1 text-xs text-muted-foreground">
                  {search ? "Nenhum canal encontrado" : "Nenhum canal"}
                </li>
              )}
              {filtered.map((ch) => (
                <li key={ch.id}>
                  <button
                    type="button"
                    onClick={() => onSelectChannel(ch.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                      activeChannelId === ch.id
                        ? "bg-primary/10 text-foreground font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      (ch.unread_count ?? 0) > 0 && "font-semibold text-foreground"
                    )}
                  >
                    <Hash className="h-4 w-4 shrink-0 opacity-70" />
                    <span className="min-w-0 flex-1 truncate text-left">{ch.name}</span>
                    {/* Ícone de cadeado para privados */}
                    {ch.is_private && (
                      <Lock className="h-3 w-3 shrink-0 text-muted-foreground/60" title="Canal privado" />
                    )}
                    <UnreadBadge count={ch.unread_count ?? 0} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Seção Canais Disponíveis ── */}
        {filteredAvailable.length > 0 && (
          <section className="mb-2">
            <button
              type="button"
              onClick={() => setAvailableSectionOpen((v) => !v)}
              className="flex w-full items-center gap-1 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              {availableSectionOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              <Globe className="h-3 w-3" />
              Disponíveis
            </button>

            {availableSectionOpen && (
              <ul className="mt-1 space-y-0.5 px-2">
                {filteredAvailable.map((ch) => (
                  <li key={ch.id}>
                    <div className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/50">
                      <Hash className="h-4 w-4 shrink-0 opacity-50" />
                      <span className="min-w-0 flex-1 truncate text-left opacity-70">{ch.name}</span>
                      {ch.description && (
                        <span
                          className="hidden max-w-[80px] truncate text-[10px] text-muted-foreground/60 lg:block"
                          title={ch.description}
                        >
                          {ch.description}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleJoin(ch.id)}
                        disabled={joiningId === ch.id}
                        title="Entrar no canal"
                        className={cn(
                          "ml-auto flex shrink-0 items-center gap-1 rounded-md border border-primary/40 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/15",
                          joiningId === ch.id && "cursor-not-allowed opacity-50"
                        )}
                      >
                        <LogIn className="h-3 w-3" />
                        {joiningId === ch.id ? "…" : "Entrar"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* ── Seção DMs ── */}
        <section>
          <button
            type="button"
            onClick={() => setDmsSectionOpen((v) => !v)}
            className="flex w-full items-center gap-1 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            {dmsSectionOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            Mensagens Diretas
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStartDm();
              }}
              className="ml-auto rounded p-0.5 hover:bg-accent hover:text-foreground"
              title="Nova mensagem direta"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </button>

          {dmsSectionOpen && (
            <ul className="mt-1 space-y-0.5 px-2">
              {dms.length === 0 && (
                <li className="px-2 py-1 text-xs text-muted-foreground">
                  Nenhuma conversa direta
                </li>
              )}
              {dms.map((dm) => {
                // Encontra o membro do DM que não é o caller.
                const partner = members.find(
                  (m) => m.user_id !== currentUserId && m.channel_id === dm.id
                );
                const presence = partner ? getPresence(partner.user_id) : "offline";
                const name = partner?.full_name ?? "Membro";
                const avatarUrl = partner?.avatar_url ?? null;
                const initials = name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                return (
                  <li key={dm.id}>
                    <button
                      type="button"
                      onClick={() => onSelectChannel(dm.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                        activeChannelId === dm.id
                          ? "bg-primary/10 text-foreground font-medium"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        (dm.unread_count ?? 0) > 0 && "font-semibold text-foreground"
                      )}
                    >
                      <div className="relative shrink-0">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={avatarUrl ?? undefined} />
                          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                        </Avatar>
                        <PresenceDot status={presence} />
                      </div>
                      <span className="min-w-0 flex-1 truncate text-left">{name}</span>
                      <UnreadBadge count={dm.unread_count ?? 0} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
