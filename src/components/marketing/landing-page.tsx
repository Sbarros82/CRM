"use client";

import { FormEvent, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import HeroAurora from "@/components/marketing/hero-aurora";
import { Reveal } from "@/components/marketing/reveal";
import {
  AiHandoffMock,
  BroadcastMock,
  DashboardMock,
  FlowCanvasMock,
  FunilBoardMock,
  InboxThreadMock,
} from "@/components/marketing/product-mocks";

const NAV = [
  { href: "#painel", label: "Painel" },
  { href: "#funil", label: "Funil" },
  { href: "#fluxos", label: "Fluxos" },
  { href: "#inbox", label: "Inbox" },
  { href: "#ia", label: "IA" },
];

const STEPS = [
  {
    n: "01",
    title: "O WhatsApp chega no Inbox",
    body: "Um número oficial da empresa. Vários agentes. Fila, atribuição e radar de quem esfriou.",
  },
  {
    n: "02",
    title: "O fluxo responde o óbvio",
    body: "Menu, FAQ, horário, o que vocês fazem. Sem inventar preço. Quem pede consultor sai do bot.",
  },
  {
    n: "03",
    title: "O negócio anda no funil",
    body: "Do primeiro oi até ganho ou perdido — no mesmo CRM, não numa planilha paralela.",
  },
  {
    n: "04",
    title: "Gente fecha",
    body: "A IA tria. Transmissão só com modelo aprovado. Contrato e valor: consultor.",
  },
];

const SALES_WHATSAPP = "5582982218199";

function whatsappDemoUrl(email?: string) {
  const text = email?.trim()
    ? `Olá! Quero uma demonstração do Snap. Meu e-mail: ${email.trim()}`
    : "Olá! Quero uma demonstração do Snap.";
  return `https://wa.me/${SALES_WHATSAPP}?text=${encodeURIComponent(text)}`;
}

function Frame({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111110] shadow-[0_40px_80px_-24px_rgba(255,221,0,0.16)]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        <span className="ml-2 text-[11px] text-white/50">{title}</span>
      </div>
      {children}
    </div>
  );
}

export function LandingPage({
  product = "snap",
}: {
  product?: "snap" | "snapflow";
}) {
  const isFlow = product === "snapflow";
  const [email, setEmail] = useState("");

  function requestDemo(e: FormEvent) {
    e.preventDefault();
    window.open(whatsappDemoUrl(email), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="min-h-screen bg-[#0C0C0A] text-zinc-100 antialiased">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0C0C0A]/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#topo" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt=""
              className="h-8 w-8 rounded-md object-contain"
            />
            <span className="text-sm font-semibold tracking-tight text-white">
              {isFlow ? "Snap Flow" : "Snap"}
            </span>
          </a>
          <nav className="hidden items-center gap-6 text-sm text-zinc-400 md:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-[#FFDD00]"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-full px-3 py-1.5 text-sm text-zinc-400 hover:text-white sm:inline"
            >
              Entrar
            </Link>
            <a
              href={whatsappDemoUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#FFDD00] px-3.5 py-1.5 text-sm font-medium text-[#1A1A1A] hover:bg-[#ffe44d]"
            >
              Pedir demo
            </a>
          </div>
        </div>
      </header>

      <section id="topo" className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <HeroAurora />
        </div>
        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-10 pt-16 sm:px-6 sm:pt-24">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-xs font-medium uppercase tracking-[0.2em] text-[#FFDD00]"
          >
            {isFlow ? "Menus e FAQ no WhatsApp" : "CRM + fluxo no WhatsApp"}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mx-auto mt-4 max-w-3xl text-center text-4xl font-semibold tracking-tight text-white [text-shadow:0_2px_28px_rgba(12,12,10,0.85)] sm:text-6xl sm:leading-[1.05]"
          >
            {isFlow
              ? "O fluxo atende. O consultor fecha."
              : "Inbox, funil e fluxo — o WhatsApp da empresa num só lugar."}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="mx-auto mt-5 max-w-2xl text-center text-base leading-relaxed text-zinc-300 sm:text-lg"
          >
            Painel com conversas ativas e radar. Funil com etapas de verdade.
            Fluxo com lista, FAQ e handoff. A IA não inventa preço e não
            encerra venda.
          </motion.p>

          <motion.form
            id="demo"
            onSubmit={requestDemo}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="mx-auto mt-8 flex max-w-md flex-col gap-2 sm:flex-row"
          >
            <label className="sr-only" htmlFor="demo-email">
              Seu e-mail
            </label>
            <input
              id="demo-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu e-mail"
              className="h-11 flex-1 rounded-full border border-white/15 bg-white/5 px-4 text-sm text-white outline-none ring-[#FFDD00]/40 placeholder:text-zinc-500 focus:ring-2"
            />
            <button
              type="submit"
              className="h-11 shrink-0 rounded-full bg-[#FFDD00] px-5 text-sm font-medium text-[#1A1A1A] hover:bg-[#ffe44d]"
            >
              Pedir demonstração
            </button>
          </motion.form>
          <p className="mt-3 text-center text-xs text-zinc-500">
            Abre o WhatsApp (82) 98221-8199. Sem tabela de preço nesta página.
          </p>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <Reveal>
          <Frame title={isFlow ? "Snap Flow · FAQ" : "Snap · Painel"}>
            {isFlow ? <FlowCanvasMock /> : <DashboardMock />}
          </Frame>
        </Reveal>
      </section>

      <section className="border-t border-white/10 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#FFDD00]">
              Como o dia funciona
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Quatro passos. Sem planilha no meio.
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.08}>
                <div className="h-full rounded-2xl border border-white/10 bg-[#141412] p-5">
                  <p className="font-mono text-xs text-[#FFDD00]">{s.n}</p>
                  <h3 className="mt-3 text-base font-semibold text-white">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    {s.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="painel" className="border-t border-white/10 bg-[#141412] py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:grid lg:grid-cols-2 lg:items-center lg:gap-10">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#FFDD00]">
              Painel
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              O número do dia, sem caçar no WhatsApp Web.
            </h2>
            <p className="mt-3 text-zinc-400">
              Conversas ativas (abertas e pendentes), quem falou hoje, valor
              no funil e mensagens enviadas. Alerta quando a conversa esfria —
              um clique leva ao radar.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-zinc-300">
              {[
                "Atalhos: novo contato, negócio, transmissão, automação",
                "Gráfico de recebidas × enviadas na semana",
                "Donut do pipeline por etapa",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FFDD00]" />
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1} className="mt-8 lg:mt-0">
            <Frame title="Painel">
              <DashboardMock />
            </Frame>
          </Reveal>
        </div>
      </section>

      <section id="funil" className="border-t border-white/10 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#FFDD00]">
              Funil
            </p>
            <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-white">
              O lead muda de coluna. A conversa não some.
            </h2>
            <p className="mt-3 max-w-2xl text-zinc-400">
              Maria Betânia entra em New Lead e o card atravessa Qualified,
              Proposal, Negotiation e Won. Cada etapa tem a coluna inteira —
              não cinco faixinhas no canto.
            </p>
          </Reveal>
          <Reveal delay={0.12} className="mt-8">
            <Frame title="Sales Pipeline">
              <FunilBoardMock />
            </Frame>
          </Reveal>
        </div>
      </section>

      <section id="fluxos" className="border-t border-white/10 bg-[#141412] py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#FFDD00]">
              Snap Flow
            </p>
            <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-white">
              Start → lista → resposta → humano.
            </h2>
            <p className="mt-3 max-w-2xl text-zinc-400">
              O FAQ Snap que vocês já usam: horário, o que o produto faz,
              landing, automações. “Falar com consultor” dispara handoff e
              pausa o bot naquela conversa.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="mt-8">
            <Frame title="FAQ Snap">
              <FlowCanvasMock />
            </Frame>
          </Reveal>
        </div>
      </section>

      <section id="inbox" className="border-t border-white/10 py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#FFDD00]">
              Inbox
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              O WhatsApp da empresa, não do aparelho.
            </h2>
            <p className="mt-3 text-zinc-400">
              Cloud API da Meta. Vários agentes no mesmo número. Quando o
              humano responde, a IA pausa. Notas longas rolam no painel do
              contato — a conversa não some da tela.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <Frame title="Inbox">
              <InboxThreadMock />
            </Frame>
          </Reveal>
        </div>
      </section>

      <section id="transmissoes" className="border-t border-white/10 bg-[#141412] py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:grid lg:grid-cols-2 lg:items-center lg:gap-10">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#FFDD00]">
              Transmissões
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              Campanha só com modelo aprovado.
            </h2>
            <p className="mt-3 text-zinc-400">
              Fora da janela de 24h, a Meta exige template. O assistente mapeia
              variáveis, mostra o alcance e pede confirmação. Sem atalho que
              derruba o número.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="mt-8 lg:mt-0">
            <Frame title="Revisar e enviar">
              <BroadcastMock />
            </Frame>
          </Reveal>
        </div>
      </section>

      <section id="ia" className="border-t border-white/10 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:grid lg:grid-cols-2 lg:items-center lg:gap-10">
          <Reveal className="lg:order-2">
            <Frame title="Handoff">
              <AiHandoffMock />
            </Frame>
          </Reveal>
          <Reveal className="mt-8 lg:order-1 lg:mt-0">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#FFDD00]">
              Inteligência
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              Agente no WhatsApp. Fechamento humano.
            </h2>
            <p className="mt-3 text-zinc-400">
              Tira dúvida de produto, não fecha site nem inventa valor de
              landing. Pediu preço ou consultor: o time entra no Inbox.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-white/10 py-20">
        <Reveal>
          <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Quer ver isso no seu número?
            </h2>
            <p className="mt-3 text-zinc-400">
              Demonstração com consultor no WhatsApp. Quem fecha a conversa é
              gente.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={whatsappDemoUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center rounded-full bg-[#FFDD00] px-6 text-sm font-medium text-[#1A1A1A] hover:bg-[#ffe44d]"
              >
                Pedir demonstração
              </a>
              <Link
                href="/login"
                className="inline-flex h-11 items-center rounded-full border border-white/20 px-6 text-sm font-medium text-white hover:bg-white/5"
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <motion.a
        href={whatsappDemoUrl()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.06 }}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(37,211,102,0.45)]"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-7 w-7"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </motion.a>

      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-zinc-500 sm:flex-row sm:px-6">
          <span>{isFlow ? "Snap Flow" : "Snap · CRM no WhatsApp"}</span>
          <span>Painel, funil e fluxos — o produto que vocês já usam.</span>
        </div>
      </footer>
    </div>
  );
}
