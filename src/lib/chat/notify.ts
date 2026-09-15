export function shouldNotifyChatMessage(opts: {
  senderId: string;
  currentUserId: string;
  channelId: string;
  focusedChannelId: string | null;
  tabVisible: boolean;
}): boolean {
  if (!opts.currentUserId) return false;
  if (opts.senderId === opts.currentUserId) return false;
  if (opts.tabVisible && opts.focusedChannelId === opts.channelId) {
    return false;
  }
  return true;
}
