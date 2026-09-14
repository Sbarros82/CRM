import { supabaseAdmin } from "@/lib/flows/admin-client";

export async function exportAccountPayload(accountId: string) {
  const db = supabaseAdmin();

  const { data: contacts } = await db
    .from("contacts")
    .select("id, name, phone, email, company, opted_out_at, created_at, updated_at")
    .eq("account_id", accountId);

  const { data: conversations } = await db
    .from("conversations")
    .select("id, contact_id, status, last_message_text, last_message_at, created_at")
    .eq("account_id", accountId);

  const convIds = (conversations ?? []).map((c) => c.id);
  let messages: unknown[] = [];
  if (convIds.length > 0) {
    const { data } = await db
      .from("messages")
      .select("id, conversation_id, sender_type, content_type, content_text, created_at")
      .in("conversation_id", convIds)
      .order("created_at", { ascending: true })
      .limit(20000);
    messages = data ?? [];
  }

  const { data: deals } = await db
    .from("deals")
    .select("id, title, value, currency, contact_id, created_at")
    .eq("account_id", accountId);

  const { data: appointments } = await db
    .from("appointments")
    .select("id, scheduled_at, status, contact_id, notes")
    .eq("account_id", accountId);

  return {
    exported_at: new Date().toISOString(),
    account_id: accountId,
    contacts: contacts ?? [],
    conversations: conversations ?? [],
    messages,
    deals: deals ?? [],
    appointments: appointments ?? [],
  };
}

export async function eraseAccountPersonalData(accountId: string): Promise<number> {
  const db = supabaseAdmin();
  const now = new Date().toISOString();

  const { data: contacts } = await db
    .from("contacts")
    .select("id")
    .eq("account_id", accountId);
  const contactIds = (contacts ?? []).map((c) => c.id);
  if (contactIds.length === 0) return 0;

  const { data: conversations } = await db
    .from("conversations")
    .select("id")
    .eq("account_id", accountId);
  const convIds = (conversations ?? []).map((c) => c.id);

  await db.from("contact_notes").delete().in("contact_id", contactIds);
  await db.from("contact_custom_values").delete().in("contact_id", contactIds);

  if (convIds.length > 0) {
    await db
      .from("messages")
      .update({ content_text: "[redacted]", media_url: null })
      .in("conversation_id", convIds);
  }

  for (const [i, contact] of contactIds.entries()) {
    const phone = `+1555${String(i + 1).padStart(8, "0")}`;
    await db
      .from("contacts")
      .update({
        name: "Anonimizado",
        phone,
        email: null,
        company: null,
        avatar_url: null,
        opted_out_at: now,
        opted_out_keyword: "lgpd_erase",
        updated_at: now,
      })
      .eq("id", contact);
  }

  return contactIds.length;
}
