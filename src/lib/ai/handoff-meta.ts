export type HandoffMode = "queue" | "online" | "owner";

export interface HandoffMeta {
  phones: string[];
  mode: HandoffMode;
}

const MARKER = "\n\n<!--snap-handoff:";

export function isHandoffMode(value: unknown): value is HandoffMode {
  return value === "queue" || value === "online" || value === "owner";
}

export function defaultHandoffMeta(): HandoffMeta {
  return { phones: [], mode: "queue" };
}

export function splitHandoffMeta(raw: string | null | undefined): {
  prompt: string;
  meta: HandoffMeta;
} {
  const text = raw ?? "";
  const idx = text.lastIndexOf(MARKER);
  if (idx < 0) return { prompt: text, meta: defaultHandoffMeta() };
  const prompt = text.slice(0, idx).trimEnd();
  const tail = text.slice(idx + MARKER.length);
  const json = tail.replace(/-->\s*$/, "").trim();
  try {
    const parsed = JSON.parse(json) as { phones?: unknown; mode?: unknown };
    const phones = Array.isArray(parsed.phones)
      ? parsed.phones.filter((p): p is string => typeof p === "string" && p.trim().length > 0)
      : [];
    return {
      prompt,
      meta: {
        phones,
        mode: isHandoffMode(parsed.mode) ? parsed.mode : "queue",
      },
    };
  } catch {
    return { prompt: text, meta: defaultHandoffMeta() };
  }
}

export function joinHandoffMeta(prompt: string, meta: HandoffMeta): string {
  const body = prompt.trimEnd();
  const payload = JSON.stringify({
    phones: meta.phones,
    mode: meta.mode,
  });
  return `${body}${MARKER}${payload}-->`;
}

export function parseNotifyPhones(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[\n,;]+/)) {
    let digits = part.replace(/\D/g, "");
    if (!digits) continue;
    if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
    if (!/^[1-9]\d{9,14}$/.test(digits)) continue;
    if (seen.has(digits)) continue;
    seen.add(digits);
    out.push(digits);
  }
  return out;
}
