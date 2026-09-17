"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { LayoutGroup, motion, useInView } from "framer-motion";
import LiveChat from "@/components/originkit/live-chat";

const chatTheme = {
  sentBubbleColor: "#FFDD00",
  sentTextColor: "#1A1A1A",
  receivedBubbleColor: "#2A2A24",
  receivedTextColor: "#F4F4EC",
} as const;

const CHART_DAYS = [
  { d: "Seg", in: 18, out: 10 },
  { d: "Ter", in: 24, out: 14 },
  { d: "Qua", in: 16, out: 12 },
  { d: "Qui", in: 32, out: 20 },
  { d: "Sex", in: 28, out: 22 },
  { d: "Sáb", in: 12, out: 6 },
  { d: "Dom", in: 8, out: 4 },
] as const;

export function DashboardMock() {
  const kpis = [
    { label: "Conversas ativas", value: "2", hint: "Abertas e pendentes" },
    { label: "Contatos hoje", value: "0", hint: "Quem falou hoje" },
    { label: "Negócios abertos", value: "1", hint: "No funil agora" },
    { label: "Msgs enviadas", value: "—", hint: "Time + IA" },
  ];
  const maxBar = Math.max(...CHART_DAYS.flatMap((x) => [x.in, x.out]));

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
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-medium text-zinc-500">
            Mensagens na semana
          </p>
          <div className="flex gap-3 text-[10px] text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-[#67885d]" />
              Recebidas
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-[#7c6cf0]" />
              Enviadas
            </span>
          </div>
        </div>
        <div className="mt-3 flex h-28 items-end gap-2 sm:gap-3">
          {CHART_DAYS.map((day, i) => (
            <div key={day.d} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div className="flex h-24 w-full items-end justify-center gap-0.5 sm:gap-1">
                <motion.div
                  className="w-[42%] max-w-[18px] origin-bottom rounded-t-sm bg-[#67885d]"
                  style={{ height: `${(day.in / maxBar) * 100}%` }}
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{
                    delay: 0.12 * i,
                    duration: 0.7,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />
                <motion.div
                  className="w-[42%] max-w-[18px] origin-bottom rounded-t-sm bg-[#7c6cf0]"
                  style={{ height: `${(day.out / maxBar) * 100}%` }}
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{
                    delay: 0.12 * i + 0.08,
                    duration: 0.7,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />
              </div>
              <span className="text-[9px] text-zinc-400">{day.d}</span>
            </div>
          ))}
        </div>
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

type Port = { x: number; y: number };

function bezierDock(a: Port, b: Port) {
  const dx = Math.max(36, Math.abs(b.x - a.x) * 0.42);
  return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
}

function portCenter(wrap: DOMRect, el: HTMLElement | null): Port | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    x: r.left - wrap.left + r.width / 2,
    y: r.top - wrap.top + r.height / 2,
  };
}

const FAQ_TARGETS = [
  { kind: "Send message", text: "Atendimento: seg a sex, 9h–18h" },
  { kind: "Send message", text: "Planos — consultor fecha o valor" },
  { kind: "Send message", text: "Landing e site de captura" },
  { kind: "Send message", text: "Automações e handoff no CRM" },
  { kind: "Handoff", text: "Pediu consultor → Inbox" },
] as const;

const FAQ_ITEMS = [
  "Horário",
  "Planos Snap",
  "Site e landing",
  "Automações",
  "Falar com consultor",
] as const;

function FlowPort({
  side,
  portRef,
}: {
  side: "left" | "right";
  portRef: (el: HTMLSpanElement | null) => void;
}) {
  return (
    <span
      ref={portRef}
      className="absolute top-1/2 z-[2] h-2.5 w-2.5 rounded-full border-2 border-[#00c571] bg-white"
      style={{
        left: side === "left" ? 0 : "auto",
        right: side === "right" ? 0 : "auto",
        transform:
          side === "right" ? "translate(50%, -50%)" : "translate(-50%, -50%)",
      }}
    />
  );
}

export function FlowCanvasMock() {
  const rootRef = useRef<HTMLDivElement>(null);
  const running = useInView(rootRef, { once: true, amount: 0.35 });
  const glowId = useId().replace(/:/g, "");
  const startOutRef = useRef<HTMLSpanElement>(null);
  const listInRef = useRef<HTMLSpanElement>(null);
  const listOutRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const rightInRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [paths, setPaths] = useState<string[]>([]);

  useLayoutEffect(() => {
    const wrap = rootRef.current;
    if (!wrap) return;

    const measure = () => {
      const box = wrap.getBoundingClientRect();
      const trunkFrom = portCenter(box, startOutRef.current);
      const trunkTo = portCenter(box, listInRef.current);
      const next: string[] = [];
      if (trunkFrom && trunkTo) next.push(bezierDock(trunkFrom, trunkTo));
      FAQ_TARGETS.forEach((_, i) => {
        const from = portCenter(box, listOutRefs.current[i] ?? null);
        const to = portCenter(box, rightInRefs.current[i] ?? null);
        if (from && to) next.push(bezierDock(from, to));
      });
      setPaths(next);
    };

    measure();
    const raf = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [running]);

  const trunk = paths[0];
  const branches = paths.slice(1);

  return (
    <div
      ref={rootRef}
      className={`relative overflow-hidden bg-[#f6f4ef] ${running ? "n8n-running" : ""}`}
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden
      >
        <defs>
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {paths.map((d) => (
          <path key={`idle-${d}`} className="n8n-edge-idle" d={d} />
        ))}
        {trunk ? (
          <>
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
          </>
        ) : null}
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

      <div className="relative z-[1] grid grid-cols-[minmax(7.5rem,0.85fr)_minmax(10rem,1fr)_minmax(12rem,1.4fr)] items-stretch gap-8 px-6 py-8 sm:gap-12 sm:px-10 sm:py-10">
        <article
          className="n8n-node relative self-center rounded-xl border border-zinc-200 bg-white p-3"
          style={{ ["--n8n-delay" as string]: "0s" }}
        >
          <span className="n8n-status absolute right-2 top-2 h-2 w-2 rounded-full bg-[#00c571]" />
          <FlowPort
            side="right"
            portRef={(el) => {
              startOutRef.current = el;
            }}
          />
          <p className="n8n-kind text-[9px] font-semibold uppercase tracking-wider text-zinc-400">
            Start
          </p>
          <p className="mt-1 text-xs text-zinc-700">Entrada</p>
        </article>

        <article
          className="n8n-node relative flex flex-col rounded-xl border border-zinc-200 bg-white p-3"
          style={{ ["--n8n-delay" as string]: "0.7s" }}
        >
          <span className="n8n-status absolute right-2 top-2 h-2 w-2 rounded-full bg-[#00c571]" />
          <FlowPort
            side="left"
            portRef={(el) => {
              listInRef.current = el;
            }}
          />
          <p className="n8n-kind text-[9px] font-semibold uppercase tracking-wider text-zinc-400">
            Send list
          </p>
          <p className="mt-1 text-xs font-medium text-zinc-800">FAQ Snap</p>
          <ul className="mt-2 flex flex-1 flex-col justify-evenly">
            {FAQ_ITEMS.map((item, i) => (
              <li
                key={item}
                className="relative py-1.5 pr-2 text-[10px] text-zinc-500"
              >
                {item}
                <FlowPort
                  side="right"
                  portRef={(el) => {
                    listOutRefs.current[i] = el;
                  }}
                />
              </li>
            ))}
          </ul>
        </article>

        <div className="flex flex-col gap-2.5">
          {FAQ_TARGETS.map((card, i) => (
            <article
              key={card.text}
              className="n8n-node relative rounded-xl border border-zinc-200 bg-white px-3 py-2.5"
              style={{ ["--n8n-delay" as string]: `${1.15 + i * 0.18}s` }}
            >
              <span className="n8n-status absolute right-2 top-2 h-2 w-2 rounded-full bg-[#00c571]" />
              <FlowPort
                side="left"
                portRef={(el) => {
                  rightInRefs.current[i] = el;
                }}
              />
              <p className="n8n-kind text-[9px] font-semibold uppercase tracking-wider text-zinc-400">
                {card.kind}
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-zinc-600">
                {card.text}
              </p>
            </article>
          ))}
        </div>
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
