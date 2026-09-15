import { describe, expect, it } from "vitest";
import { extractOpenAiCompatibleText } from "./extract-completion";

describe("extractOpenAiCompatibleText", () => {
  it("reads string content", () => {
    expect(
      extractOpenAiCompatibleText({
        choices: [{ message: { content: "  Oi!  " } }],
      }),
    ).toBe("Oi!");
  });

  it("falls back to reasoning when content is empty", () => {
    expect(
      extractOpenAiCompatibleText({
        choices: [
          {
            message: {
              content: "",
              reasoning: "Here's a thinking process:\n\nStart R$ 297.",
            },
          },
        ],
      }),
    ).toBe("Here's a thinking process:\n\nStart R$ 297.");
  });

  it("prefers content over reasoning", () => {
    expect(
      extractOpenAiCompatibleText({
        choices: [
          {
            message: {
              content: "Plano Grow R$ 497.",
              reasoning: "Here's a thinking process",
            },
          },
        ],
      }),
    ).toBe("Plano Grow R$ 497.");
  });

  it("joins array content parts", () => {
    expect(
      extractOpenAiCompatibleText({
        choices: [
          {
            message: {
              content: [{ type: "text", text: "Plano Grow R$ 497." }],
            },
          },
        ],
      }),
    ).toBe("Plano Grow R$ 497.");
  });
});
