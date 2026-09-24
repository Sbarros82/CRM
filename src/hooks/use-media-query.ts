"use client";

import { useEffect, useState } from "react";

/** Tailwind `lg` breakpoint — desktop shell at 1024px+. */
const LG_QUERY = "(min-width: 1024px)";

export function useIsDesktop(): boolean {
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(LG_QUERY);
    const apply = () => setDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return desktop;
}

export function useIsMobileApp(): boolean {
  return !useIsDesktop();
}
