/**
 * WhatsApp STOP / START intent — Brazilian + English keywords.
 *
 * Matched against the *whole* inbound text (trimmed, case-insensitive,
 * punctuation stripped) so "pode parar de mandar?" does not opt the
 * contact out, but "PARAR" / "STOP" / "sair" does.
 */

const STOP_KEYWORDS = [
  "stop",
  "parar",
  "sair",
  "cancelar",
  "unsubscribe",
  "descadastrar",
  "pare",
  "cancela",
] as const;

const START_KEYWORDS = [
  "start",
  "iniciar",
  "voltar",
  "subscribe",
] as const;

function normalizeIntentText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type OptOutIntent = "stop" | "start";

export function classifyOptOutIntent(text: string | null | undefined): OptOutIntent | null {
  if (!text) return null;
  const normalized = normalizeIntentText(text);
  if (!normalized) return null;
  if ((STOP_KEYWORDS as readonly string[]).includes(normalized)) return "stop";
  if ((START_KEYWORDS as readonly string[]).includes(normalized)) return "start";
  return null;
}

export function isOptedOut(optedOutAt: string | null | undefined): boolean {
  return typeof optedOutAt === "string" && optedOutAt.length > 0;
}

export const STOP_CONFIRMATION =
  "Você foi descadastrado e não receberá mais mensagens nossas. Responda INICIAR se quiser voltar.";

export const START_CONFIRMATION =
  "Pronto — você voltou a receber mensagens. Como podemos ajudar?";
