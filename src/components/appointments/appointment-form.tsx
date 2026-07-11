"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import type {
  AppointmentWithDetails,
  CreateAppointmentInput,
  Service,
} from "@/types/appointments";

interface AppointmentFormProps {
  appointment?: AppointmentWithDetails | null;
  onClose: () => void;
  onSaved: () => void;
}

export function AppointmentForm({
  appointment,
  onClose,
  onSaved,
}: AppointmentFormProps) {
  const isEdit = !!appointment;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [contacts, setContacts] = useState<{ id: string; name: string | null; phone: string }[]>([]);
  const [contactSearch, setContactSearch] = useState(appointment?.contact?.name ?? "");
  const [showContactDropdown, setShowContactDropdown] = useState(false);

  const [form, setForm] = useState<CreateAppointmentInput>({
    contact_id: appointment?.contact_id ?? undefined,
    service_id: appointment?.service_id ?? undefined,
    assigned_to: appointment?.assigned_to ?? undefined,
    scheduled_at: appointment?.scheduled_at
      ? appointment.scheduled_at.slice(0, 16)
      : "",
    notes: appointment?.notes ?? undefined,
  });

  useEffect(() => {
    fetch("/api/appointments/services?active=true")
      .then((r) => r.json())
      .then(setServices)
      .catch(console.error);
  }, []);

  // Search contacts
  useEffect(() => {
    if (!contactSearch || contactSearch.length < 2) {
      setContacts([]);
      return;
    }
    const timeout = setTimeout(() => {
      fetch(`/api/contacts/search?q=${encodeURIComponent(contactSearch)}`)
        .then((r) => r.json())
        .then((data) => setContacts(data?.contacts ?? data ?? []))
        .catch(console.error);
    }, 300);
    return () => clearTimeout(timeout);
  }, [contactSearch]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.scheduled_at) {
      setError("Date and time are required.");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...form,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
      };

      const url = isEdit
        ? `/api/appointments/${appointment!.id}`
        : "/api/appointments";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save appointment");
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">
            {isEdit ? "Edit Appointment" : "New Appointment"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {/* Contact search */}
          <div className="relative">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Contact
            </label>
            <input
              type="text"
              value={contactSearch}
              onChange={(e) => {
                setContactSearch(e.target.value);
                setShowContactDropdown(true);
                if (!e.target.value) setForm((f) => ({ ...f, contact_id: undefined }));
              }}
              placeholder="Search by name or phone…"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {showContactDropdown && contacts.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-card shadow-lg">
                {contacts.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, contact_id: c.id }));
                      setContactSearch(c.name ?? c.phone);
                      setShowContactDropdown(false);
                    }}
                    className="flex w-full flex-col px-3 py-2 text-left hover:bg-muted transition-colors text-sm"
                  >
                    <span className="font-medium">{c.name ?? "—"}</span>
                    <span className="text-xs text-muted-foreground">{c.phone}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Service */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Service
            </label>
            <select
              value={form.service_id ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, service_id: e.target.value || undefined }))
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Select a service…</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.duration_minutes}min
                  {s.price ? ` · R$ ${Number(s.price).toFixed(2)}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Date & Time *
            </label>
            <input
              type="datetime-local"
              required
              value={form.scheduled_at}
              onChange={(e) =>
                setForm((f) => ({ ...f, scheduled_at: e.target.value }))
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Notes
            </label>
            <textarea
              value={form.notes ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value || undefined }))
              }
              rows={3}
              placeholder="Internal notes about this appointment…"
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isEdit ? "Save changes" : "Create appointment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
