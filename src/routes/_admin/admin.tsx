import { createFileRoute } from "@tanstack/react-router";
import AdminDashboard from "@/components/AdminDashboard";

export const Route = createFileRoute("/_admin/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin — Manage contact card" },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin — Manage contact card" },
      { property: "og:description", content: "Edit your digital contact card." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminDashboard,
});
