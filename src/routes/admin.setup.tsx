import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import {
  createFirstAdmin,
  getAdminSetupStatus,
  type SetupStatus,
} from "@/lib/admin-setup.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/setup")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin — First-time setup" },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin — First-time setup" },
      { property: "og:description", content: "One-time administrative account setup." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminSetup,
});

const UNAVAILABLE_COPY: Record<SetupStatus["reason"], string> = {
  complete: "Admin setup is already complete. Sign in with your admin account.",
  in_progress: "Admin setup has already been used and cannot be run again.",
  unconfigured: "Setup is not configured yet. Ask the site owner to add the setup key.",
  ready: "Setup is not available right now. Try again shortly.",
};

function AdminSetup() {
  const navigate = useNavigate();
  const checkStatus = useServerFn(getAdminSetupStatus);
  const createAdmin = useServerFn(createFirstAdmin);

  const [status, setStatus] = useState<SetupStatus | "loading">("loading");
  const [setupKey, setSetupKey] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    checkStatus()
      .then((result) => {
        if (!cancelled) setStatus(result);
      })
      .catch(() => {
        if (!cancelled) setStatus({ available: false, reason: "unconfigured" });
      });
    return () => {
      cancelled = true;
    };
  }, [checkStatus]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const result = await createAdmin({
        data: { setupToken: setupKey, email, password },
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError("Account created. Please sign in from the admin login page.");
        return;
      }
      await navigate({ to: "/admin", replace: true });
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
            {status === "loading" || status.available ? (
              <KeyRound className="size-5 text-primary" aria-hidden />
            ) : (
              <ShieldAlert className="size-5 text-destructive" aria-hidden />
            )}
          </div>
          <h1 className="mt-5 text-center font-display text-3xl text-foreground">
            First-time setup
          </h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Create the one and only admin account.
          </p>

          {status === "loading" && (
            <div className="mt-8 flex justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
            </div>
          )}

          {status !== "loading" && !status.available && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive-foreground"
            >
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
              <span>{UNAVAILABLE_COPY[status.reason]}</span>
            </div>
          )}

          {status !== "loading" && status.available && (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="setup-token">Setup key</Label>
                <Input
                  id="setup-token"
                  type="password"
                  autoComplete="off"
                  required
                  value={setupKey}
                  onChange={(e) => setSetupKey(e.target.value)}
                  placeholder="The private key set for this setup"
                />
                <p className="text-xs text-muted-foreground">
                  The private key created for this one-time setup. It is not recoverable here.
                </p>
              </div>

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
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat the password"
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-full font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden />
                    Creating account…
                  </>
                ) : (
                  "Create admin account"
                )}
              </Button>

              <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5 shrink-0" aria-hidden />
                One-time only. Public registration stays closed.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
