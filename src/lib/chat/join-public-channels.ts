import { supabaseAdmin } from "@/lib/flows/admin-client";

export function publicChannelMemberRows(
  channels: Array<{ id: string; is_dm: boolean; is_private: boolean }>,
  userId: string,
): Array<{ channel_id: string; user_id: string }> {
  return channels
    .filter((channel) => !channel.is_dm && !channel.is_private)
    .map((channel) => ({ channel_id: channel.id, user_id: userId }));
}

/**
 * Puts a teammate into every public (non-DM) channel of the account.
 * Used after invitation redeem so they show up in #geral without a
 * second "join channel" click.
 */
export async function joinAccountPublicChatChannels(
  accountId: string,
  userId: string,
): Promise<number> {
  const db = supabaseAdmin();
  const { data: channels, error } = await db
    .from("chat_channels")
    .select("id, is_dm, is_private")
    .eq("account_id", accountId);

  if (error) {
    console.error("[joinAccountPublicChatChannels] list channels:", error);
    return 0;
  }

  const rows = publicChannelMemberRows(
    (channels ?? []) as Array<{
      id: string;
      is_dm: boolean;
      is_private: boolean;
    }>,
    userId,
  );
  if (rows.length === 0) return 0;

  const { error: insertError } = await db
    .from("chat_channel_members")
    .upsert(rows, { onConflict: "channel_id,user_id", ignoreDuplicates: true });

  if (insertError) {
    console.error("[joinAccountPublicChatChannels] insert:", insertError);
    return 0;
  }

  return rows.length;
}
