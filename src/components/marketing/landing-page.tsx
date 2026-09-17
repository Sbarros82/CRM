"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import LiveChat from "@/components/originkit/live-chat";
import WaveArcs from "@/components/originkit/wave-arcs";

const NAV = [
  { href: "#inbox", label: "Inbox" },
  { href: "#funil", label: "Funil" },
  { href: "#transmissoes", label: "Transmissões" },
  { href: "#ia", label: "IA" },
];

const SHOWCASES = [
  {
    id: "inbox",
    label: "Atender",
    title: "Uma fila. Todo o WhatsApp da empresa.",
    body: "O time vê quem escreveu agora, quem ficou sem resposta e quem precisa de um humano. Sem conversa perdida no celular de alguém.",
  },
  {
    id: "funil",
    label: "Vender",
    title: "O negócio anda junto com a conversa.",
    body: "Quando o cliente pede orçamento ou confirma, o funil muda de etapa. O comercial vê o número — não um print no grupo.",
  },
  {
    id: "transmissoes",
    label: "Reabrir",
    title: "Transmissão com modelo aprovado na Meta.",
    body: "Campanha para a base fria só com template aprovado. Sem inventar atalho que derruba o número.",
  },
  {
    id: "ia",
    label: "Triage",
    title: "A IA atende. Quem fecha é gente.",
    body: "Ela responde FAQ, tria e chama o consultor. Preço de site e fechamento de venda ficam com o time — de propósito.",
  },
] as const;

type ShowcaseId = (typeof SHOWCASES)[number]["id"];

/** Paleta TourBrasil: amarelo #FFDD00 no fundo quase preto. */
const TB = {
  yellow: "#FFDD00",
  ink: "#1A1A1A",
} as const;

const chatTheme = {
  sentBubbleColor: TB.yellow,
  sentTextColor: TB.ink,
  receivedBubbleColor: "#2A2A24",
  receivedTextColor: "#F4F4EC",
} as const;

function PipelineMock() {
  const cols = [
    { name: "Novo", items: ["Maria Gatinha", "Hotel Recife"] },
    { name: "Proposta", items: ["Tour família"] },
    { name: "Fechamento", items: ["Grupo 12 pax"] },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 p-3">
      {cols.map((col) => (
        <div key={col.name} className="min-w-0">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-[#FFDD00]/80">
            {col.name}
          </p>
          <div className="space-y-2">
            {col.items.map((item) => (
              <div
                key={item}
                className="rounded-lg border border-white/10 bg-[#1A1A1A] px-2.5 py-2"
              >
                <p className="truncate text-xs font-medium text-white">
                  {item}
                </p>
                <p className="mt-0.5 text-[10px] text-zinc-400">WhatsApp</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function BroadcastMock() {
  return (
    <div className="space-y-3 p-4">
      <div className="rounded-xl border border-white/10 bg-[#1A1A1A] p-3">
        <p className="text-[10px] font-medium uppercase tracking-wider text-[#FFDD00]">
          Modelo
        </p>
        <p className="mt-1 text-sm font-semibold text-white">
          apresentacao_snap
        </p>
        <p className="mt-2 text-xs leading-relaxed text-zinc-400">
          Olá {"{{1}}"}, aqui é o time Snap. Posso te mostrar o CRM no
          WhatsApp?
        </p>
      </div>
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#1A1A1A] px-3 py-2 text-xs">
        <span className="text-zinc-500">Alcance estimado</span>
        <span className="font-semibold text-white">4 contatos</span>
      </div>
      <div className="rounded-xl bg-[#FFDD00] px-3 py-2 text-center text-xs font-medium text-[#1A1A1A]">
        Revisar e enviar
      </div>
    </div>
  );
}

function FlowGraphMock() {
  const card =
    "rounded-xl border border-white/10 bg-[#1A1A1A] px-3 py-2.5 text-left shadow-sm";
  return (
    <div className="relative overflow-hidden bg-[#141410] px-4 py-8 sm:px-8">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 md:flex-row md:items-start md:justify-between">
        <div className={`${card} w-full max-w-[140px] md:mt-16`}>
          <p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-400">
            Start
          </p>
          <p className="mt-1 text-xs text-white">Entrada</p>
        </div>
        <div className={`${card} w-full max-w-[200px]`}>
          <p className="text-[9px] font-semibold uppercase tracking-wider text-violet-300">
            Send list
          </p>
          <p className="mt-1 text-xs font-medium text-white">FAQ Snap</p>
          <ul className="mt-2 space-y-1 text-[10px] text-zinc-400">
            <li>Horário</li>
            <li>Planos Snap</li>
            <li>Site e landing</li>
            <li>Automações</li>
            <li>Falar com consultor</li>
          </ul>
        </div>
        <div className="flex w-full max-w-[220px] flex-col gap-2">
          <div className={card}>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-violet-300">
              Send message
            </p>
            <p className="mt-1 text-[11px] text-zinc-300">
              Horário comercial em Brasília…
            </p>
          </div>
          <div className={card}>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-rose-300">
              Handoff
            </p>
            <p className="mt-1 text-[11px] text-zinc-300">
              Pediu consultor — vai para o Inbox.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
  return (
    <div className="p-4">
      <LiveChat
        showTyping
        typingSender="them"
        {...chatTheme}
        messages={[
          {
            text: "Quanto custa a landing page?",
            sender: "them",
            timestamp: "11:02",
          },
          {
            text: "O valor depende das páginas e do prazo — um consultor monta a proposta. Vou chamar alguém do time.",
            sender: "me",
            timestamp: "11:02",
          },
        ]}
      />
    </div>
  );
}

const SALES_WHATSAPP = "5582982218199";

function whatsappDemoUrl(email?: string) {
  const text = email?.trim()
    ? `Olá! Quero uma demonstração do Snap. Meu e-mail: ${email.trim()}`
    : "Olá! Quero uma demonstração do Snap.";
  return `https://wa.me/${SALES_WHATSAPP}?text=${encodeURIComponent(text)}`;
}

export function LandingPage({
  product = "snap",
}: {
  product?: "snap" | "snapflow";
}) {
  const isFlow = product === "snapflow";
  const [tab, setTab] = useState<ShowcaseId>("inbox");
  const [email, setEmail] = useState("");
  const active = SHOWCASES.find((s) => s.id === tab) ?? SHOWCASES[0];

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
        <div className="pointer-events-none absolute inset-0 opacity-80">
          <WaveArcs
            backgroundColor="#0C0C0A"
            lineColor="#FFDD00"
            glow={12}
            speed={4}
            lineCount={64}
          />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-16 sm:px-6 sm:pt-24">
          <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-[#FFDD00]">
            {isFlow ? "Menus e FAQ no WhatsApp" : "CRM no WhatsApp"}
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-center text-4xl font-semibold tracking-tight text-white sm:text-6xl sm:leading-[1.05]">
            {isFlow
              ? "O fluxo atende. O consultor fecha."
              : "O atendimento da equipe, no mesmo lugar."}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-center text-base leading-relaxed text-zinc-400 sm:text-lg">
            {isFlow
              ? "Botões, listas e handoff para o time. A IA e o menu triam — preço e venda ficam com gente."
              : "Inbox compartilhado, funil, transmissões e uma IA que tria. O fechamento fica com o consultor — não com o bot."}
          </p>

          <form
            id="demo"
            onSubmit={requestDemo}
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
          </form>
          <p className="mt-3 text-center text-xs text-zinc-500">
            Sem tabela de preço aqui. Um consultor responde no WhatsApp.
          </p>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="relative mx-auto max-w-4xl">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111110] shadow-[0_40px_80px_-24px_rgba(255,221,0,0.18)]">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <span className="ml-2 text-[11px] text-white/50">
                {isFlow ? "Snap Flow · FAQ" : "Snap · Inbox"}
              </span>
            </div>
            {isFlow ? (
              <FlowGraphMock />
            ) : (
            <div className="grid min-h-[340px] md:grid-cols-[200px_1fr]">
              <div className="hidden border-r border-white/10 p-3 md:block">
                {["Maria Gatinha", "Hotel Recife", "Grupo B2B"].map(
                  (name, i) => (
                    <div
                      key={name}
                      className={`mb-1 rounded-lg px-2 py-2 ${
                        i === 0 ? "bg-white/10" : ""
                      }`}
                    >
                      <p className="text-xs font-medium text-white">{name}</p>
                      <p className="truncate text-[10px] text-white/45">
                        {i === 0
                          ? "Quero falar com o time"
                          : "Última mensagem há 2 h"}
                      </p>
                    </div>
                  ),
                )}
              </div>
              <div className="bg-[#161614]">
                <LiveChat {...chatTheme} />
              </div>
            </div>
            )}
          </div>
          {!isFlow && (
          <div className="pointer-events-none absolute -bottom-8 -right-2 hidden w-56 overflow-hidden rounded-xl border border-white/10 bg-[#1A1A1A] shadow-xl sm:block md:-right-6">
            <p className="border-b border-white/10 px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-[#FFDD00]">
              Funil
            </p>
            <PipelineMock />
          </div>
          )}
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#141412] py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#FFDD00]">
            O sistema
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            O inteligente que não dorme. O humano que fecha.
          </h2>
          <div className="mt-8 flex flex-wrap gap-2">
            {SHOWCASES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setTab(s.id)}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                  tab === s.id
                    ? "bg-[#FFDD00] text-[#1A1A1A]"
                    : "bg-white/10 text-zinc-400 hover:bg-white/15 hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="mt-10 grid items-start gap-10 lg:grid-cols-2">
            <div>
              <h3 className="text-2xl font-semibold tracking-tight text-white">
                {active.title}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-zinc-400">
                {active.body}
              </p>
              <a
                href={`#${active.id}`}
                className="mt-6 inline-block text-sm font-medium text-[#FFDD00] hover:underline"
              >
                Ver essa parte ↓
              </a>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0C0C0A]">
              {tab === "inbox" && (
                <div className="min-h-[280px] bg-[#161614]">
                  <LiveChat showTyping={false} {...chatTheme} />
                </div>
              )}
              {tab === "funil" && (
                <div className="min-h-[280px]">
                  <PipelineMock />
                </div>
              )}
              {tab === "transmissoes" && (
                <div className="min-h-[280px]">
                  <BroadcastMock />
                </div>
              )}
              {tab === "ia" && (
                <div className="min-h-[280px] bg-[#161614]">
                  <AiHandoffMock />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="inbox" className="border-t border-white/10 py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#FFDD00]">
              Inbox
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              O WhatsApp da empresa, não do aparelho.
            </h2>
            <p className="mt-3 text-zinc-400">
              Atribuição, fila, pausa da IA quando o humano entra. O painel do
              contato fica ao lado — notas longas rolam ali, a conversa
              continua visível.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-zinc-300">
            {[
              "Vários agentes no mesmo número oficial (Cloud API)",
              "Radar de quem ficou sem resposta",
              "Chat interno do time, separado do cliente",
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FFDD00]" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="funil" className="border-t border-white/10 bg-[#141412] py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:grid lg:grid-cols-2 lg:items-center lg:gap-10">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0C0C0A] lg:order-2">
            <PipelineMock />
          </div>
          <div className="mt-8 lg:order-1 lg:mt-0">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#FFDD00]">
              Funil
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              Do “oi” até o negócio, no mesmo CRM.
            </h2>
            <p className="mt-3 text-zinc-400">
              Contato, conversa e etapa de venda juntos. Sem planilha paralela
              para saber quem está quente.
            </p>
          </div>
        </div>
      </section>

      <section
        id="transmissoes"
        className="border-t border-white/10 py-16"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:grid lg:grid-cols-2 lg:items-center lg:gap-10">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#FFDD00]">
              Transmissões
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              Campanha só com modelo aprovado.
            </h2>
            <p className="mt-3 text-zinc-400">
              Público, variáveis e revisão antes de disparar. Marketing fora da
              janela de 24h segue a regra da Meta — não um atalho.
            </p>
          </div>
          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#141412] lg:mt-0">
            <BroadcastMock />
          </div>
        </div>
      </section>

      <section id="ia" className="border-t border-white/10 bg-[#141412] py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:grid lg:grid-cols-2 lg:items-center lg:gap-10">
          <div className="overflow-hidden rounded-2xl bg-[#161614] lg:order-2">
            <AiHandoffMock />
          </div>
          <div className="mt-8 lg:order-1 lg:mt-0">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#FFDD00]">
              Inteligência
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              Agente no WhatsApp. Fechamento humano.
            </h2>
            <p className="mt-3 text-zinc-400">
              A IA tira dúvida de produto, não inventa valor de landing e não
              encerra a venda. Quando o lead pede preço ou consultor, o time
              entra.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 py-20">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Pronto para ver o Snap no seu número?
          </h2>
          <p className="mt-3 text-zinc-400">
            Peça uma demonstração. Quem fecha a conversa é o consultor.
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
      </section>

      <a
        href={whatsappDemoUrl()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(37,211,102,0.45)] transition hover:scale-105 hover:bg-[#20bd5a]"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-7 w-7"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>

      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-zinc-500 sm:flex-row sm:px-6">
          <span>{isFlow ? "Snap Flow" : "Snap · CRM no WhatsApp"}</span>
          <span>Prints e GIFs do produto entram nesta tela depois.</span>
        </div>
      </footer>
    </div>
  );
}
