// src/lib/appointments/queries.ts
// Server-side data access for the appointments module.
// All functions require a Supabase server client and an account_id
// so they are safe to call from API routes and Server Components.

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Appointment,
  AppointmentWithDetails,
  CreateAppointmentInput,
  CreateServiceInput,
  Service,
  UpdateAppointmentInput,
  UpdateServiceInput,
} from "@/types/appointments";

// ----------------------------------------------------------------
// Services
// ----------------------------------------------------------------

export async function getServices(
  supabase: SupabaseClient,
  accountId: string,
  onlyActive = false
): Promise<Service[]> {
  let q = supabase
    .from("services")
    .select("*")
    .eq("account_id", accountId)
    .order("name");

  if (onlyActive) q = q.eq("active", true);

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createService(
  supabase: SupabaseClient,
  accountId: string,
  input: CreateServiceInput
): Promise<Service> {
  const { data, error } = await supabase
    .from("services")
    .insert({ ...input, account_id: accountId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateService(
  supabase: SupabaseClient,
  id: string,
  input: UpdateServiceInput
): Promise<Service> {
  const { data, error } = await supabase
    .from("services")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteService(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) throw error;
}

// ----------------------------------------------------------------
// Appointments
// ----------------------------------------------------------------

export type AppointmentFilters = {
  from?: string; // ISO date string
  to?: string;   // ISO date string
  status?: string;
  assigned_to?: string;
};

export async function getAppointments(
  supabase: SupabaseClient,
  accountId: string,
  filters: AppointmentFilters = {}
): Promise<AppointmentWithDetails[]> {
  let q = supabase
    .from("appointments")
    .select(
      `
      *,
      contact:contacts(id, name, phone, avatar_url),
      service:services(id, name, color, duration_minutes),
      assignee:profiles!appointments_assigned_to_fkey(id, full_name, avatar_url)
    `
    )
    .eq("account_id", accountId)
    .order("scheduled_at");

  if (filters.from) q = q.gte("scheduled_at", filters.from);
  if (filters.to) q = q.lte("scheduled_at", filters.to);
  if (filters.status) q = q.eq("status", filters.status);
  if (filters.assigned_to) q = q.eq("assigned_to", filters.assigned_to);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AppointmentWithDetails[];
}

export async function getAppointmentById(
  supabase: SupabaseClient,
  id: string
): Promise<AppointmentWithDetails | null> {
  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      *,
      contact:contacts(id, name, phone, avatar_url),
      service:services(id, name, color, duration_minutes),
      assignee:profiles!appointments_assigned_to_fkey(id, full_name, avatar_url)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw error;
  }
  return data as AppointmentWithDetails;
}

export async function createAppointment(
  supabase: SupabaseClient,
  accountId: string,
  profileId: string,
  input: CreateAppointmentInput
): Promise<Appointment> {
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      ...input,
      account_id: accountId,
      created_by: profileId,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAppointment(
  supabase: SupabaseClient,
  id: string,
  input: UpdateAppointmentInput
): Promise<Appointment> {
  const { data, error } = await supabase
    .from("appointments")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAppointment(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ----------------------------------------------------------------
// Reminders
// ----------------------------------------------------------------

export async function getPendingReminders(supabase: SupabaseClient) {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const in1h = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
  const in15min = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

  // Appointments in ~24h range (between 23h50 and 24h10 from now)
  const near24h = new Date(now.getTime() + 23 * 60 * 60 * 1000 + 50 * 60 * 1000).toISOString();

  // Appointments in ~1h range (between 50min and 70min from now)
  const near1h = new Date(now.getTime() + 50 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      *,
      contact:contacts(id, name, phone),
      service:services(id, name, duration_minutes),
      appointment_reminders(reminder_type)
    `
    )
    .in("status", ["scheduled", "confirmed"])
    .or(`scheduled_at.gte.${near24h},scheduled_at.lte.${in24h},scheduled_at.gte.${near1h},scheduled_at.lte.${in1h}`);

  if (error) throw error;
  return data ?? [];
}

export async function markReminderSent(
  supabase: SupabaseClient,
  appointmentId: string,
  reminderType: "confirmation" | "24h" | "1h"
): Promise<void> {
  const { error } = await supabase
    .from("appointment_reminders")
    .upsert(
      { appointment_id: appointmentId, reminder_type: reminderType },
      { onConflict: "appointment_id,reminder_type" }
    );
  if (error) throw error;
}
