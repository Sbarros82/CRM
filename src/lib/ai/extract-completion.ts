export function extractOpenAiCompatibleText(json: unknown): string {
  const root = json as {
    choices?: Array<{
      message?: {
        content?: unknown;
        reasoning?: unknown;
        reasoning_content?: unknown;
        reasoning_details?: unknown;
      };
    }>;
  };
  const msg = root.choices?.[0]?.message;
  if (!msg) return "";

  const content = collectText(msg.content);
  if (content) return content;

  const reasoning = [
    collectText(msg.reasoning),
    collectText(msg.reasoning_content),
    collectText(msg.reasoning_details),
  ]
    .filter(Boolean)
    .join("\n\n")
    .trim();
  return reasoning;
}

function collectText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (!Array.isArray(value)) return "";
  const parts: string[] = [];
  for (const piece of value) {
    if (typeof piece === "string" && piece.trim()) {
      parts.push(piece.trim());
      continue;
    }
    if (piece && typeof piece === "object") {
      const rec = piece as Record<string, unknown>;
      if (typeof rec.text === "string" && rec.text.trim()) {
        parts.push(rec.text.trim());
      } else if (typeof rec.content === "string" && rec.content.trim()) {
        parts.push(rec.content.trim());
      } else if (typeof rec.summary === "string" && rec.summary.trim()) {
        parts.push(rec.summary.trim());
      }
    }
  }
  return parts.join("\n").trim();
}
