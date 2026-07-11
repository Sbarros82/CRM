import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getServices,
  createService,
  updateService,
  deleteService,
} from "@/lib/appointments/queries";
import type { CreateServiceInput, UpdateServiceInput } from "@/types/appointments";

async function getAuthContext() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { supabase, user: null, profile: null };
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, account_id, account_role")
    .eq("user_id", user.id)
    .maybeSingle();
  return { supabase, user, profile };
}

export async function GET(request: Request) {
  try {
    const { supabase, profile } = await getAuthContext();
    if (!profile?.account_id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const onlyActive = url.searchParams.get("active") === "true";
    const services = await getServices(supabase, profile.account_id, onlyActive);
    return NextResponse.json(services);
  } catch (err) {
    console.error("[services GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, profile } = await getAuthContext();
    if (!profile?.account_id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!["owner", "admin"].includes(profile.account_role ?? ""))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body: CreateServiceInput = await request.json();
    if (!body.name?.trim())
      return NextResponse.json({ error: "name is required" }, { status: 400 });

    const service = await createService(supabase, profile.account_id, body);
    return NextResponse.json(service, { status: 201 });
  } catch (err) {
    console.error("[services POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { supabase, profile } = await getAuthContext();
    if (!profile?.account_id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!["owner", "admin"].includes(profile.account_role ?? ""))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id, ...body }: { id: string } & UpdateServiceInput = await request.json();
    if (!id)
      return NextResponse.json({ error: "id is required" }, { status: 400 });

    const service = await updateService(supabase, id, body);
    return NextResponse.json(service);
  } catch (err) {
    console.error("[services PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { supabase, profile } = await getAuthContext();
    if (!profile?.account_id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!["owner", "admin"].includes(profile.account_role ?? ""))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id }: { id: string } = await request.json();
    if (!id)
      return NextResponse.json({ error: "id is required" }, { status: 400 });

    await deleteService(supabase, id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[services DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
