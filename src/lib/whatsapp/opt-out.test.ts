import { describe, expect, it } from "vitest";
import { classifyOptOutIntent, isOptedOut } from "./opt-out";

describe("classifyOptOutIntent", () => {
  it("matches STOP keywords as whole messages", () => {
    expect(classifyOptOutIntent("STOP")).toBe("stop");
    expect(classifyOptOutIntent(" parar ")).toBe("stop");
    expect(classifyOptOutIntent("Sair!")).toBe("stop");
    expect(classifyOptOutIntent("descadastrar")).toBe("stop");
  });

  it("matches START keywords", () => {
    expect(classifyOptOutIntent("INICIAR")).toBe("start");
    expect(classifyOptOutIntent("start")).toBe("start");
    expect(classifyOptOutIntent("voltar")).toBe("start");
  });

  it("ignores keywords buried in a sentence", () => {
    expect(classifyOptOutIntent("pode parar de mandar?")).toBeNull();
    expect(classifyOptOutIntent("quero cancelar o pedido")).toBeNull();
    expect(classifyOptOutIntent("vamos iniciar o agendamento")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(classifyOptOutIntent(null)).toBeNull();
    expect(classifyOptOutIntent("")).toBeNull();
    expect(classifyOptOutIntent("   ")).toBeNull();
  });
});

describe("isOptedOut", () => {
  it("is true only when a timestamp is present", () => {
    expect(isOptedOut("2026-09-14T12:00:00Z")).toBe(true);
    expect(isOptedOut(null)).toBe(false);
    expect(isOptedOut("")).toBe(false);
  });
});
