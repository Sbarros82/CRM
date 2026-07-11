import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getAppointments,
  createAppointment,
} from "@/lib/appointments/queries";
import type { AppointmentFilters } from "@/lib/appointments/queries";
import { sendAppointmentConfirmation } from "@/lib/appointments/whatsapp-notifications";
import type { CreateAppointmentInput } from "@/types/appointments";

async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user)
    return { supabase, user: null, profile: null };

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
    const filters: AppointmentFilters = {
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      assigned_to: url.searchParams.get("assigned_to") ?? undefined,
    };

    const appointments = await getAppointments(
      supabase,
      profile.account_id,
      filters
    );
    return NextResponse.json(appointments);
  } catch (err) {
    console.error("[appointments GET]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, profile } = await getAuthContext();
    if (!profile?.account_id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (profile.account_role === "viewer")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body: CreateAppointmentInput = await request.json();

    if (!body.scheduled_at)
      return NextResponse.json(
        { error: "scheduled_at is required" },
        { status: 400 }
      );

    const appointment = await createAppointment(
      supabase,
      profile.account_id,
      profile.id,
      body
    );

    // Fire-and-forget: send WhatsApp confirmation
    if (body.contact_id) {
      const { data: contact } = await supabase
        .from("contacts")
        .select("id, name, phone")
        .eq("id", body.contact_id)
        .maybeSingle();

      const service = body.service_id
        ? (
            await supabase
              .from("services")
              .select("id, name")
              .eq("id", body.service_id)
              .maybeSingle()
          ).data
        : null;

      if (contact) {
        sendAppointmentConfirmation(profile.account_id, {
          id: appointment.id,
          scheduled_at: appointment.scheduled_at,
          contact,
          service,
        }).catch((e) => console.error("[appt confirmation]", e));
      }
    }

    return NextResponse.json(appointment, { status: 201 });
  } catch (err) {
    console.error("[appointments POST]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
