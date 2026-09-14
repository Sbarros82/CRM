import { describe, expect, it } from "vitest";
import { isHandoffRequest } from "./dispatch";

describe("isHandoffRequest", () => {
  it("detects human-handoff phrasing", () => {
    expect(isHandoffRequest("quero falar com um humano")).toBe(true);
    expect(isHandoffRequest("Pode chamar um ATENDENTE?")).toBe(true);
    expect(isHandoffRequest("atendimento humano por favor")).toBe(true);
  });

  it("does not trip on unrelated text", () => {
    expect(isHandoffRequest("quero agendar uma visita")).toBe(false);
    expect(isHandoffRequest("oi")).toBe(false);
  });
});
