import { NextResponse } from "next/server";
import { requireRole, toErrorResponse } from "@/lib/auth/account";
import { writeAudit } from "@/lib/audit";
import { eraseAccountPersonalData } from "@/lib/lgpd/personal-data";

export async function POST(request: Request) {
  try {
    const ctx = await requireRole("owner");
    const body = (await request.json().catch(() => null)) as
      | { confirm?: unknown }
      | null;
    if (body?.confirm !== "APAGAR") {
      return NextResponse.json(
        { error: "Envie { confirm: \"APAGAR\" } para confirmar." },
        { status: 400 },
      );
    }
    const count = await eraseAccountPersonalData(ctx.accountId);
    await writeAudit(ctx.supabase, {
      accountId: ctx.accountId,
      actorUserId: ctx.userId,
      action: "lgpd.erase",
      entityType: "account",
      entityId: ctx.accountId,
      metadata: { contacts: count },
    });
    return NextResponse.json({ ok: true, contacts: count });
  } catch (err) {
    return toErrorResponse(err);
  }
}
