import { supabaseAdmin } from "@/lib/flows/admin-client";
import { isAiProvider, type AiProvider } from "./types";
import {
  defaultHandoffMeta,
  splitHandoffMeta,
  type HandoffMeta,
} from "./handoff-meta";

export type { AiProvider } from "./types";
export { isAiProvider } from "./types";
export type { HandoffMeta } from "./handoff-meta";

export interface AccountAiSettings {
  enabled: boolean;
  provider: AiProvider;
  model: string;
  systemPrompt: string | null;
  followUpHours: number;
  hasApiKey: boolean;
  handoff: HandoffMeta;
}

export const DEFAULT_AI_SYSTEM_PROMPT = `Você é o assistente de vendas desta empresa no WhatsApp.
Responda SOMENTE a mensagem final para o cliente, em português do Brasil, 2 a 6 frases. Sem raciocínio, sem inglês, sem listas numeradas, sem "thinking process".
Se o cliente só cumprimentar (oi, olá, boa tarde, boa noite), cumprimente de volta, diga que pode ajudar e faça UMA pergunta sobre o que a pessoa precisa. Nunca faça handoff nisso.
Se a empresa tiver menu automático por palavra-chave, na primeira resposta pode mencionar: "Se preferir, digite menu para ver os assuntos."
Qualifique o lead: o que precisa, prazo e orçamento quando fizer sentido.
Não invente preços, prazos, disponibilidade ou políticas. Se não souber, diga que um colega confirma e siga a conversa.
Responda SOMENTE com a linha [[HANDOFF]] se o cliente pedir explicitamente para falar com uma pessoa, ou se for reclamação grave/jurídico.`;

export async function loadAiSettings(
  accountId: string,
): Promise<AccountAiSettings | null> {
  const db = supabaseAdmin();
  const { data: account, error } = await db
    .from("accounts")
    .select("ai_enabled, ai_provider, ai_model, ai_system_prompt, follow_up_hours")
    .eq("id", accountId)
    .maybeSingle();
  if (error || !account) return null;

  const { prompt, meta } = splitHandoffMeta(account.ai_system_prompt);

  const { data: secret } = await db
    .from("account_ai_secrets")
    .select("account_id")
    .eq("account_id", accountId)
    .maybeSingle();

  return {
    enabled: !!account.ai_enabled,
    provider: isAiProvider(account.ai_provider) ? account.ai_provider : "openai",
    model: account.ai_model || "gpt-4o-mini",
    systemPrompt: prompt || null,
    followUpHours: account.follow_up_hours ?? 24,
    hasApiKey: !!secret,
    handoff: meta ?? defaultHandoffMeta(),
  };
}

export async function loadAiApiKey(accountId: string): Promise<string | null> {
  const { decrypt } = await import("@/lib/whatsapp/encryption");
  const db = supabaseAdmin();
  const { data } = await db
    .from("account_ai_secrets")
    .select("api_key_encrypted")
    .eq("account_id", accountId)
    .maybeSingle();
  if (!data?.api_key_encrypted) return null;
  try {
    return decrypt(data.api_key_encrypted);
  } catch {
    return null;
  }
}
