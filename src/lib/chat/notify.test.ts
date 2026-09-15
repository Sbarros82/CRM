import { describe, expect, it } from "vitest";

import { shouldNotifyChatMessage } from "./notify";

const base = {
  senderId: "carlos",
  currentUserId: "sergio",
  channelId: "dm-1",
  focusedChannelId: null as string | null,
  tabVisible: true,
};

describe("shouldNotifyChatMessage", () => {
  it("notifies a DM from someone else while looking at another screen", () => {
    expect(shouldNotifyChatMessage(base)).toBe(true);
  });

  it("does not notify the sender", () => {
    expect(
      shouldNotifyChatMessage({ ...base, senderId: "sergio" }),
    ).toBe(false);
  });

  it("stays quiet when the DM is open and the tab is visible", () => {
    expect(
      shouldNotifyChatMessage({
        ...base,
        focusedChannelId: "dm-1",
        tabVisible: true,
      }),
    ).toBe(false);
  });

  it("notifies when the DM is open but the tab is in the background", () => {
    expect(
      shouldNotifyChatMessage({
        ...base,
        focusedChannelId: "dm-1",
        tabVisible: false,
      }),
    ).toBe(true);
  });
});
