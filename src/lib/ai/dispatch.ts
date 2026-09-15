import { supabaseAdmin } from "@/lib/flows/admin-client";
import { engineSendText } from "@/lib/automations/meta-send";
import { writeAudit } from "@/lib/audit";
import { isOptedOut } from "@/lib/whatsapp/opt-out";
import { isSessionOpen } from "@/lib/whatsapp/session-window";
import { completeChat, type ChatTurn } from "./providers";
import { looksLikeModelScratchpad, sanitizeAiCustomerReply, isSafeCustomerReply } from "./sanitize-reply";
import { captureLeadOnHandoff } from "./capture-lead";
import { pickHandoffAssignee, sendHandoffWhatsAppAlerts } from "./notify-team";
import {
  extractSpokenName,
  firstNameFromDisplay,
  needsPersonalName,
} from "./contact-name";
import {
  DEFAULT_AI_SYSTEM_PROMPT,
  loadAiApiKey,
  loadAiSettings,
} from "./settings";

const HANDOFF_TOKEN = "[[HANDOFF]]";
const CUSTOMER_HANDOFF = [
  /falar com (um )?(humano|atendente|alguem|consultor)/,
  /atendimento humano/,
  /quero (um )?(humano|atendente|consultor)/,
  /chama(r)? (um )?(atendente|humano|consultor)/,
  /quero (contratar|assinar|fechar)/,
  /fechar (um |o )?plano/,
  /para fechar/,
  /como .{0,40}fechar/,
  /^(humano|atendente|consultor)$/,
];

const MODEL_HANDOFF = [
  /\[\[HANDOFF\]\]/,
  /vou (te |voce )?encaminhar/,
  /vou passar para um (consultor|atendente|humano)/,
  /encaminhar voce para um consultor/,
];

export function normalizeHandoffText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isHandoffRequest(text: string): boolean {
  const n = normalizeHandoffText(text);
  return CUSTOMER_HANDOFF.some((re) => re.test(n));
}

export function isModelHandoffReply(text: string): boolean {
  if (/(^|\n)\s*\[\[HANDOFF\]\]\s*($|\n)/.test(text)) return true;
  const n = normalizeHandoffText(text);
  return MODEL_HANDOFF.some((re) => re.test(n));
}

export async function maybeDispatchAiReply(args: {
  accountId: string;
  conversationId: string;
  contactId: string;
  inboundText: string;
}): Promise<void> {
  const settings = await loadAiSettings(args.accountId);
  if (!settings?.enabled || !settings.hasApiKey) {
    console.warn("[ai] skipped: disabled or missing API key", {
      enabled: settings?.enabled ?? false,
      hasApiKey: settings?.hasApiKey ?? false,
    })
    return
  }

  const db = supabaseAdmin();
  const { data: conversation } = await db
    .from("conversations")
    .select("id, ai_paused, last_inbound_at")
    .eq("id", args.conversationId)
    .maybeSingle();
  if (!conversation || conversation.ai_paused) return;

  const { data: contact } = await db
    .from("contacts")
    .select("id, name, phone, company, opted_out_at")
    .eq("id", args.contactId)
    .maybeSingle();
  if (!contact || isOptedOut(contact.opted_out_at)) return;
  if (!isSessionOpen(conversation.last_inbound_at)) return;

  const spoken = extractSpokenName(args.inboundText);
  if (spoken && needsPersonalName(contact.name)) {
    await db
      .from("contacts")
      .update({ name: spoken, updated_at: new Date().toISOString() })
      .eq("id", contact.id);
    contact.name = spoken;
  }

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
    .filter((m) => !looksLikeModelScratchpad(String(m.content_text)))
    .map((m) => ({
      role: m.sender_type === "customer" ? "user" : "assistant",
      content: String(m.content_text),
    }));

  const firstName = firstNameFromDisplay(contact.name);
  const system = [
    settings.systemPrompt?.trim() || DEFAULT_AI_SYSTEM_PROMPT,
    "Saída obrigatória: só a mensagem ao cliente, em português do Brasil. Nunca descreva instruções, nunca escreva em inglês.",
    firstName
      ? `Primeiro nome: ${firstName}. Use na saudação. Não pergunte o nome de novo.`
      : `Pergunte o primeiro nome agora. O rótulo no WhatsApp não é nome de pessoa (${contact.name || "vazio"}).`,
    contact.company ? `Empresa no cadastro: ${contact.company}.` : null,
    `Telefone: ${contact.phone}.`,
  ]
    .filter(Boolean)
    .join("\n");

  const reply = await generateCustomerReply({
    provider: settings.provider,
    model: settings.model,
    apiKey,
    system,
    history,
    accountId: args.accountId,
    conversationId: args.conversationId,
    contactId: args.contactId,
  });
  if (!reply) return;

  // Token or a clear "vou encaminhar / passar para consultor" line.
  // Free models often mention "atendente" in a greeting — that alone
  // must not pause the thread.
  if (!looksLikeModelScratchpad(reply) && isModelHandoffReply(reply)) {
    const recap = sanitizeAiCustomerReply(
      reply.replace(HANDOFF_TOKEN, "").trim(),
      "",
    );
    await pauseAiAndNotify(
      args,
      "model_handoff",
      isSafeCustomerReply(recap) ? recap : undefined,
    );
    return;
  }

  const text = sanitizeAiCustomerReply(
    reply.replace(HANDOFF_TOKEN, "").trim(),
  );
  if (!text || !isSafeCustomerReply(text)) return;

  try {
    await engineSendText({
      accountId: args.accountId,
      userId: args.accountId,
      conversationId: args.conversationId,
      contactId: args.contactId,
      text,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Meta sometimes returns (#131005) Access denied if we reply in the
    // same instant as the inbound webhook. One short retry usually lands.
    if (/#131005|Access denied/i.test(message)) {
      await new Promise((r) => setTimeout(r, 1200));
      try {
        await engineSendText({
          accountId: args.accountId,
          userId: args.accountId,
          conversationId: args.conversationId,
          contactId: args.contactId,
          text,
        });
        return;
      } catch (err2) {
        console.error("[ai] send failed after 131005 retry:", err2);
        return;
      }
    }
    console.error("[ai] send failed:", err);
  }
}

const STRICT_CUSTOMER_ONLY =
  "Responda agora SOMENTE a mensagem ao cliente no WhatsApp: 2 a 4 frases em português do Brasil. Proibido inglês, raciocínio, lista numerada e repetir estas instruções.";

async function generateCustomerReply(args: {
  provider: Parameters<typeof completeChat>[0]["provider"];
  model: string;
  apiKey: string;
  system: string;
  history: ChatTurn[];
  accountId: string;
  conversationId: string;
  contactId: string;
}): Promise<string | null> {
  const run = (messages: ChatTurn[], system: string) =>
    completeChat({
      provider: args.provider,
      model: args.model,
      apiKey: args.apiKey,
      system,
      messages,
    });

  let raw: string;
  try {
    raw = await run(args.history, args.system);
  } catch (err) {
    console.error("[ai] completion failed:", err);
    await sendAiFallback(args);
    return null;
  }

  const firstPass = sanitizeAiCustomerReply(raw.replace(HANDOFF_TOKEN, "").trim(), "");
  if (looksLikeModelScratchpad(raw) || !isSafeCustomerReply(firstPass)) {
    try {
      raw = await run(
        [...args.history, { role: "user", content: STRICT_CUSTOMER_ONLY }],
        `${args.system}\n${STRICT_CUSTOMER_ONLY}`,
      );
    } catch (err) {
      console.error("[ai] retry completion failed:", err);
      await sendAiFallback(args);
      return null;
    }
  }

  const secondPass = sanitizeAiCustomerReply(
    raw.replace(HANDOFF_TOKEN, "").trim(),
    "",
  );
  if (looksLikeModelScratchpad(raw) && !isSafeCustomerReply(secondPass)) {
    await sendAiFallback(args);
    return null;
  }

  return raw;
}

async function sendAiFallback(args: {
  accountId: string;
  conversationId: string;
  contactId: string;
}): Promise<void> {
  try {
    await engineSendText({
      accountId: args.accountId,
      userId: args.accountId,
      conversationId: args.conversationId,
      contactId: args.contactId,
      text: "Recebi sua mensagem. Qual o ramo da empresa e quantas pessoas atendem o WhatsApp?",
    });
  } catch (err) {
    console.error("[ai] fallback send failed:", err);
  }
}

async function pauseAiAndNotify(
  args: {
    accountId: string;
    conversationId: string;
    contactId: string;
  },
  reason: string,
  recap?: string,
): Promise<void> {
  const db = supabaseAdmin();
  const [{ data: account }, { data: conv }, { data: contact }, settings] =
    await Promise.all([
      db
        .from("accounts")
        .select("owner_user_id, ai_system_prompt")
        .eq("id", args.accountId)
        .maybeSingle(),
      db
        .from("conversations")
        .select("unread_count")
        .eq("id", args.conversationId)
        .maybeSingle(),
      db
        .from("contacts")
        .select("name, phone")
        .eq("id", args.contactId)
        .maybeSingle(),
      loadAiSettings(args.accountId),
    ]);

  const mode = settings?.handoff.mode ?? "queue";
  const assignee = await pickHandoffAssignee(
    args.accountId,
    mode,
    account?.owner_user_id ?? null,
  );

  const now = new Date().toISOString();
  await db
    .from("conversations")
    .update({
      ai_paused: true,
      status: "pending",
      assigned_agent_id: assignee,
      unread_count: Math.max(1, conv?.unread_count ?? 0),
      updated_at: now,
    })
    .eq("id", args.conversationId);

  const text =
    recap?.trim() ||
    "Vou te passar para um consultor. Ele continua o atendimento com você. Um momento.";

  try {
    await engineSendText({
      accountId: args.accountId,
      userId: args.accountId,
      conversationId: args.conversationId,
      contactId: args.contactId,
      text,
    });
  } catch (err) {
    console.error("[ai] handoff send failed:", err);
  }

  await captureLeadOnHandoff(db, {
    accountId: args.accountId,
    conversationId: args.conversationId,
    contactId: args.contactId,
    reason,
  });

  await sendHandoffWhatsAppAlerts({
    accountId: args.accountId,
    phones: settings?.handoff.phones ?? [],
    leadPhone: contact?.phone ?? null,
    leadName: contact?.name ?? null,
    conversationId: args.conversationId,
  });

  await writeAudit(db, {
    accountId: args.accountId,
    action: "ai.handoff",
    entityType: "conversation",
    entityId: args.conversationId,
    metadata: { reason },
  });
}
