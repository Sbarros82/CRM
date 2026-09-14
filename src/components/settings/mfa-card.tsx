"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface TotpFactor {
  id: string;
  status: string;
}

export function MfaCard() {
  const supabase = createClient();
  const [factors, setFactors] = useState<TotpFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      console.error("[mfa] listFactors", error.message);
      setFactors([]);
    } else {
      setFactors((data.totp ?? []).map((f) => ({ id: f.id, status: f.status })));
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const verified = factors.filter((f) => f.status === "verified");

  const startEnroll = async () => {
    setEnrolling(true);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Authenticator",
    });
    if (error || !data) {
      toast.error(error?.message ?? "Não foi possível iniciar o MFA");
      setEnrolling(false);
      return;
    }
    setFactorId(data.id);
    setQr(data.totp.qr_code);
  };

  const verify = async () => {
    if (!factorId || code.trim().length < 6) return;
    setBusy(true);
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;
      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: code.trim(),
      });
      if (error) throw error;
      toast.success("Verificação em duas etapas ativada");
      setQr(null);
      setFactorId(null);
      setCode("");
      setEnrolling(false);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Código inválido");
    } finally {
      setBusy(false);
    }
  };

  const unenroll = async (id: string) => {
    setBusy(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    if (error) toast.error(error.message);
    else {
      toast.success("MFA desativado neste dispositivo");
      await refresh();
    }
    setBusy(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Verificação em duas etapas
        </CardTitle>
        <CardDescription>
          Opcional. Use Google Authenticator ou Authy. Quem já tem um fator
          cadastrado precisa do código a cada login.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : verified.length > 0 && !enrolling ? (
          <div className="space-y-3">
            <p className="text-sm text-foreground">MFA ativo neste usuário.</p>
            {verified.map((f) => (
              <Button
                key={f.id}
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => unenroll(f.id)}
              >
                Remover autenticador
              </Button>
            ))}
          </div>
        ) : qr ? (
          <div className="space-y-3">
            <img
              src={qr}
              alt="QR code do autenticador"
              className="h-40 w-40 rounded-md border border-border bg-white p-1"
            />
            <div className="space-y-1.5">
              <Label htmlFor="mfa-code">Código de 6 dígitos</Label>
              <Input
                id="mfa-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <Button onClick={verify} disabled={busy || code.trim().length < 6}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={startEnroll}>
            Ativar MFA
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
