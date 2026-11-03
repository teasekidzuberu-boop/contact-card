import { createFileRoute, notFound } from "@tanstack/react-router";
import { getPublicProfile } from "@/lib/profile.functions";
import ContactCard from "@/components/ContactCard";

export const Route = createFileRoute("/p/$slug")({
  loader: async ({ params }) => {
    const data = await getPublicProfile({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const profile = loaderData?.profile;
    const title = profile ? `${profile.full_name} — Contact Card` : "Contact Card unavailable";
    const description = profile
      ? `Save ${profile.full_name}'s contact details${profile.title ? ` · ${profile.title}` : ""} — phone, email, WhatsApp and more.`
      : "This contact card could not be found.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary" },
        ...(profile ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    };
  },
  component: SharedProfilePage,
});

function SharedProfilePage() {
  const data = Route.useLoaderData();
  return <ContactCard profile={data.profile} links={data.links} />;
}
