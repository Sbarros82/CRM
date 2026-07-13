// Types for the appointments module (migration 027_appointments.sql)

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export type ReminderType = "confirmation" | "24h" | "1h";

// ----------------------------------------------------------------
// Service — a bookable service in the account catalogue
// ----------------------------------------------------------------
export interface Service {
  id: string;
  account_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number | null;
  color: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type CreateServiceInput = Pick<
  Service,
  "name" | "duration_minutes" | "color" | "active"
> &
  Partial<Pick<Service, "description" | "price">>;

export type UpdateServiceInput = Partial<CreateServiceInput>;

// ----------------------------------------------------------------
// Appointment — an individual booking
// ----------------------------------------------------------------
export interface Appointment {
  id: string;
  account_id: string;
  contact_id: string | null;
  service_id: string | null;
  assigned_to: string | null;
  scheduled_at: string; // ISO 8601
  status: AppointmentStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Joined with contact and service data for display
export interface AppointmentWithDetails extends Appointment {
  contact: {
    id: string;
    name: string | null;
    phone: string;
    avatar_url: string | null;
  } | null;
  service: Pick<Service, "id" | "name" | "color" | "duration_minutes"> | null;
  assignee: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
}

export type CreateAppointmentInput = {
  contact_id?: string;
  service_id?: string;
  assigned_to?: string;
  scheduled_at: string;
  notes?: string;
};

export type UpdateAppointmentInput = Partial<
  Omit<CreateAppointmentInput, "scheduled_at"> & {
    scheduled_at: string;
    status: AppointmentStatus;
  }
>;

// ----------------------------------------------------------------
// Reminder
// ----------------------------------------------------------------
export interface AppointmentReminder {
  id: string;
  appointment_id: string;
  reminder_type: ReminderType;
  sent_at: string;
}

// ----------------------------------------------------------------
// UI helpers
// ----------------------------------------------------------------
export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  completed: "Concluído",
  no_show: "Não Compareceu",
};

export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  confirmed: "bg-green-500/10 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/30",
  completed: "bg-gray-500/10 text-gray-400 border-gray-500/30",
  no_show: "bg-amber-500/10 text-amber-400 border-amber-500/30",
};
