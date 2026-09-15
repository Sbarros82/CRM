import { describe, expect, it } from "vitest";
import { isHandoffRequest, isModelHandoffReply } from "./dispatch";

describe("isHandoffRequest", () => {
  it("detects human-handoff phrasing", () => {
    expect(isHandoffRequest("quero falar com um consultor")).toBe(true);
    expect(isHandoffRequest("como faço para fechar um plano?")).toBe(true);
    expect(isHandoffRequest("quero fechar o plano")).toBe(true);
    expect(isHandoffRequest("Pode chamar um ATENDENTE?")).toBe(true);
    expect(isHandoffRequest("atendimento humano por favor")).toBe(true);
  });

  it("does not trip on unrelated text", () => {
    expect(isHandoffRequest("como faço para conseguir ter mais acesso?")).toBe(
      false,
    );
    expect(isHandoffRequest("oi")).toBe(false);
    expect(
      isHandoffRequest(
        "Sou o assistente, posso te ajudar ou prefere um atendente?",
      ),
    ).toBe(false);
  });
});

describe("isModelHandoffReply", () => {
  it("detects an explicit token or a clear handoff sentence", () => {
    expect(isModelHandoffReply("Anotei os dados.\n[[HANDOFF]]")).toBe(true);
    expect(
      isModelHandoffReply(
        "Sergio, vou encaminhar você para um consultor humano que explica o plano.",
      ),
    ).toBe(true);
  });

  it("does not trip on offering a consultant later", () => {
    expect(
      isModelHandoffReply(
        "Posso encaminhar para um consultor depois. Qual é a sua cidade?",
      ),
    ).toBe(false);
  });
});
