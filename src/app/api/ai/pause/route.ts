import { NextResponse } from "next/server";
import { requireRole, toErrorResponse } from "@/lib/auth/account";
import { writeAudit } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const ctx = await requireRole("agent");
    const body = (await request.json().catch(() => null)) as {
      conversationId?: unknown;
      paused?: unknown;
    } | null;
    const conversationId =
      typeof body?.conversationId === "string" ? body.conversationId : "";
    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 },
      );
    }
    const paused = body?.paused !== false;

    const { data, error } = await ctx.supabase
      .from("conversations")
      .update({ ai_paused: paused, updated_at: new Date().toISOString() })
      .eq("id", conversationId)
      .eq("account_id", ctx.accountId)
      .select("id, ai_paused")
      .maybeSingle();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    await writeAudit(ctx.supabase, {
      accountId: ctx.accountId,
      actorUserId: ctx.userId,
      action: paused ? "ai.pause" : "ai.resume",
      entityType: "conversation",
      entityId: conversationId,
    });

    return NextResponse.json({ conversation: data });
  } catch (err) {
    return toErrorResponse(err);
  }
}
