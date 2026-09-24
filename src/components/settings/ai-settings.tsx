"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bot, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SettingsPanelHead } from "./settings-panel-head";
import type { HandoffMode } from "@/lib/ai/handoff-meta";
import type { AiProvider } from "@/lib/ai/types";

interface AiForm {
  enabled: boolean;
  provider: AiProvider;
  model: string;
  systemPrompt: string;
  followUpHours: number;
  hasApiKey: boolean;
  notifyPhones: string;
  handoffMode: HandoffMode;
}

export function AiSettingsPanel() {
  const [form, setForm] = useState<AiForm | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ai/settings");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Falha ao carregar");
        if (cancelled) return;
        setForm({
          enabled: json.settings.enabled,
          provider: json.settings.provider,
          model: json.settings.model,
          systemPrompt: json.settings.systemPrompt ?? json.defaultPrompt,
          followUpHours: json.settings.followUpHours,
          hasApiKey: json.settings.hasApiKey,
          notifyPhones: (json.settings.handoff?.phones ?? []).join("\n"),
          handoffMode: json.settings.handoff?.mode ?? "queue",
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Falha ao carregar IA");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const res = await fetch("/api/ai/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: form.enabled,
          provider: form.provider,
          model: form.model,
          systemPrompt: form.systemPrompt,
          followUpHours: form.followUpHours,
          notifyPhones: form.notifyPhones,
          handoffMode: form.handoffMode,
          apiKey: apiKey.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Falha ao salvar");
      setForm((prev) =>
        prev
          ? {
              ...prev,
              hasApiKey: json.settings.hasApiKey,
            }
          : prev,
      );
      setApiKey("");
      toast.success("Agente de IA atualizado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando…
      </div>
    );
  }

  return (
    <section className="max-w-2xl animate-in fade-in-50 duration-200">
      <SettingsPanelHead
        title="Agente de IA"
        description="Atende no WhatsApp, explica o produto, qualifica o lead e passa para um humano fechar. A chave fica criptografada no servidor — nunca volta para o navegador."
      />

      <div className="space-y-6 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium">IA atende conversas novas</p>
              <p className="text-xs text-muted-foreground">
                Pausa sozinha se um agente responder ou o cliente pedir humano.
              </p>
            </div>
          </div>
          <Switch
            checked={form.enabled}
            onCheckedChange={(checked) =>
              setForm((prev) => (prev ? { ...prev, enabled: checked } : prev))
            }
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ai-provider">Provedor</Label>
            <select
              id="ai-provider"
              value={form.provider}
              onChange={(e) =>
                setForm((prev) =>
                  prev
                    ? { ...prev, provider: e.target.value as AiProvider }
                    : prev,
                )
              }
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="openai">OpenAI</option>
              <option value="openrouter">OpenRouter</option>
              <option value="anthropic">Anthropic</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ai-model">Modelo</Label>
            <Input
              id="ai-model"
              value={form.model}
              onChange={(e) =>
                setForm((prev) =>
                  prev ? { ...prev, model: e.target.value } : prev,
                )
              }
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ai-key">
            Chave de API {form.hasApiKey ? "(já salva — cole outra para trocar)" : ""}
          </Label>
          <Input
            id="ai-key"
            type="password"
            autoComplete="off"
            placeholder={form.hasApiKey ? "••••••••" : "sk-…"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="follow-up">Radar de follow-up (horas sem resposta)</Label>
          <Input
            id="follow-up"
            type="number"
            min={1}
            max={168}
            value={form.followUpHours}
            onChange={(e) =>
              setForm((prev) =>
                prev
                  ? { ...prev, followUpHours: Number(e.target.value) || 24 }
                  : prev,
              )
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="handoff-mode">Quando a IA passar para humano</Label>
          <select
            id="handoff-mode"
            value={form.handoffMode}
            onChange={(e) =>
              setForm((prev) =>
                prev
                  ? { ...prev, handoffMode: e.target.value as HandoffMode }
                  : prev,
              )
            }
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="queue">Fila da equipe — qualquer um pega</option>
            <option value="online">Quem estiver online no Snap</option>
            <option value="owner">Só o dono da conta</option>
          </select>
          <p className="text-xs text-muted-foreground">
            A conversa fica em Inbox → Humano. Com “online”, o Snap atribui
            a quem estiver online e avisa no WhatsApp cadastrado no perfil
            de cada um (Configurações → Seu perfil).
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notify-phones">WhatsApp da equipe (reserva)</Label>
          <Textarea
            id="notify-phones"
            rows={3}
            placeholder={"82 98181-2000\n11 98888-7777"}
            value={form.notifyPhones}
            onChange={(e) =>
              setForm((prev) =>
                prev ? { ...prev, notifyPhones: e.target.value } : prev,
              )
            }
          />
          <p className="text-xs text-muted-foreground">
            Lista reserva (um número por linha). Só é usada se ninguém online
            tiver WhatsApp no perfil. Prefira cadastrar o celular em Seu
            perfil. O número precisa ter falado com o WhatsApp da empresa
            nas últimas 24h. Não use o mesmo número do cliente.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ai-prompt">Instruções do agente</Label>
          <Textarea
            id="ai-prompt"
            rows={16}
            value={form.systemPrompt}
            onChange={(e) =>
              setForm((prev) =>
                prev ? { ...prev, systemPrompt: e.target.value } : prev,
              )
            }
          />
          <p className="text-xs text-muted-foreground">
            Inclua nome e triagem (Snap, site/landing, automação), preços oficiais
            do Snap e quando passar para um consultor. Não invente preço de site.
            O cliente só vê a resposta curta, não este texto.
          </p>
        </div>

        <Button onClick={save} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar
        </Button>
      </div>
    </section>
  );
}
