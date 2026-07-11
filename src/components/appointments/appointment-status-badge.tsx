"use client";

import { cn } from "@/lib/utils";
import {
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_LABELS,
} from "@/types/appointments";
import type { AppointmentStatus } from "@/types/appointments";

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus;
  className?: string;
}

export function AppointmentStatusBadge({
  status,
  className,
}: AppointmentStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        APPOINTMENT_STATUS_COLORS[status],
        className
      )}
    >
      {APPOINTMENT_STATUS_LABELS[status]}
    </span>
  );
}
