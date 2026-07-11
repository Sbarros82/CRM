# Snap — Sistema de CRM para WhatsApp

> Template de CRM auto-hospedável para WhatsApp® — caixa de entrada compartilhada, contatos, funis de vendas, disparos em massa e automações sem código. Faça um fork, coloque sua marca e hospede você mesmo.

<p align="center">
  <img src="./.github/assets/hostinger-deploy.png" alt="Envie seu app Node.js em um clique" width="900">
</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg)](./LICENSE)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3ecf8e?logo=supabase)](https://supabase.com)

Esta plataforma é o seu produto — clone ou faça um fork para rodar seu próprio CRM.

## Recursos inclusos de fábrica

- **Caixa de entrada compartilhada** conectada à API oficial do WhatsApp Cloud (WhatsApp Business API) — múltiplos agentes trabalhando no mesmo número, atribuição de conversas por agente, status e notas.
- **Contatos + tags + campos personalizados**, importação via CSV e desduplicação de contatos.
- **Funis de vendas (Kanban / Oleodutos)** com negócios (deals) integrados diretamente nas conversas do chat.
- **Transmissões (Broadcasts)** com envio em massa usando modelos aprovados pela Meta, acompanhamento de entrega/leitura e variáveis dinâmicas por destinatário.
- **Automações sem código (No-code)** — gatilhos baseados em mensagens recebidas, novos contatos, palavras-chave ou horários; ramificações condicionais, esperas, aplicação de tags e envio de webhooks. Construtor visual.
- **Painel de métricas em tempo real** — tempos de resposta, volume diário de mensagens, valor do funil de vendas e feed de atividades gerais.
- **Chat Interno** — Canais de comunicação e mensagens diretas (DMs) entre funcionários estilo Slack, com controle de presença online/offline.
- **Contas de equipe** — convide colaboradores por link com controle de acessos baseado em cargos (proprietário, administrador, agente, leitor). Toda a instalação é isolada por conta.
- **Gerenciamento de conta** — alteração de e-mail, senha, avatar e encerramento de sessão global.
- **API REST Pública** (`/api/v1`) com chaves de API revogáveis para você integrar e criar suas próprias automações externas.

## Por que fazer um Fork?

Como este é um **template open-source**, ao fazer o fork você ganha:

- **Propriedade Total** — seu código, seu projeto do Supabase, seu domínio e seus dados. Sem dependência de plataformas SaaS, cobrança por usuário ou preocupações com privacidade.
- **Customização Total** — adicione os campos que sua equipe precisa, remova os módulos que não usa e mude o design como quiser. A tecnologia é simples (Next.js + Supabase + Tailwind) para facilitar o desenvolvimento.
- **Segurança Robusta** — criptografia de tokens (AES-256-GCM), RLS (Row Level Security) em todas as tabelas do banco de dados, webhooks verificados por assinatura HMAC, CSP e controle de requisições (rate limiting).

---

## Início rápido

```bash
# Faça o fork primeiro no GitHub: https://github.com/Sbarros82/CRM → Fork
git clone https://github.com/<seu-usuario>/CRM.git
cd CRM/CRM
npm install
cp .env.local.example .env.local   # preencha com as credenciais do Supabase + Meta
npm run dev
```

Abra <http://localhost:3000>. Você será redirecionado para `/login` (ou `/dashboard` se já estiver logado).

## 🚀 Deploy no Vercel (Recomendado)

O projeto é totalmente compatível e otimizado para deploy na **Vercel** ou qualquer provedor de hospedagem Node.js (como Hostinger, Railway ou seu próprio servidor VPS).

### Deploy em 60 segundos na Vercel:

1. Faça o **Fork** deste repositório no seu GitHub.
2. Acesse o painel da **Vercel**, clique em **Add New** → **Project** e importe o repositório.
3. Defina o **Root Directory** como `CRM` (pasta onde está o código Next.js).
4. Copie as variáveis do seu arquivo `.env.local` e adicione no campo de **Environment Variables** da Vercel.
5. Clique em **Deploy**. A Vercel compilará e colocará seu CRM no ar de forma automática!

---

## Banco de Dados (Supabase)

Para aplicar as tabelas e lógicas do banco de dados:
1. Crie um projeto gratuito ou pago no **Supabase**.
2. Acesse o **SQL Editor** do Supabase.
3. Execute as migrations presentes na pasta `supabase/migrations/` em ordem numérica para preparar o seu banco de dados (inclusive a migration do Chat Interno `028_internal_chat.sql` e da sincronização de exclusão `029_chat_replica_identity.sql`).

## Stack Tecnológica

- **App** — Next.js 16 (App Router), React 19, TypeScript, Tailwind v4.
- **Dados** — Supabase (Postgres + Auth + Storage + RLS).
- **WhatsApp** — Meta Cloud API (API de nuvem oficial do WhatsApp Business).

## Licença

Distribuído sob a licença [MIT](./LICENSE). Sinta-se livre para clonar, colocar sua marca, hospedar e usar na sua empresa!
