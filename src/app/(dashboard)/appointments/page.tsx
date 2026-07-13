"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Calendar, List, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppointmentWithDetails, AppointmentStatus } from "@/types/appointments";
import { AppointmentCalendar } from "@/components/appointments/appointment-calendar";
import { AppointmentList } from "@/components/appointments/appointment-list";
import { AppointmentForm } from "@/components/appointments/appointment-form";

type ViewMode = "calendar" | "list";

export default function AppointmentsPage() {
  const [view, setView] = useState<ViewMode>("list");
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<AppointmentWithDetails | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/appointments");
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  async function handleStatusChange(id: string, status: AppointmentStatus) {
    await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchAppointments();
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este agendamento?")) return;
    await fetch(`/api/appointments/${id}`, { method: "DELETE" });
    fetchAppointments();
  }

  function handleEdit(appt: AppointmentWithDetails) {
    setEditingAppointment(appt);
    setShowForm(true);
  }

  function handleNewAppointment() {
    setEditingAppointment(null);
    setShowForm(true);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Agendamentos</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Gerencie a agenda e as reservas de sua equipe.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-border bg-card p-1">
            <button
              onClick={() => setView("list")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                view === "list"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-3.5 w-3.5" />
              Lista
            </button>
            <button
              onClick={() => setView("calendar")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                view === "calendar"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Calendar className="h-3.5 w-3.5" />
              Calendário
            </button>
          </div>

          <button
            onClick={fetchAppointments}
            className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Atualizar"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>

          <button
            id="new-appointment-btn"
            onClick={handleNewAppointment}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo agendamento
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : view === "calendar" ? (
        <AppointmentCalendar
          appointments={appointments}
          onSelectAppointment={handleEdit}
        />
      ) : (
        <AppointmentList
          appointments={appointments}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Form modal */}
      {showForm && (
        <AppointmentForm
          appointment={editingAppointment}
          onClose={() => setShowForm(false)}
          onSaved={fetchAppointments}
        />
      )}
    </div>
  );
}
