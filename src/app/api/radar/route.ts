import { NextResponse } from "next/server";
import { getCurrentAccount, toErrorResponse } from "@/lib/auth/account";
import { loadAiSettings } from "@/lib/ai/settings";
import type { RadarItem } from "@/lib/ai/types";

export async function GET() {
  try {
    const ctx = await getCurrentAccount();
    const settings = await loadAiSettings(ctx.accountId);
    const hours = settings?.followUpHours ?? 24;
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const { data, error } = await ctx.supabase
      .from("conversations")
      .select("id, contact_id, status, last_message_text, last_inbound_at, last_outbound_at, contact:contacts(name, phone, opted_out_at)")
      .eq("account_id", ctx.accountId)
      .in("status", ["open", "pending"])
      .lt("last_inbound_at", cutoff)
      .order("last_inbound_at", { ascending: true })
      .limit(80);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items: RadarItem[] = (data ?? [])
      .map((row) => {
        const contact = Array.isArray(row.contact) ? row.contact[0] : row.contact;
        if (contact?.opted_out_at) return null;
        const inbound = row.last_inbound_at
          ? new Date(row.last_inbound_at).getTime()
          : 0;
        const outbound = row.last_outbound_at
          ? new Date(row.last_outbound_at).getTime()
          : 0;
        if (outbound > inbound) return null;
        const hoursWaiting = inbound
          ? Math.max(0, Math.round((Date.now() - inbound) / 36e5))
          : 0;
        return {
          id: row.id,
          contact_id: row.contact_id,
          contact_name: contact?.name ?? null,
          contact_phone: contact?.phone ?? null,
          last_message_text: row.last_message_text ?? null,
          last_inbound_at: row.last_inbound_at ?? null,
          hours_waiting: hoursWaiting,
          status: row.status,
        } satisfies RadarItem;
      })
      .filter((item): item is RadarItem => item !== null);

    return NextResponse.json({ hours, items });
  } catch (err) {
    return toErrorResponse(err);
  }
}
