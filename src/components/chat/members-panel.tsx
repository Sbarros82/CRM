"use client";

import { cn } from "@/lib/utils";
import { Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { presenceLabel } from "@/lib/presence";
import type { ChatChannelMember } from "@/types";
import type { PresenceStatus } from "@/lib/presence";

interface MembersPanelProps {
  members: ChatChannelMember[];
  currentUserId: string;
  getPresence: (userId: string) => PresenceStatus;
  getRow: (userId: string) => { status: string; last_seen_at: string } | undefined;
  now: number;
  onStartDm: (userId: string) => void;
}

function PresenceDot({ status }: { status: PresenceStatus }) {
  return (
    <span
      className={cn(
        "inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-card",
        status === "online" && "bg-emerald-400",
        status === "away" && "bg-amber-400",
        status === "offline" && "bg-muted-foreground/40"
      )}
    />
  );
}

function MemberRow({
  member,
  presence,
  tooltip,
  isCurrentUser,
  onStartDm,
}: {
  member: ChatChannelMember;
  presence: PresenceStatus;
  tooltip: string;
  isCurrentUser: boolean;
  onStartDm: () => void;
}) {
  const name = member.full_name ?? "Membro";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <li>
      <button
        type="button"
        onClick={!isCurrentUser ? onStartDm : undefined}
        disabled={isCurrentUser}
        title={isCurrentUser ? "Você" : tooltip}
        className={cn(
          "group flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
          !isCurrentUser && "hover:bg-accent cursor-pointer",
          isCurrentUser && "cursor-default"
        )}
      >
        <div className="relative shrink-0">
          <Avatar className="h-7 w-7">
            <AvatarImage src={member.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-0.5 -right-0.5">
            <PresenceDot status={presence} />
          </span>
        </div>
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-left",
            presence === "offline" ? "text-muted-foreground" : "text-foreground"
          )}
        >
          {name}
          {isCurrentUser && (
            <span className="ml-1 text-xs text-muted-foreground">(você)</span>
          )}
        </span>
      </button>
    </li>
  );
}

export function MembersPanel({
  members,
  currentUserId,
  getPresence,
  getRow,
  now,
  onStartDm,
}: MembersPanelProps) {
  // Separa em grupos por status.
  const online = members.filter((m) => getPresence(m.user_id) === "online");
  const away = members.filter((m) => getPresence(m.user_id) === "away");
  const offline = members.filter((m) => getPresence(m.user_id) === "offline");

  const renderGroup = (title: string, group: ChatChannelMember[], status: PresenceStatus) => {
    if (group.length === 0) return null;
    return (
      <section className="mb-4">
        <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title} — {group.length}
        </p>
        <ul className="space-y-0.5">
          {group.map((m) => {
            const row = getRow(m.user_id);
            const tooltip = presenceLabel(status, row?.last_seen_at, now);
            return (
              <MemberRow
                key={m.user_id}
                member={m}
                presence={status}
                tooltip={tooltip}
                isCurrentUser={m.user_id === currentUserId}
                onStartDm={() => onStartDm(m.user_id)}
              />
            );
          })}
        </ul>
      </section>
    );
  };

  return (
    <div className="flex h-full flex-col border-l border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Users className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">
          Membros ({members.length})
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {renderGroup("Online", online, "online")}
        {renderGroup("Ausente", away, "away")}
        {renderGroup("Offline", offline, "offline")}
        {members.length === 0 && (
          <p className="text-center text-xs text-muted-foreground">Sem membros</p>
        )}
      </div>
    </div>
  );
}
