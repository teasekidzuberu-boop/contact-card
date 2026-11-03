/**
 * Pure, client-safe helpers for the first-admin setup flow.
 * Shared by the server functions (src/lib/admin-setup.functions.ts) and tests.
 */

export type SetupStatus = {
  available: boolean;
  reason: "ready" | "complete" | "in_progress" | "unconfigured";
};

export type CreateFirstAdminResult = { ok: true } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Constant-time-ish comparison so response timing can't leak the secret. */
export function setupTokenMatches(provided: string, expected: string): boolean {
  if (provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

/** Pure input validation shared by the handler and tests. */
export function validateSetupInput(input: {
  setupToken?: string;
  email?: string;
  password?: string;
}): { ok: true; email: string; password: string; setupToken: string } | { ok: false; error: string } {
  const setupToken = (input.setupToken ?? "").trim();
  const email = (input.email ?? "").trim().toLowerCase();
  const password = input.password ?? "";

  if (!setupToken) return { ok: false, error: "Enter the setup key." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Enter a valid email address." };
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };

  return { ok: true, email, password, setupToken };
}
