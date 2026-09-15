"use client";

import Link from "next/link";
import { BookOpen, Check, ArrowRight } from "lucide-react";
import { DAILY_RITUAL, GUIDE_SECTIONS, WEEK_ONE } from "@/lib/guia/sections";
import { cn } from "@/lib/utils";

export function GuidePage() {
  return (
    <div className="mx-auto max-w-3xl pb-16">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Guia do Snap</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Como usar o CRM no dia a dia: atender no Inbox, não deixar lead
            esfriar e registrar o negócio — sem misturar com o WhatsApp
            pessoal.
          </p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Rotina do dia
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Faça nesta ordem. É o jeito mais eficiente de não perder venda nem
          atendimento.
        </p>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2">
          {DAILY_RITUAL.map((item) => (
            <li key={item.step}>
              <Link
                href={item.href}
                className="group flex h-full gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/60"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {item.step}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                    {item.title}
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {item.text}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <nav
        aria-label="Índice do guia"
        className="mt-8 flex flex-wrap gap-2"
      >
        {GUIDE_SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            {section.title.split("—")[0].trim()}
          </a>
        ))}
      </nav>

      <div className="mt-10 space-y-8">
        {GUIDE_SECTIONS.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="scroll-mt-20 rounded-xl border border-border bg-card px-5 py-5"
          >
            <h2 className="text-lg font-semibold tracking-tight">
              {section.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {section.summary}
            </p>
            <ul className="mt-4 space-y-2.5">
              {section.body.map((line, i) => (
                <li
                  key={`${section.id}-${i}`}
                  className="flex gap-2.5 text-sm leading-relaxed text-foreground/90"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              {section.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "inline-flex h-8 items-center rounded-lg border border-border bg-background px-2.5 text-xs font-medium",
                    "text-foreground hover:bg-muted",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="mt-10 rounded-xl border border-border bg-card px-5 py-5">
        <h2 className="text-lg font-semibold tracking-tight">
          Primeira semana
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Checklist curto para o time entrar no ritmo.
        </p>
        <ol className="mt-4 space-y-3">
          {WEEK_ONE.map((item, i) => (
            <li key={item} className="flex gap-3 text-sm leading-relaxed">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                {i + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
