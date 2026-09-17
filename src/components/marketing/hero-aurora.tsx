"use client";

/** Soft yellow bloom at the edges so the headline sits on dark, not on lines. */
export default function HeroAurora() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0C0C0A]" aria-hidden>
      <div className="hero-orb hero-orb-a" />
      <div className="hero-orb hero-orb-b" />
      <div className="hero-orb hero-orb-c" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_36%,transparent_0%,#0C0C0A_68%)]" />
    </div>
  );
}
