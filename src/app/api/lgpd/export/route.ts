import { NextResponse } from "next/server";
import { requireRole, toErrorResponse } from "@/lib/auth/account";
import { writeAudit } from "@/lib/audit";
import { exportAccountPayload } from "@/lib/lgpd/personal-data";

export async function GET() {
  try {
    const ctx = await requireRole("admin");
    const payload = await exportAccountPayload(ctx.accountId);
    await writeAudit(ctx.supabase, {
      accountId: ctx.accountId,
      actorUserId: ctx.userId,
      action: "lgpd.export",
      entityType: "account",
      entityId: ctx.accountId,
      metadata: { contacts: payload.contacts.length },
    });
    return NextResponse.json(payload);
  } catch (err) {
    return toErrorResponse(err);
  }
}
