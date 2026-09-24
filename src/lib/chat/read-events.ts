/**
 * In-tab bus so marking a chat channel as read updates the sidebar /
 * mobile-nav badge immediately. Relies on this because Realtime
 * UPDATE filters on `chat_channel_members.user_id` often miss events
 * when only `last_read_at` changes (replica identity = default).
 */

type Handler = (channelId: string, lastReadAt: string) => void;

const handlers = new Set<Handler>();

export function onChatChannelRead(handler: Handler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

export function emitChatChannelRead(
  channelId: string,
  lastReadAt: string = new Date().toISOString(),
): void {
  for (const handler of handlers) {
    try {
      handler(channelId, lastReadAt);
    } catch {
      // Listener errors must not break mark-as-read.
    }
  }
}
