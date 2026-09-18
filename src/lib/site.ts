/**
 * Public hostnames after the Cloudflare cutover:
 *   snap.ia.br        — marketing (indexed)
 *   app.snap.ia.br    — CRM + WhatsApp webhooks (noindex)
 *
 * Localhost and *.vercel.app stay in "combined" mode so previews
 * keep serving both surfaces until DNS points at the new hosts.
 */

export const MARKETING_HOST = "snap.ia.br";
export const APP_HOST = "app.snap.ia.br";

function stripSlash(value: string | undefined): string {
  return (value ?? "").trim().replace(/\/+$/, "");
}

export function marketingOrigin(): string {
  return stripSlash(process.env.NEXT_PUBLIC_SITE_URL) || `https://${MARKETING_HOST}`;
}

export function appOrigin(): string {
  return stripSlash(process.env.NEXT_PUBLIC_APP_URL) || `https://${APP_HOST}`;
}

export function hostnameOf(hostHeader: string | null): string {
  return (hostHeader ?? "").split(",")[0]?.trim().split(":")[0]?.toLowerCase() ?? "";
}

export type HostRole = "marketing" | "app" | "combined";

export function hostRole(hostHeader: string | null): HostRole {
  const host = hostnameOf(hostHeader);
  if (host === MARKETING_HOST || host === `www.${MARKETING_HOST}`) return "marketing";
  if (host === APP_HOST) return "app";
  return "combined";
}

/** Login / app links on the public landing. Relative on previews. */
export function appHref(path: string): string {
  const origin = stripSlash(process.env.NEXT_PUBLIC_APP_URL);
  if (!origin) return path;
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${suffix}`;
}

export const MARKETING_PATHS = new Set(["/", "/snapflow"]);

export const APP_PATH_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/join",
  "/dashboard",
  "/inbox",
  "/contacts",
  "/pipelines",
  "/broadcasts",
  "/automations",
  "/settings",
  "/chat",
  "/appointments",
  "/flows",
  "/guia",
  "/radar",
  "/api",
] as const;

export function isAppPath(pathname: string): boolean {
  return APP_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
