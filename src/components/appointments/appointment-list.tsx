"use client";

import { format, parseISO } from "date-fns";
import { Pencil, Trash2, Phone, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppointmentWithDetails, AppointmentStatus } from "@/types/appointments";
import { APPOINTMENT_STATUS_LABELS } from "@/types/appointments";
import { AppointmentStatusBadge } from "./appointment-status-badge";

interface AppointmentListProps {
  appointments: AppointmentWithDetails[];
  onEdit: (appointment: AppointmentWithDetails) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: AppointmentStatus) => void;
}

const STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  scheduled: ["confirmed", "cancelled", "no_show"],
  confirmed: ["completed", "cancelled", "no_show"],
  cancelled: ["scheduled"],
  completed: [],
  no_show: ["scheduled"],
};

export function AppointmentList({
  appointments,
  onEdit,
  onDelete,
  onStatusChange,
}: AppointmentListProps) {
  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16 text-center">
        <Calendar className="mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm font-medium text-foreground">No appointments</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Create your first appointment to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {appointments.map((appt) => {
        const scheduledAt = parseISO(appt.scheduled_at);
        const transitions = STATUS_TRANSITIONS[appt.status];

        return (
          <div
            key={appt.id}
            className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm"
          >
            {/* Color stripe from service */}
            <div
              className="mt-1 h-10 w-1 shrink-0 rounded-full"
              style={{ backgroundColor: appt.service?.color ?? "#6366f1" }}
            />

            {/* Main content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-sm text-foreground truncate">
                  {appt.contact?.name ?? appt.contact?.phone ?? "Unknown contact"}
                </span>
                <AppointmentStatusBadge status={appt.status} />
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(scheduledAt, "dd/MM/yyyy 'at' HH:mm")}
                </span>

                {appt.contact?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {appt.contact.phone}
                  </span>
                )}

                {appt.service && (
                  <span
                    className="rounded-full px-2 py-0.5 text-xs"
                    style={{
                      backgroundColor: appt.service.color + "22",
                      color: appt.service.color,
                    }}
                  >
                    {appt.service.name} · {appt.service.duration_minutes}min
                  </span>
                )}

                {appt.assignee && (
                  <span>👤 {appt.assignee.full_name}</span>
                )}
              </div>

              {appt.notes && (
                <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                  {appt.notes}
                </p>
              )}

              {/* Quick status transitions */}
              {transitions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {transitions.map((nextStatus) => (
                    <button
                      key={nextStatus}
                      onClick={() => onStatusChange(appt.id, nextStatus)}
                      className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
                    >
                      → {APPOINTMENT_STATUS_LABELS[nextStatus]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => onEdit(appt)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Edit appointment"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(appt.id)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                aria-label="Delete appointment"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
