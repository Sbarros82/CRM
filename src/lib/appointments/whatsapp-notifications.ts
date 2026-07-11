// src/lib/appointments/whatsapp-notifications.ts
// Sends WhatsApp text messages for appointment events.
// Uses the WhatsApp config (access token + phone number ID) stored
// per account, following the same pattern as the send route.

import { supabaseAdmin } from "@/lib/flows/admin-client";
import { sendTextMessage } from "@/lib/whatsapp/meta-api";
import { decrypt, isLegacyFormat } from "@/lib/whatsapp/encryption";
import { sanitizePhoneForMeta, isValidE164 } from "@/lib/whatsapp/phone-utils";
import { markReminderSent } from "./queries";

async function getWhatsAppToken(
  accountId: string
): Promise<{ accessToken: string; phoneNumberId: string } | null> {
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("whatsapp_config")
    .select("access_token, phone_number_id")
    .eq("account_id", accountId)
    .maybeSingle();

  if (!data?.access_token || !data?.phone_number_id) return null;

  let accessToken: string;
  try {
    const raw = isLegacyFormat(data.access_token)
      ? data.access_token
      : decrypt(data.access_token);
    accessToken = raw;
  } catch {
    return null;
  }

  return { accessToken, phoneNumberId: data.phone_number_id };
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export async function sendAppointmentConfirmation(
  accountId: string,
  appointment: {
    id: string;
    scheduled_at: string;
    contact: { name: string | null; phone: string } | null;
    service: { name: string } | null;
  }
): Promise<void> {
  if (!appointment.contact?.phone) return;

  const creds = await getWhatsAppToken(accountId);
  if (!creds) return;

  const phone = sanitizePhoneForMeta(appointment.contact.phone);
  if (!isValidE164(phone)) return;

  const contactName = appointment.contact.name ?? "Cliente";
  const serviceName = appointment.service?.name ?? "Atendimento";
  const dateTime = formatDateTime(appointment.scheduled_at);

  const message =
    `Olá ${contactName}! ✅\n\n` +
    `Seu agendamento foi confirmado:\n` +
    `📋 *${serviceName}*\n` +
    `📅 ${dateTime}\n\n` +
    `Para cancelar, responda CANCELAR.`;

  await sendTextMessage({
    accessToken: creds.accessToken,
    phoneNumberId: creds.phoneNumberId,
    to: phone,
    text: message,
  });
  await markReminderSent(supabaseAdmin(), appointment.id, "confirmation");
}

export async function sendAppointmentReminder24h(
  accountId: string,
  appointment: {
    id: string;
    scheduled_at: string;
    contact: { name: string | null; phone: string } | null;
    service: { name: string } | null;
  }
): Promise<void> {
  if (!appointment.contact?.phone) return;

  const creds = await getWhatsAppToken(accountId);
  if (!creds) return;

  const phone = sanitizePhoneForMeta(appointment.contact.phone);
  if (!isValidE164(phone)) return;

  const contactName = appointment.contact.name ?? "Cliente";
  const serviceName = appointment.service?.name ?? "Atendimento";
  const time = formatTime(appointment.scheduled_at);

  const message =
    `Olá ${contactName}! 👋\n\n` +
    `Lembrete: você tem um agendamento amanhã!\n` +
    `📋 *${serviceName}* às *${time}*\n\n` +
    `Te esperamos! 😊`;

  await sendTextMessage({
    accessToken: creds.accessToken,
    phoneNumberId: creds.phoneNumberId,
    to: phone,
    text: message,
  });
  await markReminderSent(supabaseAdmin(), appointment.id, "24h");
}

export async function sendAppointmentReminder1h(
  accountId: string,
  appointment: {
    id: string;
    scheduled_at: string;
    contact: { name: string | null; phone: string } | null;
    service: { name: string } | null;
  }
): Promise<void> {
  if (!appointment.contact?.phone) return;

  const creds = await getWhatsAppToken(accountId);
  if (!creds) return;

  const phone = sanitizePhoneForMeta(appointment.contact.phone);
  if (!isValidE164(phone)) return;

  const contactName = appointment.contact.name ?? "Cliente";
  const serviceName = appointment.service?.name ?? "Atendimento";
  const time = formatTime(appointment.scheduled_at);

  const message =
    `${contactName}, seu *${serviceName}* começa em 1 hora (${time})! ⏰\n\n` +
    `Até já! 👋`;

  await sendTextMessage({
    accessToken: creds.accessToken,
    phoneNumberId: creds.phoneNumberId,
    to: phone,
    text: message,
  });
  await markReminderSent(supabaseAdmin(), appointment.id, "1h");
}
