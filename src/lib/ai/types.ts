export type AiProvider = "openai" | "openrouter" | "anthropic";

export const AI_PROVIDERS: readonly AiProvider[] = [
  "openai",
  "openrouter",
  "anthropic",
] as const;

export function isAiProvider(value: unknown): value is AiProvider {
  return (
    value === "openai" || value === "openrouter" || value === "anthropic"
  );
}

export interface RadarItem {
  id: string;
  contact_id: string;
  contact_name: string | null;
  contact_phone: string | null;
  last_message_text: string | null;
  last_inbound_at: string | null;
  hours_waiting: number;
  status: string;
}
