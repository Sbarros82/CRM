import { NextResponse } from "next/server";
import { requireRole, toErrorResponse } from "@/lib/auth/account";

export async function GET(request: Request) {
  try {
    const ctx = await requireRole("admin");
    const url = new URL(request.url);
    const limit = Math.min(
      100,
      Math.max(1, Number(url.searchParams.get("limit") ?? 50) || 50),
    );

    const { data, error } = await ctx.supabase
      .from("audit_log")
      .select("id, action, entity_type, entity_id, metadata, created_at, actor_user_id")
      .eq("account_id", ctx.accountId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ entries: data ?? [] });
  } catch (err) {
    return toErrorResponse(err);
  }
}
