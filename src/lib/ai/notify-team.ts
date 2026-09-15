import { supabaseAdmin } from "@/lib/flows/admin-client";
import { decrypt, isLegacyFormat } from "@/lib/whatsapp/encryption";
import { sendTextMessage } from "@/lib/whatsapp/meta-api";
import { phonesMatch } from "@/lib/whatsapp/phone-utils";
import { derivePresence } from "@/lib/presence";
import type { HandoffMode } from "./handoff-meta";

export async function pickHandoffAssignee(
  accountId: string,
  mode: HandoffMode,
  ownerUserId: string | null,
): Promise<string | null> {
  if (mode === "owner") return ownerUserId;
  if (mode === "queue") return null;

  const db = supabaseAdmin();
  const [{ data: members }, { data: presence }] = await Promise.all([
    db
      .from("profiles")
      .select("user_id, account_role")
      .eq("account_id", accountId),
    db
      .from("member_presence")
      .select("user_id, status, last_seen_at")
      .eq("account_id", accountId),
  ]);

  const eligible = (members ?? []).filter((m) =>
    ["owner", "admin", "agent"].includes(String(m.account_role)),
  );
  const now = Date.now();
  const online = eligible.filter((m) => {
    const row = (presence ?? []).find((p) => p.user_id === m.user_id);
    return (
      derivePresence(
        row?.status === "away" || row?.status === "online"
          ? row.status
          : undefined,
        row?.last_seen_at ?? null,
        now,
      ) === "online"
    );
  });
  if (online.length === 0) return null;
  return online[Math.floor(Math.random() * online.length)]?.user_id ?? null;
}

export async function sendHandoffWhatsAppAlerts(args: {
  accountId: string;
  phones: string[];
  leadPhone: string | null;
  leadName: string | null;
  conversationId: string;
}): Promise<void> {
  const phones = args.phones.filter(
    (p) => !args.leadPhone || !phonesMatch(p, args.leadPhone),
  );
  if (phones.length === 0) return;

  const db = supabaseAdmin();
  const { data: config } = await db
    .from("whatsapp_config")
    .select("access_token, phone_number_id")
    .eq("account_id", args.accountId)
    .maybeSingle();
  if (!config?.access_token || !config.phone_number_id) return;

  let accessToken: string;
  try {
    accessToken = isLegacyFormat(config.access_token)
      ? config.access_token
      : decrypt(config.access_token);
  } catch {
    return;
  }

  const { data: opted } = await db
    .from("contacts")
    .select("phone, opted_out_at")
    .eq("account_id", args.accountId)
    .not("opted_out_at", "is", null);

  const name = args.leadName || args.leadPhone || "Lead";
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://crm-phi-red-71.vercel.app");
  const text = [
    "Snap: lead pronto para um humano fechar.",
    `${name}${args.leadPhone ? ` · ${args.leadPhone}` : ""}`,
    `Abra: ${appUrl}/inbox?c=${args.conversationId}`,
  ].join("\n");

  for (const to of phones) {
    if ((opted ?? []).some((c) => c.phone && phonesMatch(c.phone, to))) {
      continue;
    }
    try {
      await sendTextMessage({
        phoneNumberId: config.phone_number_id,
        accessToken,
        to,
        text,
      });
    } catch (err) {
      console.warn(
        "[ai] handoff WhatsApp failed:",
        to,
        err instanceof Error ? err.message : err,
      );
    }
  }
}
