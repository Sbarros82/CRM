import { describe, expect, it } from "vitest";
import { isSessionOpen, requiresOpenSession } from "./session-window";

describe("isSessionOpen", () => {
  const now = new Date("2026-09-14T15:00:00.000Z");

  it("is open inside 24h of the last inbound", () => {
    expect(isSessionOpen("2026-09-13T15:00:01.000Z", now)).toBe(true);
    expect(isSessionOpen("2026-09-14T14:59:00.000Z", now)).toBe(true);
  });

  it("expires at exactly 24h", () => {
    expect(isSessionOpen("2026-09-13T15:00:00.000Z", now)).toBe(false);
  });

  it("is closed with no inbound", () => {
    expect(isSessionOpen(null, now)).toBe(false);
    expect(isSessionOpen(undefined, now)).toBe(false);
    expect(isSessionOpen("not-a-date", now)).toBe(false);
  });
});

describe("requiresOpenSession", () => {
  it("session messages need the window; templates do not", () => {
    expect(requiresOpenSession("session")).toBe(true);
    expect(requiresOpenSession("template")).toBe(false);
  });
});
