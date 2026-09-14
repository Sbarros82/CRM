import { NextResponse } from "next/server";
import { getCurrentAccount, requireRole, toErrorResponse } from "@/lib/auth/account";
import { encrypt } from "@/lib/whatsapp/encryption";
import { supabaseAdmin } from "@/lib/flows/admin-client";
import { writeAudit } from "@/lib/audit";
import {
  DEFAULT_AI_SYSTEM_PROMPT,
  isAiProvider,
  loadAiSettings,
} from "@/lib/ai/settings";

export async function GET() {
  try {
    const ctx = await getCurrentAccount();
    const settings = await loadAiSettings(ctx.accountId);
    return NextResponse.json({
      settings: settings ?? {
        enabled: false,
        provider: "openai",
        model: "gpt-4o-mini",
        systemPrompt: DEFAULT_AI_SYSTEM_PROMPT,
        followUpHours: 24,
        hasApiKey: false,
      },
      defaultPrompt: DEFAULT_AI_SYSTEM_PROMPT,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireRole("admin");
    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const patch: Record<string, unknown> = {};
    if (typeof body.enabled === "boolean") patch.ai_enabled = body.enabled;
    if (isAiProvider(body.provider)) patch.ai_provider = body.provider;
    if (typeof body.model === "string" && body.model.trim()) {
      patch.ai_model = body.model.trim().slice(0, 80);
    }
    if (typeof body.systemPrompt === "string") {
      patch.ai_system_prompt = body.systemPrompt.slice(0, 4000);
    }
    if (typeof body.followUpHours === "number") {
      const hours = Math.round(body.followUpHours);
      if (hours < 1 || hours > 168) {
        return NextResponse.json(
          { error: "followUpHours must be between 1 and 168" },
          { status: 400 },
        );
      }
      patch.follow_up_hours = hours;
    }

    if (Object.keys(patch).length > 0) {
      const { error } = await ctx.supabase
        .from("accounts")
        .update(patch)
        .eq("id", ctx.accountId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    if (typeof body.apiKey === "string" && body.apiKey.trim()) {
      const encrypted = encrypt(body.apiKey.trim());
      const { error } = await supabaseAdmin()
        .from("account_ai_secrets")
        .upsert({
          account_id: ctx.accountId,
          api_key_encrypted: encrypted,
          updated_at: new Date().toISOString(),
        });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    await writeAudit(ctx.supabase, {
      accountId: ctx.accountId,
      actorUserId: ctx.userId,
      action: "ai.settings.update",
      entityType: "account",
      entityId: ctx.accountId,
      metadata: { fields: Object.keys(patch) },
    });

    const settings = await loadAiSettings(ctx.accountId);
    return NextResponse.json({ settings });
  } catch (err) {
    return toErrorResponse(err);
  }
}
