/**
 * Meta Cloud API customer-care window: free-form (text/media) messages
 * are only allowed within 24 hours of the last *customer* inbound.
 * Approved templates can always be sent (subject to opt-out).
 */

export const CUSTOMER_CARE_HOURS = 24;

export function isSessionOpen(
  lastInboundAt: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!lastInboundAt) return false;
  const then = new Date(lastInboundAt);
  if (Number.isNaN(then.getTime())) return false;
  const elapsedMs = now.getTime() - then.getTime();
  return elapsedMs >= 0 && elapsedMs < CUSTOMER_CARE_HOURS * 60 * 60 * 1000;
}

export type OutboundKind = "session" | "template";

export function requiresOpenSession(kind: OutboundKind): boolean {
  return kind === "session";
}
