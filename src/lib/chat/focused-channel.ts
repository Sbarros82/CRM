let focusedChannelId: string | null = null;

export function setFocusedChatChannel(channelId: string | null): void {
  focusedChannelId = channelId;
}

export function getFocusedChatChannel(): string | null {
  return focusedChannelId;
}
