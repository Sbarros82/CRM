import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: "Exclusão de dados do usuário — Snap",
  description:
    "Como solicitar exclusão ou anonimização de dados pessoais no Snap (LGPD / Meta User Data Deletion).",
  path: "/exclusao-de-dados",
});

export default function ExclusaoDadosPage() {
  return (
    <LegalPage title="Exclusão de dados do usuário" updated="24 de setembro de 2026">
      <p>
        Esta página cumpre o requisito da Meta de{" "}
        <strong>instruções de exclusão de dados do usuário</strong> e os
        direitos da LGPD.
      </p>

      <h2>1. Usuários da conta Snap (login)</h2>
      <ul>
        <li>
          Owner: em{" "}
          <a href="https://app.snap.ia.br/settings?tab=privacy">
            Configurações → Privacidade
          </a>{" "}
          pode exportar os dados da conta ou anonimizar contatos/mensagens.
        </li>
        <li>
          Para apagar a conta de um membro ou encerrar o workspace, envie e-mail
          para{" "}
          <a href="mailto:sbarros1982@gmail.com">sbarros1982@gmail.com</a> com o
          assunto <strong>Exclusão de dados Snap</strong>, informando o e-mail
          de login.
        </li>
      </ul>

      <h2>2. Clientes finais (contatos no WhatsApp)</h2>
      <p>
        Quem opera o número WhatsApp no Snap é o controlador desses dados. O
        titular pode pedir exclusão ao negócio que o atendeu; o owner do Snap
        executa a anonimização pelo painel de Privacidade ou solicita suporte
        pelo e-mail acima.
      </p>

      <h2>3. Dados na Meta / Facebook Login</h2>
      <p>
        Se você autorizou o app <strong>Snap.crm</strong> (ID 1754796272495288)
        via Meta, também pode remover o app em{" "}
        <a
          href="https://www.facebook.com/settings?tab=applications"
          rel="noopener noreferrer"
          target="_blank"
        >
          Configurações do Facebook → Aplicativos
        </a>
        . Em seguida, peça a exclusão residual pelo e-mail do Snap.
      </p>

      <h2>4. Prazo</h2>
      <p>
        Confirmamos o pedido em até <strong>15 dias</strong> úteis e concluímos
        a exclusão/anonimização em até <strong>30 dias</strong>, salvo retenção
        legal obrigatória (ex.: registros fiscais ou segurança).
      </p>

      <h2>5. Contato</h2>
      <p>
        <a href="mailto:sbarros1982@gmail.com">sbarros1982@gmail.com</a>
        <br />
        Política completa: <a href="/privacidade">/privacidade</a>
      </p>
    </LegalPage>
  );
}
