import { createFileRoute } from "@tanstack/react-router";

/**
 * Public read-only streaming proxy for the (private) profile-photos bucket.
 * The bucket has a TO anon SELECT policy, so the publishable key can read
 * exactly the objects in this bucket and nothing else. The path is validated
 * to a single safe filename segment (no traversal, no nested paths).
 */
export const Route = createFileRoute("/api/public/profile-photo/$path")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = params.path;
        if (!path || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,120}$/.test(path) || path.includes("..")) {
          return new Response("Not found", { status: 404 });
        }

        const base = process.env["SUPABASE_URL"]!.replace(/\/+$/, "");
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
        const upstream = await fetch(`${base}/storage/v1/object/profile-photos/${path}`, {
          headers: { apikey: key },
        });

        if (!upstream.ok || !upstream.body) {
          return new Response("Not found", { status: 404 });
        }

        return new Response(upstream.body, {
          status: 200,
          headers: {
            "content-type": upstream.headers.get("content-type") ?? "application/octet-stream",
            "cache-control": "public, max-age=300",
          },
        });
      },
    },
  },
});
