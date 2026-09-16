import { describe, expect, it } from "vitest";

import {
  ACTIVE_CONVERSATION_STATUSES,
  OUTBOUND_MESSAGE_SENDERS,
} from "./queries";

describe("dashboard metric filters", () => {
  it("treats pending handoff threads as active", () => {
    expect(ACTIVE_CONVERSATION_STATUSES).toContain("pending");
    expect(ACTIVE_CONVERSATION_STATUSES).toContain("open");
    expect(ACTIVE_CONVERSATION_STATUSES).not.toContain("closed");
  });

  it("counts AI replies as messages sent", () => {
    expect(OUTBOUND_MESSAGE_SENDERS).toContain("bot");
    expect(OUTBOUND_MESSAGE_SENDERS).toContain("agent");
  });
});
