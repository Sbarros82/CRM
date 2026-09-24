import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: "Termos de Uso — Snap",
  description:
    "Termos de uso do Snap CRM no WhatsApp: conta, responsabilidades, Meta Cloud API e limitações.",
  path: "/termos",
});

export default function TermosPage() {
  return (
    <LegalPage title="Termos de Uso" updated="24 de setembro de 2026">
      <p>
        Estes Termos regem o uso do <strong>Snap</strong> (
        <a href="https://snap.ia.br">snap.ia.br</a> /{" "}
        <a href="https://app.snap.ia.br">app.snap.ia.br</a>), CRM para times que
        atendem pelo WhatsApp Business.
      </p>

      <h2>1. Aceitação</h2>
      <p>
        Ao criar conta ou usar o serviço, você aceita estes Termos e a{" "}
        <a href="/privacidade">Política de Privacidade</a>. Se não concordar,
        não utilize o Snap.
      </p>

      <h2>2. O serviço</h2>
      <p>
        O Snap oferece inbox compartilhado, funil, fluxos, transmissões com
        templates Meta e recursos de triagem assistida por IA. O Snap{" "}
        <strong>não fecha vendas automaticamente</strong> e não inventa preços,
        prazos ou disponibilidade.
      </p>

      <h2>3. Conta e responsabilidades do cliente</h2>
      <ul>
        <li>Manter credenciais em sigilo e convidar apenas pessoas autorizadas.</li>
        <li>
          Usar número WhatsApp Business e tokens Meta de forma lícita, conforme
          as Políticas Comerciais do WhatsApp.
        </li>
        <li>
          Obter bases legais adequadas para contatar clientes (opt-in / janela
          de atendimento / templates aprovados).
        </li>
        <li>
          Ser o controlador dos dados dos seus contatos tratados no CRM da sua
          conta.
        </li>
      </ul>

      <h2>4. Meta e terceiros</h2>
      <p>
        Mensagens dependem da WhatsApp Cloud API da Meta. Indisponibilidade,
        limites de taxa, bloqueios de qualidade ou políticas da Meta estão fora
        do controle exclusivo do Snap. Você também concorda com os termos
        aplicáveis da Meta para WhatsApp Business.
      </p>

      <h2>5. Uso aceitável</h2>
      <p>É proibido usar o Snap para spam, fraude, conteúdo ilícito, burlar
        autenticação, ou violar direitos de terceiros e regras da Meta.</p>

      <h2>6. Disponibilidade e alterações</h2>
      <p>
        Podemos modificar, suspender ou descontinuar funcionalidades com aviso
        razoável quando possível. O serviço é oferecido &quot;no estado em que
        se encontra&quot;, sem garantia de disponibilidade ininterrupta.
      </p>

      <h2>7. Limitação de responsabilidade</h2>
      <p>
        Na máxima extensão permitida pela lei brasileira, o Snap não responde
        por lucros cessantes, perda de dados de terceiros (Meta/operadoras) ou
        danos indiretos decorrentes do uso do WhatsApp ou de configurações
        incorretas do cliente (token, webhook, PIN, templates).
      </p>

      <h2>8. Contato</h2>
      <p>
        Dúvidas:{" "}
        <a href="mailto:sbarros1982@gmail.com">sbarros1982@gmail.com</a>.
      </p>
    </LegalPage>
  );
}
