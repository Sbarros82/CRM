"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, Loader2, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { SettingsPanelHead } from "./settings-panel-head";
import { AuditLogPanel } from "./audit-log-panel";

export function PrivacyPanel() {
  const { accountRole } = useAuth();
  const isOwner = accountRole === "owner";
  const [confirm, setConfirm] = useState("");
  const [exporting, setExporting] = useState(false);
  const [erasing, setErasing] = useState(false);

  const onExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/lgpd/export");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Falha ao exportar");
      const blob = new Blob([JSON.stringify(json, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `snap-lgpd-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exportação baixada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao exportar");
    } finally {
      setExporting(false);
    }
  };

  const onErase = async () => {
    setErasing(true);
    try {
      const res = await fetch("/api/lgpd/erase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Falha ao apagar");
      setConfirm("");
      toast.success(`Dados de ${json.contacts} contatos anonimizados`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao apagar");
    } finally {
      setErasing(false);
    }
  };

  return (
    <section className="max-w-2xl animate-in fade-in-50 duration-200">
      <SettingsPanelHead
        title="Privacidade e LGPD"
        description="Exporte os dados da conta ou anonimize contatos, mensagens e notas. Quem hospeda esta instalação é o controlador dos dados."
      />

      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">Exportar dados</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            JSON com contatos, conversas, mensagens, negócios e agendamentos.
          </p>
          <Button className="mt-4" variant="outline" onClick={onExport} disabled={exporting}>
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Baixar exportação
          </Button>
        </div>

        {isOwner && (
          <div className="rounded-xl border border-destructive/30 bg-card p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-destructive">
              <ShieldAlert className="h-4 w-4" />
              Anonimizar todos os contatos
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Nomes, e-mails, mensagens e notas são apagados. Negócios e o
              histórico de IDs permanecem. Irreversível. Digite{" "}
              <span className="font-mono">APAGAR</span> para confirmar.
            </p>
            <div className="mt-4 space-y-2">
              <Label htmlFor="lgpd-confirm">Confirmação</Label>
              <Input
                id="lgpd-confirm"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="APAGAR"
              />
            </div>
            <Button
              className="mt-4"
              variant="destructive"
              onClick={onErase}
              disabled={erasing || confirm !== "APAGAR"}
            >
              {erasing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Anonimizar agora
            </Button>
          </div>
        )}

        <AuditLogPanel />
      </div>
    </section>
  );
}
