import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { PublicProfile, SocialLink } from "./types";

/**
 * Public, read-only profile fetches for the contact card pages.
 * Uses the publishable-key client; RLS exposes only published rows.
 */
function createPublicClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    // Opaque sb_ keys are not JWTs; send apikey only, never the bearer.
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

function toProfile(row: Database["public"]["Tables"]["card_profile"]["Row"]): PublicProfile {
  return {
    slug: row.slug,
    full_name: row.full_name,
    title: row.title,
    organization: row.organization,
    bio: row.bio,
    phone: row.phone,
    whatsapp_number: row.whatsapp_number ?? "",
    whatsapp_message: row.whatsapp_message,
    email: row.email,
    location: row.location,
    website: row.website,
    avatar_path: row.avatar_path,
    published: row.published,
  };
}

export interface PublicProfileData {
  profile: PublicProfile;
  links: SocialLink[];
}

export const getPublicProfile = createServerFn({ method: "GET" })
  .inputValidator((input: { slug?: string }) => input)
  .handler(async ({ data }): Promise<PublicProfileData | null> => {
    const supabase = createPublicClient();
    const query = supabase.from("card_profile").select("*").eq("published", true);

    const { data: rows, error } = data?.slug
      ? await query.eq("slug", data.slug).limit(1)
      : await query.order("created_at", { ascending: true }).limit(1);

    if (error) throw new Error("Failed to load profile");
    const row = rows?.[0];
    if (!row) return null;

    const { data: linkRows, error: linkError } = await supabase
      .from("social_links")
      .select("id, platform, url, position")
      .eq("profile_id", row.id)
      .order("position", { ascending: true });

    if (linkError) throw new Error("Failed to load profile links");

    return {
      profile: toProfile(row),
      links: (linkRows ?? []).map((l) => ({
        id: l.id,
        platform: l.platform,
        url: l.url,
        position: l.position,
      })),
    };
  });
