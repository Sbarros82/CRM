const SCRATCHPAD =
  /here's a thinking process|analyze user input|identify context|check previous pattern|determine respon/i;

const INSTRUCTION_ECHO =
  /we need answer|need explain|need answer prices|portuguese brazil|portugues do brasil|no reasoning|no english|no numbered list|continue qualifying|capture lead|response options|let'?s check|short sentences|constraints:/i;

/**
 * True when the model dumped chain-of-thought or restated the
 * system prompt instead of answering the customer.
 */
export function looksLikeModelScratchpad(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  return (
    SCRATCHPAD.test(t) ||
    INSTRUCTION_ECHO.test(t) ||
    /<think>/i.test(t) ||
    /\*analyze user input\*/i.test(t)
  );
}

export function isSafeCustomerReply(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (looksLikeModelScratchpad(t)) return false;
  return true;
}

/**
 * WhatsApp must only ever see the customer-facing line, never a
 * model's chain-of-thought (common with OpenRouter `:free` routers).
 */
export function sanitizeAiCustomerReply(
  raw: string,
  fallback = "Olá! Como posso ajudar?",
): string {
  let t = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  if (!t) return fallback;

  if (looksLikeModelScratchpad(t)) {
    const parts = t
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
    const candidate = [...parts].reverse().find(isLikelyCustomerFacing);
    const out = clip(candidate ?? fallback);
    return isSafeCustomerReply(out) ? out : fallback;
  }

  const out = clip(t);
  return isSafeCustomerReply(out) ? out : fallback;
}

function isLikelyCustomerFacing(p: string): boolean {
  if (p.length > 500) return false;
  if (looksLikeModelScratchpad(p)) return false;
  if (/^\d+\.\s/.test(p)) return false;
  if (/^\*[A-Z]/.test(p)) return false;
  return true;
}

function clip(text: string): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= 700) return t;
  return `${t.slice(0, 697).trim()}…`;
}
