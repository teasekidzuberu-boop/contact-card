import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";

/**
 * Protected admin area. Session + admin role are verified on every entry;
 * RLS re-verifies every database write server-side.
 */
export const Route = createFileRoute("/_admin")({
  ssr: false,
  beforeLoad: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/admin/login", search: { denied: undefined } });
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) throw redirect({ to: "/admin/login", search: { denied: true } });
  },
  component: () => <Outlet />,
});
