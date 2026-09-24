import { supabaseAdmin } from "@/lib/flows/admin-client";
import { decrypt, isLegacyFormat } from "@/lib/whatsapp/encryption";
import { sendTextMessage } from "@/lib/whatsapp/meta-api";
import { phonesMatch, sanitizePhoneForMeta } from "@/lib/whatsapp/phone-utils";
import { derivePresence } from "@/lib/presence";
import { parseNotifyPhones, type HandoffMode } from "./handoff-meta";

type MemberRow = {
  user_id: string;
  account_role: string | null;
  whatsapp_notify_phone: string | null;
};

function toNotifyPhone(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const fromParser = parseNotifyPhones(raw)[0];
  if (fromParser) return fromParser;
  const digits = sanitizePhoneForMeta(raw);
  return digits.length >= 10 ? digits : null;
}

function isEligibleRole(role: string | null | undefined): boolean {
  return ["owner", "admin", "agent"].includes(String(role ?? ""));
}

async function loadMembersAndPresence(accountId: string): Promise<{
  members: MemberRow[];
  onlineUserIds: Set<string>;
}> {
  const db = supabaseAdmin();
  const [{ data: members }, { data: presence }] = await Promise.all([
    db
      .from("profiles")
      .select("user_id, account_role, whatsapp_notify_phone")
      .eq("account_id", accountId),
    db
      .from("member_presence")
      .select("user_id, status, last_seen_at")
      .eq("account_id", accountId),
  ]);

  const now = Date.now();
  const onlineUserIds = new Set<string>();
  for (const row of presence ?? []) {
    const status = derivePresence(
      row.status === "away" || row.status === "online" ? row.status : undefined,
      row.last_seen_at ?? null,
      now,
    );
    if (status === "online") onlineUserIds.add(row.user_id);
  }

  return {
    members: (members ?? []) as MemberRow[],
    onlineUserIds,
  };
}

export async function pickHandoffAssignee(
  accountId: string,
  mode: HandoffMode,
  ownerUserId: string | null,
): Promise<string | null> {
  if (mode === "owner") return ownerUserId;
  if (mode === "queue") return null;

  const { members, onlineUserIds } = await loadMembersAndPresence(accountId);
  const online = members.filter(
    (m) => isEligibleRole(m.account_role) && onlineUserIds.has(m.user_id),
  );
  if (online.length === 0) return null;
  return online[Math.floor(Math.random() * online.length)]?.user_id ?? null;
}

/**
 * Resolve which personal WhatsApp numbers receive the handoff ping.
 * Prefers each member's `whatsapp_notify_phone` (from profile). Falls
 * back to the static list in Agente de IA settings.
 */
export async function resolveHandoffNotifyPhones(args: {
  accountId: string;
  mode: HandoffMode;
  assigneeUserId: string | null;
  ownerUserId: string | null;
  fallbackPhones: string[];
}): Promise<string[]> {
  const { members, onlineUserIds } = await loadMembersAndPresence(
    args.accountId,
  );
  const eligible = members.filter((m) => isEligibleRole(m.account_role));

  const phoneOf = (userId: string | null | undefined): string | null => {
    if (!userId) return null;
    const row = eligible.find((m) => m.user_id === userId);
    return toNotifyPhone(row?.whatsapp_notify_phone);
  };

  const phonesOf = (rows: MemberRow[]): string[] => {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const row of rows) {
      const phone = toNotifyPhone(row.whatsapp_notify_phone);
      if (!phone || seen.has(phone)) continue;
      seen.add(phone);
      out.push(phone);
    }
    return out;
  };

  let resolved: string[] = [];

  if (args.mode === "online") {
    const onlineMembers = eligible.filter((m) =>
      onlineUserIds.has(m.user_id),
    );
    resolved = phonesOf(onlineMembers);
    if (resolved.length === 0) {
      const assigneePhone = phoneOf(args.assigneeUserId);
      if (assigneePhone) resolved = [assigneePhone];
    }
  } else if (args.mode === "owner") {
    const ownerPhone = phoneOf(args.ownerUserId);
    if (ownerPhone) resolved = [ownerPhone];
  } else {
    // queue — ping everyone who registered a WhatsApp
    resolved = phonesOf(eligible);
  }

  if (resolved.length === 0) {
    resolved = args.fallbackPhones
      .map((p) => toNotifyPhone(p))
      .filter((p): p is string => !!p);
  }

  return resolved;
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
      : "https://app.snap.ia.br");
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
