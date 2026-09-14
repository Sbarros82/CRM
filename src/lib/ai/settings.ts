import { supabaseAdmin } from "@/lib/flows/admin-client";
import { isAiProvider, type AiProvider } from "./types";

export type { AiProvider } from "./types";
export { isAiProvider } from "./types";

export interface AccountAiSettings {
  enabled: boolean;
  provider: AiProvider;
  model: string;
  systemPrompt: string | null;
  followUpHours: number;
  hasApiKey: boolean;
}

export const DEFAULT_AI_SYSTEM_PROMPT = `Você é o assistente de vendas desta empresa no WhatsApp.
Responda em português do Brasil, curto e claro (2 a 6 frases).
Qualifique o lead: o que precisa, prazo e orçamento quando fizer sentido.
Não invente preços, prazos ou políticas. Se não souber, diga que um humano confirma.
Se o cliente pedir um atendente humano, ou o assunto for reclamação/jurídico/saúde grave, responda só com:
[[HANDOFF]]
Nunca invente o marcador [[HANDOFF]] em outras situações.`;

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

  const { data: secret } = await db
    .from("account_ai_secrets")
    .select("account_id")
    .eq("account_id", accountId)
    .maybeSingle();

  return {
    enabled: !!account.ai_enabled,
    provider: isAiProvider(account.ai_provider) ? account.ai_provider : "openai",
    model: account.ai_model || "gpt-4o-mini",
    systemPrompt: account.ai_system_prompt,
    followUpHours: account.follow_up_hours ?? 24,
    hasApiKey: !!secret,
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
