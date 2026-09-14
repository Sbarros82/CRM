"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";

interface AuditRow {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
}

export function AuditLogPanel() {
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/audit?limit=40");
      const json = await res.json();
      if (cancelled) return;
      if (!res.ok) {
        setError(json.error ?? "Sem permissão para ver o log");
        setRows([]);
        return;
      }
      setRows(json.entries ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold">Log de auditoria</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Quem exportou dados, pausou a IA, opt-out e outras mutações.
      </p>
      <div className="mt-4 space-y-2">
        {rows === null && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando…
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {rows && rows.length === 0 && !error && (
          <p className="text-sm text-muted-foreground">Nenhum evento ainda.</p>
        )}
        {rows?.map((row) => (
          <div
            key={row.id}
            className="flex items-baseline justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate font-mono text-xs text-foreground">{row.action}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {row.entity_type}
                {row.entity_id ? ` · ${row.entity_id.slice(0, 8)}` : ""}
              </p>
            </div>
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {formatDistanceToNow(new Date(row.created_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
