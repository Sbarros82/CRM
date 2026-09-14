import { describe, expect, it } from "vitest";
import { assertCanSend, SendBlockedError } from "./send-guards";

const recent = new Date(Date.now() - 60 * 60 * 1000).toISOString();
const stale = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();

describe("assertCanSend", () => {
  it("allows session messages inside the window", () => {
    expect(() =>
      assertCanSend({ kind: "session", lastInboundAt: recent }),
    ).not.toThrow();
  });

  it("blocks session messages outside the window", () => {
    try {
      assertCanSend({ kind: "session", lastInboundAt: stale });
      throw new Error("expected throw");
    } catch (err) {
      expect(err).toBeInstanceOf(SendBlockedError);
      expect((err as SendBlockedError).code).toBe("session_expired");
    }
  });

  it("allows templates outside the window", () => {
    expect(() =>
      assertCanSend({ kind: "template", lastInboundAt: stale }),
    ).not.toThrow();
  });

  it("blocks opted-out contacts even for templates", () => {
    try {
      assertCanSend({
        kind: "template",
        optedOutAt: recent,
        lastInboundAt: recent,
      });
      throw new Error("expected throw");
    } catch (err) {
      expect(err).toBeInstanceOf(SendBlockedError);
      expect((err as SendBlockedError).code).toBe("opted_out");
    }
  });

  it("ignoreOptOut still respects the 24h window", () => {
    try {
      assertCanSend({
        kind: "session",
        optedOutAt: recent,
        lastInboundAt: stale,
        ignoreOptOut: true,
      });
      throw new Error("expected throw");
    } catch (err) {
      expect((err as SendBlockedError).code).toBe("session_expired");
    }
  });
});
