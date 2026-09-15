import { describe, expect, it } from "vitest";
import {
  extractSpokenName,
  firstNameFromDisplay,
  needsPersonalName,
} from "./contact-name";

describe("firstNameFromDisplay", () => {
  it("uses a personal first name", () => {
    expect(firstNameFromDisplay("Sergio Barros")).toBe("Sergio");
    expect(firstNameFromDisplay("Ana")).toBe("Ana");
  });

  it("rejects company or phone labels", () => {
    expect(firstNameFromDisplay("Masterop Operadora")).toBeNull();
    expect(firstNameFromDisplay("SUPORTE TI MASTEROP")).toBeNull();
    expect(firstNameFromDisplay("558281812000")).toBeNull();
    expect(needsPersonalName("Masterop Operadora")).toBe(true);
  });
});

describe("extractSpokenName", () => {
  it("reads common Brazilian introductions", () => {
    expect(extractSpokenName("Oi, me chamo Carla")).toBe("Carla");
    expect(extractSpokenName("meu nome é João Silva")).toBe("João Silva");
    expect(extractSpokenName("sou a Marina, tudo bem?")).toBe("Marina");
  });
});
