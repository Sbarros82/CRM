import Link from "next/link";
import type { ReactNode } from "react";
import { appHref } from "@/lib/site";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0C0C0A] text-zinc-100">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-sm font-semibold tracking-[0.2em] text-[#FFDD00]">
            SNAP
          </Link>
          <Link
            href={appHref("/login")}
            className="text-sm text-zinc-400 transition hover:text-white"
          >
            Entrar
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-xs uppercase tracking-widest text-zinc-500">Documentação legal</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">{title}</h1>
        <p className="mt-2 text-sm text-zinc-500">Última atualização: {updated}</p>
        <div className="legal-body mt-10 space-y-6 text-[15px] leading-relaxed text-zinc-300 [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_a]:text-[#FFDD00] [&_a]:underline-offset-2 hover:[&_a]:underline [&_strong]:text-white">
          {children}
        </div>
        <nav className="mt-14 flex flex-wrap gap-4 border-t border-white/10 pt-6 text-sm text-zinc-400">
          <Link href="/privacidade" className="hover:text-[#FFDD00]">
            Privacidade
          </Link>
          <Link href="/termos" className="hover:text-[#FFDD00]">
            Termos
          </Link>
          <Link href="/exclusao-de-dados" className="hover:text-[#FFDD00]">
            Exclusão de dados
          </Link>
          <Link href="/" className="hover:text-[#FFDD00]">
            Início
          </Link>
        </nav>
      </main>
    </div>
  );
}
