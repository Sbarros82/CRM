import { isOptedOut } from "./opt-out";
import { isSessionOpen, type OutboundKind } from "./session-window";

export type { OutboundKind };

export type SendBlockCode = "opted_out" | "session_expired";

export class SendBlockedError extends Error {
  readonly code: SendBlockCode;
  constructor(code: SendBlockCode, message: string) {
    super(message);
    this.name = "SendBlockedError";
    this.code = code;
  }
}

export interface SendGuardInput {
  optedOutAt?: string | null;
  lastInboundAt?: string | null;
  kind: OutboundKind;
  /**
   * One-shot confirmation after STOP/START. Bypasses opt-out only —
   * the 24h window still applies for free-form text.
   */
  ignoreOptOut?: boolean;
}

/**
 * Shared gate for every outbound path (inbox, automations, flows,
 * broadcasts, appointment reminders, AI). Throws SendBlockedError so
 * callers can map to HTTP 409 without string-matching.
 */
export function assertCanSend(input: SendGuardInput): void {
  if (!input.ignoreOptOut && isOptedOut(input.optedOutAt)) {
    throw new SendBlockedError(
      "opted_out",
      "This contact opted out of WhatsApp messages.",
    );
  }
  if (input.kind === "session" && !isSessionOpen(input.lastInboundAt)) {
    throw new SendBlockedError(
      "session_expired",
      "The 24-hour customer-care window is closed. Send an approved template instead.",
    );
  }
}

export function sendBlockHttpStatus(code: SendBlockCode): number {
  return code === "opted_out" ? 409 : 403;
}
