import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Loader2, Lock, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/login")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    denied: typeof search["denied"] === "string" ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Admin — Sign in" },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin — Sign in" },
      { property: "og:description", content: "Administrative sign in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: async () => {
    // Already-signed-in admins go straight to the dashboard.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (isAdmin) throw redirect({ to: "/admin" });
  },
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const { denied } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If the session appears after mount (e.g. restored session), enter the dashboard.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled || !user) return;
      const { data: isAdmin } = await supabase.rpc("is_admin");
      if (!cancelled && isAdmin) navigate({ to: "/admin", replace: true });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) {
        setError(
          authError.status === 400 ? "Incorrect email or password." : authError.message,
        );
        return;
      }
      if (!data.user) {
        setError("Sign in failed. Please try again.");
        return;
      }
      const { data: isAdmin } = await supabase.rpc("is_admin");
      if (!isAdmin) {
        await supabase.auth.signOut();
        setError("This account does not have admin access.");
        return;
      }
      navigate({ to: "/admin", replace: true });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="rise w-full max-w-sm">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.8)]">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-gold-soft">
            <Lock className="size-5 text-primary" aria-hidden />
          </div>
          <h1 className="mt-5 text-center font-display text-3xl text-foreground">Admin</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Sign in to manage your contact card.
          </p>

          {denied && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive-foreground"
            >
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
              <span>That account does not have admin access.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="h-11 w-full rounded-full font-semibold">
              {loading ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Only the account owner can sign in. Registration is not available.
          </p>
        </div>
      </div>
    </div>
  );
}
