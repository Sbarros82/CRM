/**
 * Starter flow templates.
 *
 * Three pre-canned flows users can clone with one click instead of
 * building from scratch. Each template is a plain JS object describing
 * the same shape `/api/flows` PUT accepts — name, trigger config,
 * entry_node_id, fallback_policy, nodes[] — keyed by a stable
 * `slug`.
 *
 * The clone path (`/api/flows` POST with `template_slug`) creates a
 * NEW flow_row + flow_nodes rows for the user. `node_key`s are kept
 * verbatim (they're stable strings, not UUIDs, so cloning never
 * needs to rewrite edge references).
 *
 * Choosing a single static module over a DB-backed gallery for v1
 * because: (a) the set is small and changes with code releases, not
 * data; (b) keeps templates portable across self-hosted instances
 * without migrations; (c) editing in source is the lowest-friction
 * way to add the next template.
 */

import type {
  CollectInputNodeConfig,
  ConditionNodeConfig,
  HandoffNodeConfig,
  KeywordTriggerConfig,
  SendButtonsNodeConfig,
  SendListNodeConfig,
  SendMessageNodeConfig,
  StartNodeConfig,
} from "./types";

export type FlowTemplateNodeType =
  | "start"
  | "send_message"
  | "send_buttons"
  | "send_list"
  | "collect_input"
  | "condition"
  | "set_tag"
  | "handoff"
  | "end";

export interface FlowTemplateNode {
  node_key: string;
  node_type: FlowTemplateNodeType;
  config:
    | StartNodeConfig
    | SendMessageNodeConfig
    | SendButtonsNodeConfig
    | SendListNodeConfig
    | CollectInputNodeConfig
    | ConditionNodeConfig
    | HandoffNodeConfig
    | Record<string, unknown>;
}

export interface FlowTemplate {
  slug: string;
  name: string;
  description: string;
  /** Used by the gallery to surface a relevant icon. lucide-react name. */
  icon: "MessageSquare" | "HelpCircle" | "UserPlus";
  trigger_type: "keyword" | "first_inbound_message" | "manual";
  trigger_config: KeywordTriggerConfig | Record<string, unknown>;
  entry_node_id: string;
  nodes: FlowTemplateNode[];
}

// ============================================================
// 1. Welcome menu
// ============================================================
const WELCOME_MENU: FlowTemplate = {
  slug: "welcome_menu",
  name: "Menu de boas-vindas",
  description:
    "Quem digita uma palavra-chave escolhe se já é cliente ou se é novo, e o atendimento vai para a fila.",
  icon: "MessageSquare",
  trigger_type: "keyword",
  trigger_config: {
    keywords: ["suporte", "atendimento"],
    match_type: "contains",
  },
  entry_node_id: "start",
  nodes: [
    {
      node_key: "start",
      node_type: "start",
      config: { next_node_key: "welcome" },
    },
    {
      node_key: "welcome",
      node_type: "send_buttons",
      config: {
        text: "Olá! 👋 Bem-vindo ao atendimento. Você já é cliente ou está conhecendo agora?",
        footer_text: "Toque em um botão para continuar.",
        buttons: [
          {
            reply_id: "existing",
            title: "Já sou cliente",
            next_node_key: "existing_handoff",
          },
          {
            reply_id: "new",
            title: "Sou novo",
            next_node_key: "new_handoff",
          },
        ],
      } as SendButtonsNodeConfig,
    },
    {
      node_key: "existing_handoff",
      node_type: "handoff",
      config: {
        note: "Cliente atual pediu suporte — conferir o histórico antes de responder.",
      } as HandoffNodeConfig,
    },
    {
      node_key: "new_handoff",
      node_type: "handoff",
      config: {
        note: "Cliente novo — apresentar Snap, site/landing e automações.",
      } as HandoffNodeConfig,
    },
  ],
};

// ============================================================
// 2. FAQ Snap — list-message answers
// ============================================================
const FAQ_BOT: FlowTemplate = {
  slug: "faq_bot",
  name: "FAQ Snap",
  description:
    "Menu em português: horário, planos do Snap, site/landing, automações e consultor. Dispara com menu, faq ou dúvida.",
  icon: "HelpCircle",
  trigger_type: "keyword",
  trigger_config: {
    keywords: ["menu", "faq", "dúvida", "duvida", "assuntos"],
    match_type: "contains",
  },
  entry_node_id: "start",
  nodes: [
    {
      node_key: "start",
      node_type: "start",
      config: { next_node_key: "topics" },
    },
    {
      node_key: "topics",
      node_type: "send_list",
      config: {
        text: "Olá! Escolha um assunto. Se preferir conversar, é só escrever — a equipe ou a IA te atende.",
        button_label: "Ver assuntos",
        sections: [
          {
            title: "Perguntas frequentes",
            rows: [
              {
                reply_id: "hours",
                title: "Horário",
                description: "Atendimento comercial",
                next_node_key: "answer_hours",
              },
              {
                reply_id: "pricing",
                title: "Planos Snap",
                description: "CRM no WhatsApp",
                next_node_key: "answer_pricing",
              },
              {
                reply_id: "landing",
                title: "Site e landing",
                description: "Páginas e captura",
                next_node_key: "answer_landing",
              },
              {
                reply_id: "automations",
                title: "Automações",
                description: "Fluxos e integração",
                next_node_key: "answer_automations",
              },
            ],
          },
          {
            title: "Atendimento",
            rows: [
              {
                reply_id: "human",
                title: "Falar com consultor",
                next_node_key: "human_handoff",
              },
            ],
          },
        ],
      } as SendListNodeConfig,
    },
    {
      node_key: "answer_hours",
      node_type: "send_message",
      config: {
        text: "Atendimento comercial: segunda a sexta, 9h às 18h (horário de Brasília). Fora disso podemos orientar por aqui e um consultor retoma no próximo horário útil. Digite *menu* para ver os assuntos de novo.",
        next_node_key: "end",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "answer_pricing",
      node_type: "send_message",
      config: {
        text: "Snap CRM (WhatsApp oficial, Cloud API da Meta), por conta:\n• Start R$ 297/mês — 1 número, até 3 usuários\n• Grow R$ 497/mês — até 8 usuários + IA e automações (mais comum)\n• Scale R$ 897/mês — até 15 usuários\nImplantação única R$ 1.990.\nDesconto anual e contrato fecha um consultor. Digite *menu* ou escolha Falar com consultor.",
        next_node_key: "end",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "answer_landing",
      node_type: "send_message",
      config: {
        text: "Também fazemos landing pages e sites de captura (formulário, WhatsApp, Pixel), sob medida. O valor depende das páginas e do prazo — o consultor monta a proposta. Digite *menu* ou Falar com consultor.",
        next_node_key: "end",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "answer_automations",
      node_type: "send_message",
      config: {
        text: "Montamos automações no WhatsApp: fluxos, integração de formulário/CRM e follow-up. Sem preço fixo aqui — o consultor orça conforme o que hoje é manual. Digite *menu* ou Falar com consultor.",
        next_node_key: "end",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "human_handoff",
      node_type: "handoff",
      config: {
        note: "Pediu consultor pelo menu FAQ Snap.",
      } as HandoffNodeConfig,
    },
    {
      node_key: "end",
      node_type: "end",
      config: {},
    },
  ],
};

// ============================================================
// 3. Lead capture
// ============================================================
const LEAD_CAPTURE: FlowTemplate = {
  slug: "lead_capture",
  name: "Captura de lead",
  description:
    "Na primeira mensagem pede nome, e-mail e empresa e passa para o comercial com os dados na nota.",
  icon: "UserPlus",
  trigger_type: "first_inbound_message",
  trigger_config: {},
  entry_node_id: "start",
  nodes: [
    {
      node_key: "start",
      node_type: "start",
      config: { next_node_key: "intro" },
    },
    {
      node_key: "intro",
      node_type: "send_message",
      config: {
        text: "Olá! 👋 Vou fazer três perguntas rápidas para te passar à pessoa certa.",
        next_node_key: "ask_name",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "ask_name",
      node_type: "collect_input",
      config: {
        prompt_text: "Qual é o seu nome?",
        var_key: "name",
        next_node_key: "ask_email",
      } as CollectInputNodeConfig,
    },
    {
      node_key: "ask_email",
      node_type: "collect_input",
      config: {
        prompt_text: "Obrigado, {{vars.name}}! Qual é o seu e-mail de trabalho?",
        var_key: "email",
        next_node_key: "ask_company",
      } as CollectInputNodeConfig,
    },
    {
      node_key: "ask_company",
      node_type: "collect_input",
      config: {
        prompt_text: "Por último: qual é o nome da empresa?",
        var_key: "company",
        next_node_key: "handoff",
      } as CollectInputNodeConfig,
    },
    {
      node_key: "handoff",
      node_type: "handoff",
      config: {
        note: "Lead novo — nome={{vars.name}}, e-mail={{vars.email}}, empresa={{vars.company}}.",
      } as HandoffNodeConfig,
    },
  ],
};

// ============================================================
// Registry
// ============================================================

const TEMPLATES: Record<string, FlowTemplate> = {
  welcome_menu: WELCOME_MENU,
  faq_bot: FAQ_BOT,
  lead_capture: LEAD_CAPTURE,
};

export function getFlowTemplate(slug: string): FlowTemplate | null {
  return TEMPLATES[slug] ?? null;
}

export function listFlowTemplates(): FlowTemplate[] {
  return Object.values(TEMPLATES);
}
