import { describe, expect, it } from "vitest";
import { isHandoffAlert } from "./use-handoff-desktop-alerts";
import type { Conversation } from "@/types";

const base = {
  id: "c1",
  user_id: "u1",
  contact_id: "k1",
  unread_count: 1,
  created_at: "",
  updated_at: "",
} as Conversation;

describe("isHandoffAlert", () => {
  it("fires when a thread becomes pending with IA paused", () => {
    expect(
      isHandoffAlert(
        { ...base, status: "open", ai_paused: false },
        { ...base, status: "pending", ai_paused: true },
      ),
    ).toBe(true);
  });

  it("does not repeat on later updates of the same handoff", () => {
    expect(
      isHandoffAlert(
        { ...base, status: "pending", ai_paused: true },
        { ...base, status: "pending", ai_paused: true, unread_count: 2 },
      ),
    ).toBe(false);
  });
});
