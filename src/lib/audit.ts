import type { SupabaseClient } from "@supabase/supabase-js";

export interface AuditEntry {
  accountId: string;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Fire-and-forget audit insert. Never throws to the caller — a failed
 * log must not roll back the mutation it describes.
 */
export async function writeAudit(
  supabase: SupabaseClient,
  entry: AuditEntry,
): Promise<void> {
  const { error } = await supabase.from("audit_log").insert({
    account_id: entry.accountId,
    actor_user_id: entry.actorUserId ?? null,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId ?? null,
    metadata: entry.metadata ?? {},
  });
  if (error) {
    console.error("[audit] insert failed:", error.message);
  }
}
