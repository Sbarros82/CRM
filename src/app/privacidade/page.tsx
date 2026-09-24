import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: "Política de Privacidade — Snap",
  description:
    "Como o Snap trata dados pessoais no CRM WhatsApp: bases legais, retenção, direitos LGPD e contato do controlador.",
  path: "/privacidade",
});

export default function PrivacidadePage() {
  return (
    <LegalPage title="Política de Privacidade" updated="24 de setembro de 2026">
      <p>
        Esta Política descreve como o <strong>Snap</strong> (produto de CRM no
        WhatsApp operado em <strong>snap.ia.br</strong> /{" "}
        <strong>app.snap.ia.br</strong>) trata dados pessoais no Brasil, em
        conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº
        13.709/2018).
      </p>
      <p>
        Controlador: operação Snap sob responsabilidade de Sergio Barros —
        contato:{" "}
        <a href="mailto:sbarros1982@gmail.com">sbarros1982@gmail.com</a>.
      </p>

      <h2>1. Quais dados tratamos</h2>
      <ul>
        <li>
          <strong>Conta e equipe:</strong> nome, e-mail, papel na conta
          (owner/membro) e autenticação via Supabase Auth.
        </li>
        <li>
          <strong>WhatsApp Business:</strong> identificadores da Meta (Phone
          Number ID, WABA), mensagens enviadas/recebidas pelo número oficial da
          empresa, status de entrega e templates aprovados.
        </li>
        <li>
          <strong>CRM:</strong> contatos, conversas, notas, negócios no funil,
          agendamentos e configurações de automação/fluxo.
        </li>
        <li>
          <strong>Técnicos:</strong> logs de aplicação, IP em rate-limits e
          metadados necessários à segurança do serviço.
        </li>
      </ul>

      <h2>2. Para que usamos</h2>
      <ul>
        <li>Prestar o serviço de inbox, funil, fluxos e atendimento no WhatsApp.</li>
        <li>Autenticar usuários e proteger a conta contra acesso indevido.</li>
        <li>
          Cumprir obrigações com a plataforma Meta WhatsApp Cloud API e
          políticas comerciais aplicáveis.
        </li>
        <li>Melhorar estabilidade, suporte e conformidade (LGPD).</li>
      </ul>

      <h2>3. Bases legais</h2>
      <p>
        Tratamos dados com base em execução de contrato / procedimentos
        preliminares (prestação do CRM), legítimo interesse (segurança e
        melhoria do produto, com impacto mínimo aos titulares) e cumprimento de
        obrigação legal quando aplicável.
      </p>

      <h2>4. Compartilhamento</h2>
      <ul>
        <li>
          <strong>Meta Platforms</strong> — envio e recebimento de mensagens
          WhatsApp Business via Cloud API.
        </li>
        <li>
          <strong>Supabase</strong> — banco, autenticação e armazenamento da
          aplicação.
        </li>
        <li>
          <strong>Vercel</strong> — hospedagem da aplicação web e webhooks.
        </li>
        <li>
          Prestadores de IA (quando habilitados pelo cliente) — apenas o
          conteúdo necessário para gerar respostas de triagem; o Snap não usa
          a IA para fechar venda nem inventar preços.
        </li>
      </ul>
      <p>Não vendemos dados pessoais.</p>

      <h2>5. Retenção</h2>
      <p>
        Mantemos os dados enquanto a conta estiver ativa e pelo tempo necessário
        às finalidades acima, inclusive backups e obrigações legais. O owner
        pode exportar ou solicitar anonimização em{" "}
        <a href="https://app.snap.ia.br/settings?tab=privacy">
          Configurações → Privacidade
        </a>
        .
      </p>

      <h2>6. Direitos do titular (LGPD)</h2>
      <p>
        Você pode solicitar confirmação de tratamento, acesso, correção,
        anonimização, portabilidade, eliminação (quando cabível) e informação
        sobre compartilhamentos. Pedidos:{" "}
        <a href="mailto:sbarros1982@gmail.com">sbarros1982@gmail.com</a> ou pela
        página de{" "}
        <a href="/exclusao-de-dados">exclusão de dados</a>.
      </p>

      <h2>7. Segurança</h2>
      <p>
        Tokens da Meta são armazenados criptografados; webhooks validam
        assinatura HMAC; acesso ao CRM exige autenticação. Nenhum método é
        absoluto — reportamos incidentes relevantes conforme a LGPD.
      </p>

      <h2>8. Alterações</h2>
      <p>
        Podemos atualizar esta política. A data no topo indica a versão
        vigente. Uso continuado após a publicação implica ciência das mudanças
        materiais.
      </p>
    </LegalPage>
  );
}
