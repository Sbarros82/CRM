'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UsersRound } from 'lucide-react';
import Tornado from '@/components/originkit/tornado';
import { useIsDesktop } from '@/hooks/use-media-query';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

/**
 * WebGL vortex behind the login. Desktop gets the full preset in its own
 * panel; mobile gets a lighter build (fewer dots/strands) dimmed behind the
 * card so older Android PWAs stay smooth. Only one instance is ever mounted
 * — we wait for hydration before choosing, so WebGL isn't initialised twice.
 */
function LoginBackdrop({ variant }: { variant: 'desktop' | 'mobile' }) {
  if (variant === 'desktop') {
    return (
      <Tornado
        topRadius={380}
        waistRadius={53}
        waistPosition={50}
        bottomRadius={1150}
        twist={3}
        zoom={58}
        speed={10}
        direction="right"
        dots
        comets
        repel
        repelOptions={{ radius: 90, strength: 6 }}
        lineOptions={{ count: 240, color: '#ffffff', glow: 9 }}
        dotOptions={{
          count: 8000,
          size: 20,
          color: '#fff7c2',
          glow: 9,
          flicker: 10,
        }}
        cometOptions={{
          count: 10,
          speed: 6,
          color: '#FFDD00',
          glow: 7,
          tail: 19,
          delay: 8,
          collide: 6,
        }}
      />
    );
  }
  return (
    <Tornado
      topRadius={300}
      waistRadius={45}
      waistPosition={50}
      bottomRadius={900}
      twist={3}
      zoom={70}
      speed={9}
      direction="right"
      dots
      comets
      repel={false}
      lineOptions={{ count: 120, color: '#ffffff', glow: 7 }}
      dotOptions={{
        count: 2200,
        size: 22,
        color: '#fff7c2',
        glow: 8,
        flicker: 10,
      }}
      cometOptions={{
        count: 5,
        speed: 6,
        color: '#FFDD00',
        glow: 6,
        tail: 16,
        delay: 8,
        collide: 4,
      }}
    />
  );
}

function LoginPageInner() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const isDesktop = useIsDesktop();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      window.location.assign('/inbox');
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0C0C0A] text-white lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      {/* ── Showcase panel (desktop) ─────────────────────────────────── */}
      <section
        className="relative hidden overflow-hidden border-r border-white/[0.06] lg:block"
        aria-hidden
      >
        <div className="absolute inset-0">
          {mounted && isDesktop && <LoginBackdrop variant="desktop" />}
        </div>
        {/* vignette so copy sits on dark */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_50%_45%,transparent_0%,rgba(12,12,10,0.55)_70%,#0C0C0A_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-[#0C0C0A] via-[#0C0C0A]/70 to-transparent" />

        <div className="pointer-events-none relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt=""
              className="h-9 w-9 rounded-xl object-contain"
            />
            <span className="text-sm font-semibold tracking-[0.2em] text-white/80 uppercase">
              Snap
            </span>
          </div>

          <div className="max-w-md">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-[#FFDD00] uppercase">
              CRM · WhatsApp · IA
            </p>
            <h2 className="mt-3 text-4xl leading-[1.05] font-semibold tracking-tight text-white xl:text-5xl">
              Todo o funil girando
              <br />
              num só lugar.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
              Inbox oficial, fluxos que respondem o óbvio e um funil que anda
              sozinho — do primeiro oi até o fechamento.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['Inbox', 'Funil', 'Fluxos', 'Transmissão', 'IA'].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-zinc-300 backdrop-blur"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Form panel ───────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 lg:min-h-0 lg:px-12">
        {/* mobile backdrop: lighter tornado, dimmed behind the card */}
        {mounted && !isDesktop && (
          <>
            <div className="pointer-events-none absolute inset-0 opacity-80">
              <LoginBackdrop variant="mobile" />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_45%,rgba(12,12,10,0.25)_0%,rgba(12,12,10,0.7)_60%,#0C0C0A_100%)]" />
          </>
        )}
        {/* desktop: soft brand bloom top-right */}
        <div className="pointer-events-none absolute -top-40 -right-40 hidden h-[480px] w-[480px] rounded-full bg-[#FFDD00]/[0.06] blur-[120px] lg:block" />

        <div className="relative z-10 w-full max-w-[400px]">
          <div className="mb-8 flex flex-col items-start text-left">
            {inviteToken ? (
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#FFDD00]/25 bg-[#FFDD00]/10">
                <UsersRound className="h-6 w-6 text-[#FFDD00]" />
              </div>
            ) : (
              <img
                src="/logo.png"
                alt="Snap"
                className="mb-5 h-12 w-12 rounded-2xl object-contain shadow-[0_0_40px_rgba(255,221,0,0.18)] lg:hidden"
              />
            )}
            <p className="text-[11px] font-semibold tracking-[0.22em] text-[#FFDD00] uppercase">
              {inviteToken ? 'Convite' : 'Acesso da equipe'}
            </p>
            <h1 className="mt-2 text-[28px] leading-tight font-semibold tracking-tight text-white">
              {inviteToken
                ? 'Entrar para aceitar o convite'
                : 'Bem-vindo de volta'}
            </h1>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-400">
              {inviteToken
                ? 'Use o e-mail convidado pela sua empresa para continuar.'
                : 'Contas são criadas pelo administrador ou pelo suporte.'}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#141412]/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-7">
            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                >
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
                className="mt-1 h-11 w-full bg-[#FFDD00] font-semibold text-[#0C0C0A] shadow-[0_8px_30px_rgba(255,221,0,0.25)] transition-shadow hover:bg-[#FFE44D] hover:shadow-[0_8px_40px_rgba(255,221,0,0.35)] disabled:opacity-50"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            {inviteToken ? (
              <p className="mt-6 text-center text-sm text-zinc-400">
                Ainda não tem acesso?{' '}
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
      </section>
    </div>
  );
}
