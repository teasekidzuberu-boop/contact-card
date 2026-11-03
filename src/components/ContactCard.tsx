import { useState } from "react";
import { useHydrated } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Copy,
  Download,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Phone,
  Share2,
  UserRound,
  Globe,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { buildVCard, vCardFileName } from "@/lib/vcard";
import { buildWhatsAppUrl } from "@/lib/phone";
import { isValidExternalUrl, platformIcon, platformAriaLabel } from "@/lib/social";
import type { PublicProfile, SocialLink } from "@/lib/types";

interface ContactCardProps {
  profile: PublicProfile;
  links: SocialLink[];
}

function downloadVCard(profile: PublicProfile, links: SocialLink[]) {
  const vcf = buildVCard(profile, links);
  const blob = new Blob([vcf], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = vCardFileName(profile.slug);
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ContactCard({ profile, links }: ContactCardProps) {
  const hydrated = useHydrated();
  const [saved, setSaved] = useState(false);

  const canonicalUrl = hydrated ? `${window.location.origin}/p/${profile.slug}` : "";

  const initials = profile.full_name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const whatsappUrl =
    buildWhatsAppUrl(profile.whatsapp_number ?? "", profile.whatsapp_message) ?? undefined;
  const smsHref = profile.phone?.trim() ? `sms:${profile.phone.replace(/[^\d+]/g, "")}` : null;
  const websiteUrl = isValidExternalUrl(profile.website) ? profile.website.trim() : null;
  const safeLinks = links.filter((l) => isValidExternalUrl(l.url));

  const handleSave = () => {
    try {
      downloadVCard(profile, links);
      setSaved(true);
      toast.success("Contact file downloaded");
      window.setTimeout(() => setSaved(false), 2500);
    } catch {
      toast.error("Could not generate the contact file");
    }
  };

  const handleCopy = async () => {
    if (!canonicalUrl) return;
    try {
      await navigator.clipboard.writeText(canonicalUrl);
      toast.success("Profile link copied");
    } catch {
      // Clipboard API can be unavailable (http or permissions); fall back.
      const el = document.createElement("textarea");
      el.value = canonicalUrl;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      el.remove();
      if (ok) toast.success("Profile link copied");
      else toast.error("Could not copy the link", { description: canonicalUrl });
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: profile.full_name, url: canonicalUrl });
        return;
      } catch (err) {
        if ((err as DOMException)?.name === "AbortError") return;
      }
    }
    void handleCopy();
  };


  return (
    <div className="fade-in flex min-h-screen justify-center bg-background px-4 py-10 sm:py-16">
      <main className="rise w-full max-w-sm">
        <article className="rounded-3xl border border-border bg-card px-6 pb-8 pt-10 text-center shadow-[0_24px_60px_-30px_rgba(0,0,0,0.8)] sm:px-8">
          {/* Avatar */}
          <div className="mx-auto size-28 overflow-hidden rounded-full border border-gold-soft p-1">
            {profile.avatar_path ? (
              <img
                src={`/api/public/profile-photo/${profile.avatar_path}`}
                alt={`${profile.full_name}'s profile photo`}
                className="size-full rounded-full object-cover"
                width={112}
                height={112}
              />
            ) : (
              <div className="flex size-full items-center justify-center rounded-full bg-secondary">
                <UserRound className="size-10 text-muted-foreground" aria-hidden />
              </div>
            )}
          </div>

          <h1 className="mt-5 font-display text-4xl leading-tight text-foreground">
            {profile.full_name || "Unnamed"}
          </h1>
          {(profile.title || profile.organization) && (
            <p className="mt-1 text-sm font-medium tracking-wide text-primary">
              {[profile.title, profile.organization].filter(Boolean).join(" · ")}
            </p>
          )}
          {profile.bio.trim() && (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>
          )}

          <div className="mx-auto mt-6 h-px w-16 bg-gold-soft" aria-hidden />

          {/* Primary actions */}
          <div className="mt-6 flex flex-col gap-3">
            <Button
              size="lg"
              onClick={handleSave}
              className="h-12 w-full rounded-full text-base font-semibold"
              aria-label="Save contact as a vCard file"
            >
              <Download aria-hidden />
              {saved ? "Saved!" : "Save Contact"}
            </Button>
            {whatsappUrl && (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 w-full rounded-full text-base font-semibold"
              >
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Chat on WhatsApp (opens in a new tab)"
                >
                  <MessageCircle aria-hidden />
                  WhatsApp
                </a>
              </Button>
            )}
            {smsHref && (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 w-full rounded-full text-base font-semibold"
              >
                <a href={smsHref} aria-label={`Send a text message to ${profile.phone}`}>
                  <MessageSquare aria-hidden />
                  Text message
                </a>
              </Button>
            )}
          </div>

          {/* Contact details */}
          {(profile.email.trim() || profile.phone.trim() || profile.location.trim() || websiteUrl) && (
            <ul className="mt-7 space-y-2 text-left">
              {profile.email.trim() && (
                <li>
                  <a
                    href={`mailto:${profile.email.trim()}`}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-foreground/90 transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <Mail className="size-4 shrink-0 text-primary" aria-hidden />
                    <span className="truncate">{profile.email}</span>
                  </a>
                </li>
              )}
              {profile.phone.trim() && (
                <li>
                  <a
                    href={`tel:${profile.phone.replace(/[^\d+]/g, "")}`}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-foreground/90 transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <Phone className="size-4 shrink-0 text-primary" aria-hidden />
                    <span>{profile.phone}</span>
                  </a>
                </li>
              )}
              {profile.location.trim() && (
                <li className="flex items-center gap-3 px-2 py-2 text-sm text-foreground/90">
                  <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
                  <span>{profile.location}</span>
                </li>
              )}
              {websiteUrl && (
                <li>
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-foreground/90 transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <Globe className="size-4 shrink-0 text-primary" aria-hidden />
                    <span className="truncate">{websiteUrl.replace(/^https?:\/\//, "")}</span>
                  </a>
                </li>
              )}
            </ul>
          )}

          {/* Social links */}
          {safeLinks.length > 0 && (
            <nav aria-label="Social profiles" className="mt-6 flex justify-center gap-2">
              {safeLinks.map((link) => {
                const Icon = platformIcon(link.platform);
                return (
                  <a
                    key={link.id ?? `${link.platform}-${link.url}`}
                    href={link.url.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={platformAriaLabel(link.platform, link.url)}
                    className="flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <Icon className="size-4" aria-hidden />
                  </a>
                );
              })}
            </nav>
          )}

          {/* Share actions */}
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleCopy} className="text-muted-foreground">
              <Copy aria-hidden />
              Copy link
            </Button>
            <Button variant="ghost" size="sm" onClick={handleShare} className="text-muted-foreground">
              <Share2 aria-hidden />
              Share
            </Button>
          </div>
        </article>

        <p className="mt-6 text-center text-xs text-muted-foreground/70">
          Digital contact card · <a href="/admin/login" className="hover:text-primary">Admin</a>
        </p>
      </main>
    </div>
  );
}
