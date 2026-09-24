/**
 * Mobile companion surfaces. Full CRM stays on desktop (lg+).
 * Phone / installed PWA: live Inbox, internal chat, and profile settings.
 */

export const MOBILE_ALLOWED_PREFIXES = [
  "/inbox",
  "/chat",
  "/settings",
  "/login",
  "/signup",
  "/forgot-password",
  "/join",
] as const;

export function isMobileAllowedPath(pathname: string): boolean {
  return MOBILE_ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Settings tabs available on phone. Everything else → profile. */
export const MOBILE_SETTINGS_TABS = new Set(["profile", "security", "appearance"]);

export const MOBILE_DESKTOP_HINT =
  "No celular o Snap mostra Inbox, Chat interno e Perfil. As outras telas ficam no computador.";
