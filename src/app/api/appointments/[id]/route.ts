import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
} from "@/lib/appointments/queries";
import type { UpdateAppointmentInput } from "@/types/appointments";

async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { supabase, user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, account_id, account_role")
    .eq("user_id", user.id)
    .maybeSingle();

  return { supabase, user, profile };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, profile } = await getAuthContext();
    if (!profile?.account_id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const appointment = await getAppointmentById(supabase, id);
    if (!appointment || appointment.account_id !== profile.account_id)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(appointment);
  } catch (err) {
    console.error("[appointments/:id GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, profile } = await getAuthContext();
    if (!profile?.account_id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (profile.account_role === "viewer")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    // Verify ownership
    const existing = await getAppointmentById(supabase, id);
    if (!existing || existing.account_id !== profile.account_id)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body: UpdateAppointmentInput = await request.json();
    const updated = await updateAppointment(supabase, id, body);
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[appointments/:id PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, profile } = await getAuthContext();
    if (!profile?.account_id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!["owner", "admin", "agent"].includes(profile.account_role ?? ""))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    const existing = await getAppointmentById(supabase, id);
    if (!existing || existing.account_id !== profile.account_id)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    await deleteAppointment(supabase, id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[appointments/:id DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
