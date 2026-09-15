import type { SupabaseClient } from "@supabase/supabase-js";

const LEAD_TAG = "Lead IA";
const LEAD_TAG_COLOR = "#ea580c";

export async function captureLeadOnHandoff(
  db: SupabaseClient,
  args: {
    accountId: string;
    conversationId: string;
    contactId: string;
    reason: string;
  },
): Promise<void> {
  try {
    const { data: account } = await db
      .from("accounts")
      .select("owner_user_id, default_currency")
      .eq("id", args.accountId)
      .maybeSingle();
    const ownerId = account?.owner_user_id as string | undefined;
    if (!ownerId) return;

    const { data: contact } = await db
      .from("contacts")
      .select("id, name, phone")
      .eq("id", args.contactId)
      .maybeSingle();
    if (!contact) return;

    const { data: rows } = await db
      .from("messages")
      .select("sender_type, content_text")
      .eq("conversation_id", args.conversationId)
      .order("created_at", { ascending: false })
      .limit(20);

    const transcript = (rows ?? [])
      .slice()
      .reverse()
      .filter((m) => typeof m.content_text === "string" && m.content_text.trim())
      .map((m) => {
        const who = m.sender_type === "customer" ? "Cliente" : "Snap";
        return `${who}: ${String(m.content_text).trim()}`;
      })
      .join("\n")
      .slice(0, 3500);

    const noteText = [
      `Handoff da IA (${args.reason}).`,
      `Telefone: ${contact.phone}.`,
      transcript || "(sem histórico de texto)",
    ].join("\n");

    await db.from("contact_notes").insert({
      contact_id: args.contactId,
      account_id: args.accountId,
      user_id: ownerId,
      note_text: noteText,
    });

    await ensureLeadTag(db, {
      accountId: args.accountId,
      ownerId,
      contactId: args.contactId,
    });

    await ensureOpenDeal(db, {
      accountId: args.accountId,
      ownerId,
      contactId: args.contactId,
      conversationId: args.conversationId,
      currency: account?.default_currency || "BRL",
      title: contact.name || contact.phone,
    });
  } catch (err) {
    console.error("[ai] capture lead failed:", err);
  }
}

async function ensureLeadTag(
  db: SupabaseClient,
  args: { accountId: string; ownerId: string; contactId: string },
): Promise<void> {
  let { data: tag } = await db
    .from("tags")
    .select("id")
    .eq("account_id", args.accountId)
    .eq("name", LEAD_TAG)
    .maybeSingle();

  if (!tag) {
    const { data: created, error } = await db
      .from("tags")
      .insert({
        user_id: args.ownerId,
        account_id: args.accountId,
        name: LEAD_TAG,
        color: LEAD_TAG_COLOR,
      })
      .select("id")
      .maybeSingle();
    if (error || !created) return;
    tag = created;
  }

  await db.from("contact_tags").upsert(
    { contact_id: args.contactId, tag_id: tag.id },
    { onConflict: "contact_id,tag_id", ignoreDuplicates: true },
  );
}

async function ensureOpenDeal(
  db: SupabaseClient,
  args: {
    accountId: string;
    ownerId: string;
    contactId: string;
    conversationId: string;
    currency: string;
    title: string;
  },
): Promise<void> {
  const { data: existingRows } = await db
    .from("deals")
    .select("id")
    .eq("account_id", args.accountId)
    .eq("contact_id", args.contactId)
    .eq("status", "open")
    .limit(1);
  if (existingRows?.[0]) return;

  const { data: pipeline } = await db
    .from("pipelines")
    .select("id")
    .eq("account_id", args.accountId)
    .limit(1)
    .maybeSingle();
  if (!pipeline) return;

  const { data: stage } = await db
    .from("pipeline_stages")
    .select("id")
    .eq("pipeline_id", pipeline.id)
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!stage) return;

  await db.from("deals").insert({
    account_id: args.accountId,
    user_id: args.ownerId,
    pipeline_id: pipeline.id,
    stage_id: stage.id,
    contact_id: args.contactId,
    conversation_id: args.conversationId,
    title: args.title.slice(0, 120),
    value: 0,
    currency: args.currency,
    status: "open",
  });
}
