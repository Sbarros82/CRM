"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { MessageSquare, CheckCircle, UsersRound } from "lucide-react";

// `useSearchParams` opts the component out of static prerendering
// unless wrapped in Suspense — same pattern as /login.
export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageInner />
    </Suspense>
  );
}

function SignupPageInner() {
  const searchParams = useSearchParams();
  // When the user lands here from `/join/<token>` we carry the
  // invite token in the query so it survives the signup → email
  // verification → redirect round-trip. `emailRedirectTo` below
  // points back at /join/<token> so the user lands on the redeem
  // step after verifying instead of being dropped on /dashboard.
  const inviteToken = searchParams.get("invite");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    // If we have an invite token, point Supabase's verification
    // email back at the join page so the user can accept after
    // verifying. Without a token, Supabase uses its default
    // redirect (the app root).
    const emailRedirectTo = inviteToken
      ? `${window.location.origin}/join/${encodeURIComponent(inviteToken)}`
      : undefined;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        ...(emailRedirectTo ? { emailRedirectTo } : {}),
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md border-slate-100 bg-white shadow-2xl rounded-2xl">
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-xl text-slate-900 font-bold">
              Verifique seu e-mail
            </CardTitle>
            <CardDescription className="text-slate-500">
              Enviamos um link de confirmação para{" "}
              <span className="text-slate-900 font-semibold">{email}</span>. Por favor, verifique sua caixa de entrada e clique no link para validar sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href={
                inviteToken
                  ? `/login?invite=${encodeURIComponent(inviteToken)}`
                  : "/login"
              }
            >
              <Button
                variant="outline"
                className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                Voltar para o login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-slate-100 bg-white shadow-2xl rounded-2xl">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl">
            {inviteToken ? (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                <UsersRound className="h-6 w-6 text-blue-600" />
              </div>
            ) : (
              <img src="/logo.png" alt="Snap Logo" className="h-12 w-12 object-contain rounded-xl" />
            )}
          </div>
          <CardTitle className="text-xl text-slate-900 font-bold">
            {inviteToken ? "Criar conta e entrar" : "Criar conta"}
          </CardTitle>
          <CardDescription className="text-slate-500">
            {inviteToken
              ? "Confirme seu e-mail para aceitar o convite da equipe."
              : "Comece a usar o Snap"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="fullName" className="text-slate-700 font-medium">
                Nome completo
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-600 focus-visible:ring-blue-600/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu-email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-600 focus-visible:ring-blue-600/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-slate-700 font-medium">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo de 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-600 focus-visible:ring-blue-600/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword" className="text-slate-700 font-medium">
                Confirmar senha
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repita sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-600 focus-visible:ring-blue-600/20"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 h-10 w-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-semibold shadow-md shadow-blue-600/10 transition-colors"
            >
              {loading ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Já tem uma conta?{" "}
            <Link
              href={
                inviteToken
                  ? `/login?invite=${encodeURIComponent(inviteToken)}`
                  : "/login"
              }
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
