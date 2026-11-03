import { createServerFn } from "@tanstack/react-start";
import {
  setupTokenMatches,
  validateSetupInput,
  type CreateFirstAdminResult,
  type SetupStatus,
} from "./admin-setup.shared";

export type { CreateFirstAdminResult, SetupStatus };

/**
 * First-admin setup.
 *
 * Security model:
 * - Public self-service registration stays OFF. The account is created
 *   server-side with the service-role client, never through sign-up.
 * - The caller must prove possession of the ADMIN_SETUP_TOKEN secret
 *   (entered in the app UI, never shared in chat).
 * - A singleton `first_admin_setup` row is claimed atomically before the
 *   account is created, so the flow can only ever mint one admin. Once an
 *   admin exists (or the claim is taken), the flow is permanently closed.
 */

export const getAdminSetupStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<SetupStatus> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count: adminCount } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((adminCount ?? 0) > 0) {
      return { available: false, reason: "complete" };
    }

    const { data: claims } = await supabaseAdmin
      .from("first_admin_setup")
      .select("id")
      .limit(1);
    if (claims && claims.length > 0) {
      return { available: false, reason: "in_progress" };
    }

    if (!process.env["ADMIN_SETUP_TOKEN"]) {
      return { available: false, reason: "unconfigured" };
    }
    return { available: true, reason: "ready" };
  },
);

export const createFirstAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: { setupToken?: string; email?: string; password?: string }) => input)
  .handler(async ({ data }): Promise<CreateFirstAdminResult> => {
    const parsed = validateSetupInput(data ?? {});
    if (!parsed.ok) return { ok: false, error: parsed.error };

    const expected = process.env["ADMIN_SETUP_TOKEN"];
    if (!expected) {
      return { ok: false, error: "Setup is not configured. Add the ADMIN_SETUP_TOKEN secret first." };
    }
    if (!setupTokenMatches(parsed.setupToken, expected)) {
      return { ok: false, error: "That setup key is not valid." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Atomically claim the single setup slot; a second caller gets nothing.
    const { error: claimError, data: claimed } = await supabaseAdmin
      .from("first_admin_setup")
      .upsert({ id: 1 }, { onConflict: "id", ignoreDuplicates: true })
      .select("id");
    if (claimError) {
      console.error("[admin-setup] claim failed", claimError.message);
      return { ok: false, error: "Setup failed. Please try again." };
    }
    if (!claimed || claimed.length === 0) {
      return { ok: false, error: "Admin setup has already been completed." };
    }

    const releaseClaim = async () => {
      await supabaseAdmin.from("first_admin_setup").delete().eq("id", 1);
    };

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: parsed.email,
      password: parsed.password,
      email_confirm: true,
    });
    if (createError || !created?.user) {
      console.error("[admin-setup] create user failed", createError?.message);
      await releaseClaim();
      return { ok: false, error: "Could not create the account. Please try again." };
    }

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: "admin" });
    if (roleError) {
      console.error("[admin-setup] role insert failed", roleError.message);
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      await releaseClaim();
      return { ok: false, error: "Could not grant admin access. Please try again." };
    }

    return { ok: true };
  });
