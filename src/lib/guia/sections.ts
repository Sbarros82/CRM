export interface GuideLink {
  href: string
  label: string
}

export interface GuideSection {
  id: string
  title: string
  summary: string
  body: string[]
  links: GuideLink[]
}

export const DAILY_RITUAL: {
  step: string
  title: string
  href: string
  text: string
}[] = [
  {
    step: '1',
    title: 'Inbox',
    href: '/inbox',
    text: 'Responda quem escreveu agora. Atribua a conversa a um agente se trabalham em equipe.',
  },
  {
    step: '2',
    title: 'Radar',
    href: '/radar',
    text: 'Veja quem ficou sem resposta. Abra a conversa e retome o atendimento.',
  },
  {
    step: '3',
    title: 'Funil',
    href: '/pipelines',
    text: 'Se o cliente avançou (orçamento, reserva, pagamento), mova o negócio de etapa.',
  },
  {
    step: '4',
    title: 'Agenda',
    href: '/appointments',
    text: 'Marque retorno, vistoria, embarque ou ligação. Nada fica só na memória.',
  },
]

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'whatsapp',
    title: 'WhatsApp da empresa',
    summary: 'O Snap é o WhatsApp comercial. O cliente escreve para o número ligado nas configurações.',
    body: [
      'Atenda pelo Snap, não pelo WhatsApp Web do número da empresa. Esse número está na Cloud API: a conversa comercial vive no Inbox.',
      'Texto livre, foto e áudio só funcionam nas 24 horas depois da última mensagem do cliente. Fora dessa janela o compositor pede um modelo aprovado — cadastre em Configurações → Modelos e sincronize com a Meta.',
      'Se o cliente mandar PARAR, SAIR, STOP ou CANCELAR, o Snap marca opt-out e bloqueia novos envios. VOLTAR ou START reabre. Respeite isso: é LGPD e regra da Meta.',
      'Transmissão e modelo de marketing não substituem o atendimento. Use modelo para reabrir conversa fria; use o Inbox para negociar.',
    ],
    links: [
      { href: '/inbox', label: 'Abrir Inbox' },
      { href: '/settings?tab=whatsapp', label: 'WhatsApp' },
      { href: '/settings?tab=templates', label: 'Modelos' },
    ],
  },
  {
    id: 'inbox',
    title: 'Inbox — o coração do Snap',
    summary: 'Toda mensagem entra aqui. Use o painel da direita para não perder o contexto do cliente.',
    body: [
      'Lista à esquerda, conversa no centro, ficha do contato à direita (telefone, etiquetas, notas, negócios, opt-out).',
      'Atribua o atendimento a um agente no topo da conversa. Assim ninguém responde em duplicata.',
      'Se a IA estiver ligada, pause nela nesta conversa quando um humano assumir (botão IA on / IA off). Qualquer resposta sua também pausa a IA naquela thread.',
      'Feche ou arquive só quando o assunto acabou. Conversas abertas e paradas aparecem no Radar.',
    ],
    links: [{ href: '/inbox', label: 'Ir ao Inbox' }],
  },
  {
    id: 'crm',
    title: 'Contatos, funil e agenda',
    summary: 'WhatsApp sozinho não é CRM. Grave o negócio e o próximo passo.',
    body: [
      'Contatos nascem sozinhos quando alguém manda a primeira mensagem. Complete nome, etiquetas e notas na ficha — isso alimenta busca, automações e transmissões.',
      'Importe uma lista em Contatos se já tiver base (CSV). Confira duplicata de telefone antes: o Snap une pelo número.',
      'No Funil, crie um negócio ligado ao contato. Etapas padrão: Novo Lead → Qualificado → Proposta → Negociação → Ganho. Arraste o card quando o status mudar.',
      'Na Agenda, marque o compromisso no contato certo e, se quiser, atribua a um membro. Use isso para retorno comercial, não só para “lembrar depois”.',
    ],
    links: [
      { href: '/contacts', label: 'Contatos' },
      { href: '/pipelines', label: 'Funil' },
      { href: '/appointments', label: 'Agenda' },
    ],
  },
  {
    id: 'radar',
    title: 'Radar de follow-up',
    summary: 'Lista conversas abertas à espera de resposta — o antídoto para lead que esfria.',
    body: [
      'O intervalo (em horas) fica em Configurações → Agente de IA, mesmo se a IA estiver desligada. 24h é um bom começo; em alta temporada, 4–8h.',
      'Abra o Radar no começo e no fim do expediente. Cada item leva direto à conversa no Inbox.',
      'Se o cliente já foi respondido e o assunto morreu, encerre a conversa para ela sair do Radar.',
    ],
    links: [
      { href: '/radar', label: 'Abrir Radar' },
      { href: '/settings?tab=ai', label: 'Ajustar horas' },
    ],
  },
  {
    id: 'broadcasts',
    title: 'Transmissões',
    summary: 'Aviso em massa só com modelo aprovado, lista filtrada e respeito ao opt-out.',
    body: [
      'Use para novidade, lembrete ou campanha — nunca para responder um cliente específico.',
      'Filtre por etiqueta (ex.: “quente”, “embarque”, “inativo”). Teste primeiro em um contato seu.',
      'A Meta cobra conversa iniciada pela empresa. Sem modelo aprovado ou com cartão/pagamento pendente, a transmissão falha mesmo com “enviado”.',
      'Quem pediu para sair não recebe. Não tente furar o opt-out.',
    ],
    links: [{ href: '/broadcasts', label: 'Transmissões' }],
  },
  {
    id: 'automations',
    title: 'Automações e fluxos',
    summary: 'Deixe o repetitivo no piloto. O julgamento comercial fica com o humano.',
    body: [
      'Comece por uma automação de boas-vindas (primeira mensagem) e, se precisar, fora do expediente. Há modelos prontos em Automações → Nova.',
      'Fluxo de palavra-chave (ex.: “menu”) e IA podem ficar ligados juntos: na mensagem do menu a IA não responde; no resto da conversa a IA atende. Evite boas-vindas automáticas + fluxo de primeira mensagem + IA no mesmo “oi”.',
      'Fluxos servem para menu (botões/listas), FAQ e handoff para o Inbox. Depois de “Falar com consultor”, a IA pausa naquela conversa.',
      'Toda automação que envia WhatsApp respeita a janela de 24h e o opt-out, igual ao Inbox.',
    ],
    links: [
      { href: '/automations', label: 'Automações' },
      { href: '/flows', label: 'Fluxos' },
    ],
  },
  {
    id: 'ai',
    title: 'Agente de IA',
    summary: 'Opcional. Só ligue com prompt claro, em português, e handoff para humano.',
    body: [
      'Em Configurações → Agente de IA: chave da OpenAI (ou provedor escolhido), prompt do negócio e interruptor ligado.',
      'O prompt deve dizer quem vocês são, o que podem responder, o que não podem inventar (preço, voucher, disponibilidade) e quando passar para um humano.',
      'O cliente pedindo “atendente” ou a própria IA pedindo handoff pausa a IA naquela conversa. Você também pausa no Inbox.',
      'Deixe a IA desligada até o Inbox e o funil estarem no ritmo. Ela não substitui o Radar nem a atribuição de agente.',
    ],
    links: [{ href: '/settings?tab=ai', label: 'Configurar IA' }],
  },
  {
    id: 'team',
    title: 'Equipe, segurança e LGPD',
    summary: 'Papéis claros, chat interno para o time, dados do cliente sob controle.',
    body: [
      'Convide em Configurações → Membros. Owner e admin configuram WhatsApp e time; agente atende; viewer só vê.',
      'Use o Chat interno para passar contexto (“fulano quer remarcar o dia 20”) — não use o WhatsApp do cliente para falar entre vocês.',
      'Ative MFA em Login e segurança. Há registro de auditoria (exportar dados, apagar, pausar IA, opt-out).',
      'Privacidade: o cliente pode pedir cópia ou exclusão dos dados. Owner exporta ou apaga em Configurações → Privacidade.',
    ],
    links: [
      { href: '/settings?tab=members', label: 'Membros' },
      { href: '/chat', label: 'Chat interno' },
      { href: '/settings?tab=privacy', label: 'Privacidade' },
      { href: '/settings?tab=security', label: 'Segurança' },
    ],
  },
]

export const WEEK_ONE: string[] = [
  'Confirme em Configurações → WhatsApp que o número comercial está Conectado.',
  'Peça para um colega (ou seu celular pessoal) mandar “oi” para esse número e responda só pelo Inbox.',
  'Crie etiquetas que vocês já usam no dia a dia (ex.: orçamento, pago, embarque, suporte).',
  'Abra o Funil e crie um negócio de teste; arraste até Ganho para ver o Painel atualizar.',
  'Cadastre pelo menos um modelo de utilidade na Meta (ex.: “estamos no prazo, responda para retomar”) e sincronize em Modelos.',
  'Olhe o Radar no fim do primeiro dia — deve estar vazio se ninguém ficou sem resposta.',
]
