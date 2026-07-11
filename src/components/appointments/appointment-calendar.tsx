"use client";

import { useState, useEffect } from "react";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppointmentWithDetails } from "@/types/appointments";
import { AppointmentStatusBadge } from "./appointment-status-badge";

interface AppointmentCalendarProps {
  appointments: AppointmentWithDetails[];
  onSelectAppointment: (appointment: AppointmentWithDetails) => void;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7am – 7pm

export function AppointmentCalendar({
  appointments,
  onSelectAppointment,
}: AppointmentCalendarProps) {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getAppointmentsForDay = (day: Date) =>
    appointments.filter((a) => isSameDay(parseISO(a.scheduled_at), day));

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekStart((d) => addDays(d, -7))}
          className="rounded-lg border border-border p-2 hover:bg-muted transition-colors"
          aria-label="Previous week"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="text-sm font-medium text-foreground">
          {format(weekStart, "d MMM")} –{" "}
          {format(addDays(weekStart, 6), "d MMM, yyyy")}
        </span>

        <button
          onClick={() => setWeekStart((d) => addDays(d, 7))}
          className="rounded-lg border border-border p-2 hover:bg-muted transition-colors"
          aria-label="Next week"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <div className="grid min-w-[700px]" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
          {/* Day headers */}
          <div className="border-b border-border p-2" />
          {weekDays.map((day) => {
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "border-b border-l border-border p-2 text-center",
                  isToday && "bg-primary/5"
                )}
              >
                <p className="text-xs text-muted-foreground">
                  {format(day, "EEE")}
                </p>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    isToday && "text-primary"
                  )}
                >
                  {format(day, "d")}
                </p>
              </div>
            );
          })}

          {/* Time rows */}
          {HOURS.map((hour) => (
            <>
              {/* Hour label */}
              <div
                key={`hour-${hour}`}
                className="border-b border-border px-2 py-1 text-right"
              >
                <span className="text-xs text-muted-foreground">
                  {String(hour).padStart(2, "0")}:00
                </span>
              </div>

              {/* Day cells */}
              {weekDays.map((day) => {
                const dayAppts = getAppointmentsForDay(day).filter((a) => {
                  const apptHour = parseISO(a.scheduled_at).getHours();
                  return apptHour === hour;
                });

                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className={cn(
                      "min-h-[56px] border-b border-l border-border p-1",
                      isSameDay(day, new Date()) && "bg-primary/5"
                    )}
                  >
                    {dayAppts.map((appt) => (
                      <button
                        key={appt.id}
                        onClick={() => onSelectAppointment(appt)}
                        className="mb-1 w-full rounded-md px-2 py-1 text-left text-xs transition-opacity hover:opacity-80"
                        style={{
                          backgroundColor:
                            (appt.service?.color ?? "#6366f1") + "33",
                          borderLeft: `3px solid ${appt.service?.color ?? "#6366f1"}`,
                        }}
                      >
                        <span className="font-medium truncate block">
                          {appt.contact?.name ?? appt.contact?.phone ?? "—"}
                        </span>
                        <span className="text-muted-foreground">
                          {format(parseISO(appt.scheduled_at), "HH:mm")} ·{" "}
                          {appt.service?.name ?? "Appt"}
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
