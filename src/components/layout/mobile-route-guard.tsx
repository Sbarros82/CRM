"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useIsDesktop } from "@/hooks/use-media-query";
import {
  isMobileAllowedPath,
  MOBILE_DESKTOP_HINT,
  MOBILE_SETTINGS_TABS,
} from "@/lib/mobile-app";

/**
 * On phone viewports, keep users on Inbox / Chat / Perfil.
 * Desktop CRM routes redirect to Inbox with a short hint.
 */
export function MobileRouteGuard() {
  const desktop = useIsDesktop();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (desktop) return;

    if (!isMobileAllowedPath(pathname)) {
      toast.message(MOBILE_DESKTOP_HINT);
      router.replace("/inbox");
      return;
    }

    if (pathname === "/settings" || pathname.startsWith("/settings/")) {
      const tab = searchParams.get("tab") ?? "profile";
      if (!MOBILE_SETTINGS_TABS.has(tab)) {
        router.replace("/settings?tab=profile");
      }
    }
  }, [desktop, pathname, router, searchParams]);

  return null;
}
