"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UsersRound } from "lucide-react";
import HeroAurora from "@/components/marketing/hero-aurora";
import LineRippleBackground from "@/components/originkit/line-ripple-background";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signError) {
      setError(signError.message);
      setLoading(false);
      return;
    }

    // Full navigation so the session cookie is on the next document
    // request. Soft router.push broke Android installed PWAs after login.
    if (inviteToken) {
      window.location.assign(`/join/${encodeURIComponent(inviteToken)}`);
    } else {
      window.location.assign("/inbox");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <HeroAurora />
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <LineRippleBackground
          strokeColor="rgba(255, 221, 0, 0.22)"
          backgroundColor="transparent"
          count={36}
          movement={14}
          force={2.5}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,transparent_0%,#0C0C0A_72%)]" />

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center text-center">
          {inviteToken ? (
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#FFDD00]/25 bg-[#FFDD00]/10">
              <UsersRound className="h-7 w-7 text-[#FFDD00]" />
            </div>
          ) : (
            <img
              src="/logo.png"
              alt="Snap"
              className="mb-4 h-14 w-14 rounded-2xl object-contain shadow-[0_0_40px_rgba(255,221,0,0.18)]"
            />
          )}
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#FFDD00]">
            Snap
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {inviteToken ? "Entrar para aceitar o convite" : "Bem-vindo de volta"}
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-400">
            {inviteToken
              ? "Use o e-mail convidado pela sua empresa para continuar."
              : "Acesso interno da equipe. Contas são criadas pelo administrador ou pelo suporte."}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#141412]/85 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8">
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-zinc-300">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="voce@suaempresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 border-white/10 bg-black/40 text-white placeholder:text-zinc-500 focus-visible:border-[#FFDD00]/50 focus-visible:ring-[#FFDD00]/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="password" className="text-zinc-300">
                  Senha
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-[#FFDD00] hover:text-[#FFE44D]"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 border-white/10 bg-black/40 text-white placeholder:text-zinc-500 focus-visible:border-[#FFDD00]/50 focus-visible:ring-[#FFDD00]/20"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-1 h-11 w-full bg-[#FFDD00] font-semibold text-[#0C0C0A] hover:bg-[#FFE44D] disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          {inviteToken ? (
            <p className="mt-6 text-center text-sm text-zinc-400">
              Ainda não tem acesso?{" "}
              <Link
                href={`/signup?invite=${encodeURIComponent(inviteToken)}`}
                className="font-medium text-[#FFDD00] hover:text-[#FFE44D]"
              >
                Criar conta com o convite
              </Link>
            </p>
          ) : (
            <p className="mt-6 text-center text-xs leading-relaxed text-zinc-500">
              Precisa de acesso? Peça ao administrador da empresa ou ao
              suporte Snap para enviar um convite.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
