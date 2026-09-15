"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useChatChannels } from "@/hooks/use-chat-channels";
import { usePresence } from "@/hooks/use-presence";
import { ChannelSidebar } from "@/components/chat/channel-sidebar";
import { MessageThread } from "@/components/chat/message-thread";
import { MembersPanel } from "@/components/chat/members-panel";
import { CreateChannelDialog } from "@/components/chat/create-channel-dialog";
import { NewDmDialog } from "@/components/chat/new-dm-dialog";
import { createClient } from "@/lib/supabase/client";
import { setFocusedChatChannel } from "@/lib/chat/focused-channel";
import type { ChatChannelMember } from "@/types";

export default function ChatPage() {
  const { user, accountId } = useAuth();
  const searchParams = useSearchParams();
  const requestedChannelId = searchParams.get("c");
  const { channels, availableChannels, markAsRead, refetch, joinChannel } = useChatChannels();
  const { getPresence, getRow, now } = usePresence();

  const [activeChannelId, setActiveChannelId] = useState<string | null>(
    requestedChannelId,
  );
  const [channelMembers, setChannelMembers] = useState<ChatChannelMember[]>([]);
  const [dmMembers, setDmMembers] = useState<ChatChannelMember[]>([]);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showNewDm, setShowNewDm] = useState(false);
  const [showMembersPanel, setShowMembersPanel] = useState(true);

  const activeChannel = channels.find((c) => c.id === activeChannelId) ?? null;

  useEffect(() => {
    if (requestedChannelId) setActiveChannelId(requestedChannelId);
  }, [requestedChannelId]);

  useEffect(() => {
    setFocusedChatChannel(activeChannelId);
    return () => setFocusedChatChannel(null);
  }, [activeChannelId]);

  // Seleciona o canal pedido na URL, ou o primeiro ao carregar.
  useEffect(() => {
    if (activeChannelId) return;
    if (requestedChannelId && channels.some((c) => c.id === requestedChannelId)) {
      setActiveChannelId(requestedChannelId);
      return;
    }
    if (channels.length > 0) {
      setActiveChannelId(channels[0].id);
    }
  }, [channels, activeChannelId, requestedChannelId]);

  // Carrega membros do canal ativo e atualiza se alguém entrar.
  useEffect(() => {
    if (!activeChannelId) {
      setChannelMembers([]);
      return;
    }

    let cancelled = false;
    const supabase = createClient();

    const loadChannelMembers = async () => {
      const { data: memberRows } = await supabase
        .from("chat_channel_members")
        .select("channel_id, user_id, last_read_at, joined_at")
        .eq("channel_id", activeChannelId);

      if (cancelled || !memberRows) return;

      const userIds = memberRows.map((m) => m.user_id as string);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      if (cancelled) return;

      const profileMap = new Map(
        (profiles ?? []).map((p) => [
          p.user_id as string,
          {
            full_name: (p.full_name as string) ?? "Membro",
            avatar_url: p.avatar_url as string | null,
          },
        ]),
      );

      setChannelMembers(
        memberRows.map((m) => ({
          channel_id: m.channel_id as string,
          user_id: m.user_id as string,
          last_read_at: m.last_read_at as string | null,
          joined_at: m.joined_at as string,
          full_name: profileMap.get(m.user_id as string)?.full_name,
          avatar_url: profileMap.get(m.user_id as string)?.avatar_url,
        })),
      );
    };

    void loadChannelMembers();

    const watch = supabase
      .channel(`chat-members-${activeChannelId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_channel_members",
          filter: `channel_id=eq.${activeChannelId}`,
        },
        () => {
          void loadChannelMembers();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(watch);
    };
  }, [activeChannelId]);

  // Nomes dos parceiros de DM — o painel do canal ativo não cobre os outros DMs.
  useEffect(() => {
    const dmIds = channels.filter((c) => c.is_dm).map((c) => c.id);
    if (dmIds.length === 0) {
      setDmMembers([]);
      return;
    }

    const supabase = createClient();
    let cancelled = false;

    (async () => {
      const { data: memberRows } = await supabase
        .from("chat_channel_members")
        .select("channel_id, user_id, last_read_at, joined_at")
        .in("channel_id", dmIds);
      if (cancelled || !memberRows) return;

      const userIds = [...new Set(memberRows.map((m) => m.user_id as string))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);
      if (cancelled) return;

      const profileMap = new Map(
        (profiles ?? []).map((p) => [
          p.user_id as string,
          {
            full_name: (p.full_name as string) ?? "Membro",
            avatar_url: p.avatar_url as string | null,
          },
        ]),
      );

      setDmMembers(
        memberRows.map((m) => ({
          channel_id: m.channel_id as string,
          user_id: m.user_id as string,
          last_read_at: m.last_read_at as string | null,
          joined_at: m.joined_at as string,
          full_name: profileMap.get(m.user_id as string)?.full_name,
          avatar_url: profileMap.get(m.user_id as string)?.avatar_url,
        })),
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [channels]);

  // Para DMs: nome do parceiro.
  const dmPartnerName = useCallback(() => {
    if (!activeChannel?.is_dm || !user) return undefined;
    const partner = channelMembers.find((m) => m.user_id !== user.id);
    return partner?.full_name;
  }, [activeChannel, channelMembers, user]);

  // Abre DM via RPC e navega para ele.
  const handleStartDmFromMembers = useCallback(
    async (userId: string) => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("open_or_create_dm", {
        p_other_user_id: userId,
      });
      if (error || !data) return;
      await refetch();
      setActiveChannelId(data as string);
    },
    [refetch]
  );

  // Callback quando canal criado ou DM aberto.
  const handleChannelCreated = useCallback(
    async (channelId: string) => {
      await refetch();
      setActiveChannelId(channelId);
    },
    [refetch]
  );

  if (!user || !accountId) return null;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* ── Sidebar de canais (240px) ── */}
      <div className="hidden w-60 shrink-0 lg:block">
        <ChannelSidebar
          channels={channels}
          availableChannels={availableChannels}
          activeChannelId={activeChannelId}
          members={[...channelMembers, ...dmMembers]}
          getPresence={getPresence}
          currentUserId={user.id}
          onSelectChannel={(id) => {
            setActiveChannelId(id);
            markAsRead(id);
          }}
          onCreateChannel={() => setShowCreateChannel(true)}
          onStartDm={() => setShowNewDm(true)}
          onJoinChannel={async (id) => {
            const ok = await joinChannel(id);
            if (ok) {
              setActiveChannelId(id);
              markAsRead(id);
            }
          }}
        />
      </div>

      {/* ── Thread central (flex-1) ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <MessageThread
          channel={activeChannel}
          currentUserId={user.id}
          dmPartnerName={dmPartnerName()}
          onMarkRead={markAsRead}
        />
      </div>

      {/* ── Painel de membros (220px) — oculto em mobile e em DMs ── */}
      {showMembersPanel && !activeChannel?.is_dm && (
        <div className="hidden w-56 shrink-0 lg:block">
          <MembersPanel
            members={channelMembers}
            currentUserId={user.id}
            getPresence={getPresence}
            getRow={getRow}
            now={now}
            onStartDm={handleStartDmFromMembers}
          />
        </div>
      )}

      {/* ── Dialogs ── */}
      <CreateChannelDialog
        open={showCreateChannel}
        onClose={() => setShowCreateChannel(false)}
        onCreated={handleChannelCreated}
      />
      <NewDmDialog
        open={showNewDm}
        accountId={accountId}
        currentUserId={user.id}
        getPresence={getPresence}
        onClose={() => setShowNewDm(false)}
        onOpened={handleChannelCreated}
      />
    </div>
  );
}
