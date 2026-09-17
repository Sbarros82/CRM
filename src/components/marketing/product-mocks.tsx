"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LayoutGroup, motion, useInView } from "framer-motion";
import LiveChat from "@/components/originkit/live-chat";

const chatTheme = {
  sentBubbleColor: "#FFDD00",
  sentTextColor: "#1A1A1A",
  receivedBubbleColor: "#2A2A24",
  receivedTextColor: "#F4F4EC",
} as const;

export function DashboardMock() {
  const kpis = [
    { label: "Conversas ativas", value: "2", hint: "Abertas e pendentes" },
    { label: "Contatos hoje", value: "0", hint: "Quem falou hoje" },
    { label: "Negócios abertos", value: "1", hint: "No funil agora" },
    { label: "Msgs enviadas", value: "—", hint: "Time + IA" },
  ];
  return (
    <div className="bg-[#f6f4ef] p-4 text-zinc-800">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-3 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900"
      >
        <span>Conversas esfriando — abra o radar para retomar.</span>
        <span className="font-medium">Ver radar</span>
      </motion.div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 * i, duration: 0.45 }}
            className="rounded-xl border border-zinc-200/80 bg-white p-3"
          >
            <p className="text-[10px] text-zinc-500">{k.label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{k.value}</p>
            <p className="mt-0.5 text-[10px] text-zinc-400">{k.hint}</p>
          </motion.div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {["Novo contato", "Novo negócio", "Nova transmissão", "Nova automação"].map(
          (label, i) => (
            <motion.span
              key={label}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.35 + i * 0.06 }}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[10px] font-medium text-zinc-600"
            >
              {label}
            </motion.span>
          )
        )}
      </div>
      <div className="mt-3 rounded-xl border border-zinc-200/80 bg-white p-3">
        <p className="text-[10px] font-medium text-zinc-500">
          Conversas ao longo do tempo
        </p>
        <svg viewBox="0 0 320 80" className="mt-2 h-20 w-full">
          <motion.polyline
            fill="none"
            stroke="#67885d"
            strokeWidth="2"
            points="0,70 40,68 80,66 120,64 160,50 200,22 240,30 280,48 320,70"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
          />
          <motion.polyline
            fill="none"
            stroke="#7c6cf0"
            strokeWidth="2"
            points="0,72 40,70 80,69 120,67 160,55 200,28 240,38 280,52 320,72"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, delay: 0.15, ease: "easeInOut" }}
          />
        </svg>
      </div>
    </div>
  );
}

const FUNIL_COLS = [
  { name: "New Lead", color: "#3b82f6", hint: "Entrou no WhatsApp" },
  { name: "Qualified", color: "#f59e0b", hint: "Interesse confirmado" },
  { name: "Proposal Sent", color: "#f97316", hint: "Consultor enviou" },
  { name: "Negotiation", color: "#a855f7", hint: "Ajuste de proposta" },
  { name: "Won", color: "#22c55e", hint: "Fechado pelo time" },
] as const;

function LeadCard({ stage }: { stage: number }) {
  const col = FUNIL_COLS[stage];
  return (
    <motion.div
      layoutId="landing-funil-lead"
      className="relative z-20 rounded-xl border border-zinc-200/80 bg-white p-3 shadow-[0_10px_28px_-12px_rgba(26,26,26,0.35)]"
      transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.7 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-semibold text-zinc-600">
          MB
        </div>
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: col.color }}
          aria-hidden
        />
      </div>
      <p className="mt-2 text-[13px] font-semibold leading-snug text-zinc-800">
        Maria Betânia Martins
      </p>
      <p className="mt-0.5 text-[11px] text-zinc-500">WhatsApp · Inbox</p>
      <p className="mt-2 text-[10px] leading-relaxed text-zinc-400">{col.hint}</p>
      <div className="mt-2 flex items-center justify-between border-t border-zinc-100 pt-2 text-[10px] text-zinc-500">
        <span>Valor</span>
        <span className="font-medium text-zinc-700">Consultor fecha</span>
      </div>
    </motion.div>
  );
}

export function FunilBoardMock() {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.35 });
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (!inView) {
      setStage(0);
      return;
    }
    const id = window.setInterval(() => {
      setStage((current) => {
        if (current >= FUNIL_COLS.length - 1) return 0;
        return current + 1;
      });
    }, 1700);
    return () => window.clearInterval(id);
  }, [inView]);

  return (
    <div ref={rootRef} className="bg-[#f6f4ef] p-4 sm:p-5">
      <div className="mb-4 hidden grid-cols-5 gap-2 sm:grid">
        {[
          ["Total", "1 negócio"],
          ["Pipeline", "Aberto"],
          ["Etapa", FUNIL_COLS[stage].name],
          ["Origem", "WhatsApp"],
          ["Fechamento", "Humano"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-zinc-200/80 bg-white px-3 py-2"
          >
            <p className="text-[10px] text-zinc-400">{label}</p>
            <p className="mt-0.5 truncate text-[12px] font-medium text-zinc-700">
              {value}
            </p>
          </div>
        ))}
      </div>
      <LayoutGroup>
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {FUNIL_COLS.map((col, i) => {
            const active = stage === i;
            return (
              <div
                key={col.name}
                className="flex min-h-[220px] flex-col rounded-2xl border border-zinc-200 bg-white sm:min-h-[280px]"
              >
                <div
                  className="h-1.5 rounded-t-2xl"
                  style={{ background: col.color }}
                />
                <div className="flex items-baseline justify-between px-3 pt-3">
                  <p className="text-[12px] font-semibold text-zinc-800">
                    {col.name}
                  </p>
                  <span className="text-[10px] text-zinc-400">
                    {active ? "1" : "0"}
                  </span>
                </div>
                <p className="px-3 pb-2 text-[10px] text-zinc-400">{col.hint}</p>
                <div className="flex flex-1 flex-col px-2.5 pb-3">
                  {active ? (
                    <LeadCard stage={stage} />
                  ) : (
                    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-[#f6f4ef]/80 px-2 text-center text-[10px] leading-relaxed text-zinc-400">
                      Arraste o negócio para cá
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </LayoutGroup>
    </div>
  );
}

function bezierH(x1: number, y1: number, x2: number, y2: number) {
  const mid = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
}

const FAQ_TARGETS = [
  { kind: "Send message", text: "Atendimento: seg a sex, 9h–18h", y: 18 },
  { kind: "Send message", text: "Planos — consultor fecha o valor", y: 96 },
  { kind: "Send message", text: "Landing e site de captura", y: 174 },
  { kind: "Send message", text: "Automações e handoff no CRM", y: 252 },
  { kind: "Handoff", text: "Pediu consultor → Inbox", y: 330 },
] as const;

export function FlowCanvasMock() {
  const rootRef = useRef<HTMLDivElement>(null);
  const running = useInView(rootRef, { once: true, amount: 0.4 });
  const glowId = useId().replace(/:/g, "");

  const start = { x: 28, y: 176, w: 120, h: 68 };
  const list = { x: 214, y: 118, w: 188, h: 186 };
  const rightX = 548;
  const rightW = 228;
  const rightH = 64;

  const startOut = { x: start.x + start.w, y: start.y + start.h / 2 };
  const listIn = { x: list.x, y: list.y + list.h / 2 };
  const listOutX = list.x + list.w;
  const listHandleYs = [152, 178, 204, 230, 256];

  const trunk = bezierH(startOut.x, startOut.y, listIn.x, listIn.y);
  const branches = FAQ_TARGETS.map((card, i) =>
    bezierH(listOutX, listHandleYs[i], rightX, card.y + rightH / 2),
  );

  return (
    <div
      ref={rootRef}
      className={`overflow-hidden bg-[#f6f4ef] ${running ? "n8n-running" : ""}`}
    >
      <div className="relative aspect-[800/420] w-full min-h-[280px]">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 800 420"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          <defs>
            <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path className="n8n-edge-idle" d={trunk} />
          {branches.map((d) => (
            <path key={d} className="n8n-edge-idle" d={d} />
          ))}
          <path
            className="n8n-edge-paint"
            d={trunk}
            pathLength={1}
            style={{ ["--n8n-delay" as string]: "0.35s" }}
          />
          <path
            className="n8n-edge-packet"
            d={trunk}
            style={{
              ["--n8n-delay" as string]: "0.35s",
              filter: `url(#${glowId})`,
            }}
          />
          {branches.map((d, i) => (
            <g key={`run-${i}`}>
              <path
                className="n8n-edge-paint"
                d={d}
                pathLength={1}
                style={{ ["--n8n-delay" as string]: `${0.95 + i * 0.18}s` }}
              />
              <path
                className="n8n-edge-packet"
                d={d}
                style={{
                  ["--n8n-delay" as string]: `${0.95 + i * 0.18}s`,
                  filter: `url(#${glowId})`,
                }}
              />
            </g>
          ))}
        </svg>

        <article
          className="n8n-node absolute rounded-xl border border-zinc-200 bg-white p-3"
          style={{
            left: `${(start.x / 800) * 100}%`,
            top: `${(start.y / 420) * 100}%`,
            width: `${(start.w / 800) * 100}%`,
            ["--n8n-delay" as string]: "0s",
          }}
        >
          <span className="n8n-status absolute right-2 top-2 h-2 w-2 rounded-full bg-[#00c571]" />
          <p className="n8n-kind text-[9px] font-semibold uppercase tracking-wider text-zinc-400">
            Start
          </p>
          <p className="mt-1 text-xs text-zinc-700">Entrada</p>
        </article>

        <article
          className="n8n-node absolute rounded-xl border border-zinc-200 bg-white p-3"
          style={{
            left: `${(list.x / 800) * 100}%`,
            top: `${(list.y / 420) * 100}%`,
            width: `${(list.w / 800) * 100}%`,
            ["--n8n-delay" as string]: "0.7s",
          }}
        >
          <span className="n8n-status absolute right-2 top-2 h-2 w-2 rounded-full bg-[#00c571]" />
          <p className="n8n-kind text-[9px] font-semibold uppercase tracking-wider text-zinc-400">
            Send list
          </p>
          <p className="mt-1 text-xs font-medium text-zinc-800">FAQ Snap</p>
          <ul className="mt-2 space-y-1 text-[10px] text-zinc-500">
            <li>Horário</li>
            <li>Planos Snap</li>
            <li>Site e landing</li>
            <li>Automações</li>
            <li>Falar com consultor</li>
          </ul>
        </article>

        {FAQ_TARGETS.map((card, i) => (
          <article
            key={card.text}
            className="n8n-node absolute rounded-xl border border-zinc-200 bg-white p-3"
            style={{
              left: `${(rightX / 800) * 100}%`,
              top: `${(card.y / 420) * 100}%`,
              width: `${(rightW / 800) * 100}%`,
              height: `${(rightH / 420) * 100}%`,
              ["--n8n-delay" as string]: `${1.15 + i * 0.18}s`,
            }}
          >
            <span className="n8n-status absolute right-2 top-2 h-2 w-2 rounded-full bg-[#00c571]" />
            <p className="n8n-kind text-[9px] font-semibold uppercase tracking-wider text-zinc-400">
              {card.kind}
            </p>
            <p className="mt-1 text-[11px] leading-snug text-zinc-600">
              {card.text}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

export function BroadcastMock() {
  return (
    <div className="space-y-3 p-4">
      <div className="rounded-xl border border-white/10 bg-[#1A1A1A] p-3">
        <p className="text-[10px] font-medium uppercase tracking-wider text-[#FFDD00]">
          Modelo aprovado
        </p>
        <p className="mt-1 text-sm font-semibold text-white">apresentacao_snap</p>
        <p className="mt-2 text-xs leading-relaxed text-zinc-400">
          Olá {"{{1}}"}, aqui é o time Snap. Posso te mostrar o CRM no WhatsApp?
        </p>
      </div>
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#1A1A1A] px-3 py-2 text-xs">
        <span className="text-zinc-500">Público · revisão · envio</span>
        <span className="font-semibold text-white">Meta Cloud API</span>
      </div>
      <div className="rounded-xl bg-[#FFDD00] px-3 py-2 text-center text-xs font-medium text-[#1A1A1A]">
        Revisar e enviar
      </div>
    </div>
  );
}

export function InboxThreadMock() {
  return (
    <div className="grid min-h-[300px] md:grid-cols-[180px_1fr]">
      <div className="hidden border-r border-white/10 p-3 md:block">
        {["Maria Betânia", "Hotel Recife", "Grupo B2B"].map((name, i) => (
          <div
            key={name}
            className={`mb-1 rounded-lg px-2 py-2 ${i === 0 ? "bg-white/10" : ""}`}
          >
            <p className="text-xs font-medium text-white">{name}</p>
            <p className="truncate text-[10px] text-white/45">
              {i === 0 ? "Quero falar com o time" : "Sem resposta no radar"}
            </p>
          </div>
        ))}
      </div>
      <div className="bg-[#161614]">
        <LiveChat {...chatTheme} />
      </div>
    </div>
  );
}

export function AiHandoffMock() {
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
