import { describe, expect, it } from "vitest";
import {
  isSafeCustomerReply,
  looksLikeModelScratchpad,
  sanitizeAiCustomerReply,
} from "./sanitize-reply";

describe("sanitizeAiCustomerReply", () => {
  it("passes through a normal Portuguese greeting", () => {
    expect(sanitizeAiCustomerReply("Boa noite! Como posso ajudar?")).toBe(
      "Boa noite! Como posso ajudar?",
    );
  });

  it("drops OpenRouter thinking dumps", () => {
    const raw = `Here's a thinking process:
1. *Analyze User Input:* User says "oi boa noite!"
2. *Identify Context:* This is a WhatsApp sales assistant.

Boa noite! Em que posso ajudar?`;
    expect(looksLikeModelScratchpad(raw)).toBe(true);
    expect(sanitizeAiCustomerReply(raw)).toBe("Boa noite! Em que posso ajudar?");
  });

  it("falls back when there is no customer-facing line", () => {
    expect(
      sanitizeAiCustomerReply(
        `Here's a thinking process:\n1. *Analyze User Input:* oi`,
      ),
    ).toBe("Olá! Como posso ajudar?");
  });

  it("blocks English instruction-echo dumps", () => {
    const raw = `We need answer only final customer, Portuguese Brazil, 2-5 short sentences, no reasoning, no English, no numbered list. Need explain Snap, capture lead. User asks plans. Need answer prices official in 2 sentences if price early, continue qualifying.`;
    expect(looksLikeModelScratchpad(raw)).toBe(true);
    expect(isSafeCustomerReply(raw)).toBe(false);
    expect(sanitizeAiCustomerReply(raw)).toBe("Olá! Como posso ajudar?");
  });

  it("keeps a real Portuguese price reply", () => {
    const raw =
      "O Snap tem Start R$ 297, Grow R$ 497 e Scale R$ 897 por mês. Quantas pessoas atendem o WhatsApp na clínica?";
    expect(looksLikeModelScratchpad(raw)).toBe(false);
    expect(sanitizeAiCustomerReply(raw)).toBe(raw);
  });

  it("strips CPA_DONE and similar control tags", () => {
    expect(
      sanitizeAiCustomerReply(
        "De nada, Maria! Fico à disposição. <CPA_DONE>",
      ),
    ).toBe("De nada, Maria! Fico à disposição.");
  });
});
