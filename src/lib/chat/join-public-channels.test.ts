import { describe, expect, it } from "vitest";

import { publicChannelMemberRows } from "./join-public-channels";

describe("publicChannelMemberRows", () => {
  it("adds the user only to public non-DM channels", () => {
    const rows = publicChannelMemberRows(
      [
        { id: "geral", is_dm: false, is_private: false },
        { id: "ti", is_dm: false, is_private: true },
        { id: "dm", is_dm: true, is_private: false },
      ],
      "user-1",
    );
    expect(rows).toEqual([{ channel_id: "geral", user_id: "user-1" }]);
  });
});
