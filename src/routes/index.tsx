import { createFileRoute } from "@tanstack/react-router";
import { getPublicProfile } from "@/lib/profile.functions";
import ContactCard from "@/components/ContactCard";

export const Route = createFileRoute("/")({
  loader: () => getPublicProfile({ data: {} }),
  head: ({ loaderData }) => {
    const name = loaderData?.profile.full_name;
    const role = loaderData?.profile.title;
    const title = name ? `${name}${role ? ` — ${role}` : " — Contact Card"}` : "Contact Card";
    const description = name
      ? `Save ${name}'s contact details${role ? ` · ${role}` : ""} — phone, email, WhatsApp and more.`
      : "Personal digital contact card.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: HomePage,
});

function HomePage() {
  const data = Route.useLoaderData();

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
        <div>
          <h1 className="font-display text-2xl text-foreground">Contact card unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This card hasn't been published yet.
          </p>
        </div>
      </div>
    );
  }

  return <ContactCard profile={data.profile} links={data.links} />;
}
