"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Radar, Loader2 } from "lucide-react";
import type { RadarItem } from "@/lib/ai/types";

export default function RadarPage() {
  const [hours, setHours] = useState(24);
  const [items, setItems] = useState<RadarItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/radar");
      const json = await res.json();
      if (cancelled) return;
      if (!res.ok) {
        setError(json.error ?? "Falha ao carregar o radar");
        setItems([]);
        return;
      }
      setHours(json.hours ?? 24);
      setItems(json.items ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Radar className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Radar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Conversas abertas à espera de resposta há mais de {hours}h — o
            follow-up que o Deskcomm chama de radar.
          </p>
        </div>
      </div>

      <div className="mt-6 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {items === null && (
          <div className="flex items-center gap-2 px-4 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando conversas frias…
          </div>
        )}
        {error && (
          <p className="px-4 py-8 text-sm text-destructive">{error}</p>
        )}
        {items && items.length === 0 && !error && (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            Nada esfriando no momento. Bom sinal.
          </p>
        )}
        {items?.map((item) => (
          <Link
            key={item.id}
            href={`/inbox?c=${item.id}`}
            className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {item.contact_name || item.contact_phone || "Contato"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {item.last_message_text || "Sem prévia"}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-amber-500">
                {item.hours_waiting}h
              </p>
              {item.last_inbound_at && (
                <p className="text-[11px] text-muted-foreground">
                  {formatDistanceToNow(new Date(item.last_inbound_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
