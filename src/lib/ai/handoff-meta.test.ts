import { describe, expect, it } from "vitest";
import {
  joinHandoffMeta,
  parseNotifyPhones,
  splitHandoffMeta,
} from "./handoff-meta";

describe("splitHandoffMeta / joinHandoffMeta", () => {
  it("round-trips prompt and team settings", () => {
    const joined = joinHandoffMeta("Você vende o Snap.", {
      phones: ["5582981812000"],
      mode: "online",
    });
    const { prompt, meta } = splitHandoffMeta(joined);
    expect(prompt).toBe("Você vende o Snap.");
    expect(meta).toEqual({ phones: ["5582981812000"], mode: "online" });
  });

  it("returns defaults when the marker is absent", () => {
    expect(splitHandoffMeta("só o prompt")).toEqual({
      prompt: "só o prompt",
      meta: { phones: [], mode: "queue" },
    });
  });
});

describe("parseNotifyPhones", () => {
  it("accepts Brazilian numbers with DDD", () => {
    expect(parseNotifyPhones("82 98181-2000\n(11) 98888-7777")).toEqual([
      "5582981812000",
      "5511988887777",
    ]);
  });
});
