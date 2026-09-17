"use client";

import { motion } from "framer-motion";
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

export function FunilBoardMock() {
  const cols = [
    { name: "New Lead", color: "#3b82f6", item: "Maria Betânia Martins" },
    { name: "Qualified", color: "#f59e0b", item: null },
    { name: "Proposal Sent", color: "#f97316", item: null },
    { name: "Negotiation", color: "#a855f7", item: null },
    { name: "Won", color: "#22c55e", item: null },
  ];
  return (
    <div className="overflow-x-auto bg-[#f6f4ef] p-3">
      <div className="mb-3 flex flex-wrap gap-2 text-[10px] text-zinc-500">
        {[
          "Total 1",
          "Pipeline R$ —",
          "Ticket médio",
          "Valor ponderado",
          "Ganhos este mês 0",
        ].map((label) => (
          <span
            key={label}
            className="rounded-full border border-zinc-200 bg-white px-2 py-1"
          >
            {label}
          </span>
        ))}
      </div>
      <div className="flex min-w-[640px] gap-2">
        {cols.map((col, i) => (
          <motion.div
            key={col.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07 }}
            className="w-36 shrink-0 rounded-xl border border-zinc-200 bg-white"
          >
            <div className="h-1 rounded-t-xl" style={{ background: col.color }} />
            <p className="px-2.5 pt-2 text-[11px] font-medium text-zinc-700">
              {col.name}
            </p>
            <p className="px-2.5 pb-2 text-[10px] text-zinc-400">R$ 0</p>
            <div className="px-2 pb-2">
              {col.item ? (
                <motion.div
                  initial={{ scale: 0.92, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  className="rounded-lg border border-zinc-100 bg-[#f6f4ef] px-2 py-2"
                >
                  <p className="text-[11px] font-medium text-zinc-800">
                    {col.item}
                  </p>
                  <p className="text-[10px] text-zinc-400">WhatsApp</p>
                </motion.div>
              ) : (
                <div className="rounded-lg border border-dashed border-zinc-200 px-2 py-4 text-center text-[10px] text-zinc-400">
                  Arraste um negócio
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function FlowCanvasMock() {
  return (
    <div className="relative overflow-hidden bg-[#f6f4ef] px-3 py-8 sm:px-6">
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden
      >
        <motion.path
          d="M90 120 C 160 120, 160 80, 230 80"
          fill="none"
          stroke="#c4b5a5"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1 }}
        />
        <motion.path
          d="M330 90 C 400 90, 400 50, 470 40"
          fill="none"
          stroke="#c4b5a5"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, delay: 0.15 }}
        />
        <motion.path
          d="M330 140 C 400 140, 400 200, 470 210"
          fill="none"
          stroke="#c4b5a5"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, delay: 0.25 }}
        />
      </svg>
      <div className="relative flex flex-col items-center gap-6 md:flex-row md:items-start md:justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-8 w-[120px] rounded-xl border border-zinc-200 bg-white p-3 shadow-sm"
        >
          <p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-600">
            Start
          </p>
          <p className="mt-1 text-xs text-zinc-700">Entrada</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.12 }}
          className="w-[200px] rounded-xl border border-zinc-200 bg-white p-3 shadow-sm"
        >
          <p className="text-[9px] font-semibold uppercase tracking-wider text-violet-500">
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
        </motion.div>
        <div className="flex w-[220px] flex-col gap-2">
          {[
            ["Send message", "Atendimento: seg a sex, 9h–18h"],
            ["Send message", "Planos — consultor fecha o valor"],
            ["Send message", "Landing e site de captura"],
            ["Send message", "Automações e handoff no CRM"],
            ["Handoff", "Pediu consultor → Inbox"],
          ].map(([kind, text], i) => (
            <motion.div
              key={text}
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.18 + i * 0.1 }}
              className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm"
            >
              <p className="text-[9px] font-semibold uppercase tracking-wider text-violet-500">
                {kind}
              </p>
              <p className="mt-1 text-[11px] text-zinc-600">{text}</p>
            </motion.div>
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
