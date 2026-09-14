import { supabaseAdmin } from "@/lib/flows/admin-client";
import { engineSendText } from "@/lib/automations/meta-send";
import { writeAudit } from "@/lib/audit";
import { isOptedOut } from "@/lib/whatsapp/opt-out";
import { isSessionOpen } from "@/lib/whatsapp/session-window";
import { completeChat, type ChatTurn } from "./providers";
import {
  DEFAULT_AI_SYSTEM_PROMPT,
  loadAiApiKey,
  loadAiSettings,
} from "./settings";

const HANDOFF_TOKEN = "[[HANDOFF]]";
const HANDOFF_KEYWORDS = [
  "humano",
  "atendente",
  "falar com alguem",
  "atendimento humano",
];

export function isHandoffRequest(text: string): boolean {
  const n = text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
  return HANDOFF_KEYWORDS.some((k) => n.includes(k));
}

export async function maybeDispatchAiReply(args: {
  accountId: string;
  conversationId: string;
  contactId: string;
  inboundText: string;
}): Promise<void> {
  const settings = await loadAiSettings(args.accountId);
  if (!settings?.enabled || !settings.hasApiKey) return;

  const db = supabaseAdmin();
  const { data: conversation } = await db
    .from("conversations")
    .select("id, ai_paused, last_inbound_at")
    .eq("id", args.conversationId)
    .maybeSingle();
  if (!conversation || conversation.ai_paused) return;

  const { data: contact } = await db
    .from("contacts")
    .select("id, name, phone, opted_out_at")
    .eq("id", args.contactId)
    .maybeSingle();
  if (!contact || isOptedOut(contact.opted_out_at)) return;
  if (!isSessionOpen(conversation.last_inbound_at)) return;

  if (isHandoffRequest(args.inboundText)) {
    await pauseAiAndNotify(args, "customer_requested_human");
    return;
  }

  const apiKey = await loadAiApiKey(args.accountId);
  if (!apiKey) return;

  const { data: rows } = await db
    .from("messages")
    .select("sender_type, content_text")
    .eq("conversation_id", args.conversationId)
    .order("created_at", { ascending: false })
    .limit(16);

  const history: ChatTurn[] = (rows ?? [])
    .slice()
    .reverse()
    .filter((m) => typeof m.content_text === "string" && m.content_text.trim())
    .map((m) => ({
      role: m.sender_type === "customer" ? "user" : "assistant",
      content: String(m.content_text),
    }));

  const system = [
    settings.systemPrompt?.trim() || DEFAULT_AI_SYSTEM_PROMPT,
    contact.name ? `Nome do contato: ${contact.name}.` : null,
    `Telefone: ${contact.phone}.`,
  ]
    .filter(Boolean)
    .join("\n");

  let reply: string;
  try {
    reply = await completeChat({
      provider: settings.provider,
      model: settings.model,
      apiKey,
      system,
      messages: history,
    });
  } catch (err) {
    console.error("[ai] completion failed:", err);
    return;
  }

  if (reply.includes(HANDOFF_TOKEN) || isHandoffRequest(reply)) {
    await pauseAiAndNotify(args, "model_handoff");
    return;
  }

  const text = reply.replace(HANDOFF_TOKEN, "").trim();
  if (!text) return;

  try {
    await engineSendText({
      accountId: args.accountId,
      userId: args.accountId,
      conversationId: args.conversationId,
      contactId: args.contactId,
      text,
    });
  } catch (err) {
    console.error("[ai] send failed:", err);
  }
}

async function pauseAiAndNotify(
  args: {
    accountId: string;
    conversationId: string;
    contactId: string;
  },
  reason: string,
): Promise<void> {
  const db = supabaseAdmin();
  await db
    .from("conversations")
    .update({ ai_paused: true, updated_at: new Date().toISOString() })
    .eq("id", args.conversationId);

  try {
    await engineSendText({
      accountId: args.accountId,
      userId: args.accountId,
      conversationId: args.conversationId,
      contactId: args.contactId,
      text: "Vou te passar para um atendente humano. Um momento.",
    });
  } catch (err) {
    console.error("[ai] handoff send failed:", err);
  }

  await writeAudit(db, {
    accountId: args.accountId,
    action: "ai.handoff",
    entityType: "conversation",
    entityId: args.conversationId,
    metadata: { reason },
  });
}
