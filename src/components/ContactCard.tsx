import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useHydrated } from "@tanstack/react-router";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import {
  ClipboardCopy,
  Copy,
  Download,
  Globe,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Phone,
  QrCode,
  Share2,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { buildVCard, vCardFileName } from "@/lib/vcard";
import { buildWhatsAppUrl, normalizePhone } from "@/lib/phone";
import { isValidExternalUrl, platformIcon, platformAriaLabel } from "@/lib/social";
import { contactDetailsText, qrTarget, safeBrandColor } from "@/lib/brand";
import type { PublicProfile, SocialLink } from "@/lib/types";

interface ContactCardProps {
  profile: PublicProfile;
  links: SocialLink[];
  /** Render inside the admin preview: no page chrome, no theme toggle. */
  preview?: boolean;
  /** Local avatar preview URL (admin). */
  avatarOverride?: string | null;
}

function downloadUrl(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    el.remove();
    return ok;
  }
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </h2>
  );
}

const rowClass =
  "flex min-h-12 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary active:bg-accent focus-visible:outline-2 focus-visible:outline-ring";

function Row({ icon, label, value, href, external }: { icon: ReactNode; label: string; value: string; href?: string; external?: boolean }) {
  const inner = (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold-soft text-primary">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="block truncate">{value}</span>
      </span>
    </>
  );
  return (
    <li>
      {href ? (
        <a href={href} className={rowClass} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {inner}
        </a>
      ) : (
        <div className={rowClass}>{inner}</div>
      )}
    </li>
  );
}

export default function ContactCard({ profile, links, preview, avatarOverride }: ContactCardProps) {
  const hydrated = useHydrated();
  const [saving, setSaving] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const cardUrl = hydrated ? `${window.location.origin}/p/${profile.slug}` : "";
  const qrValue = qrTarget(profile.qr_url, cardUrl);
  const brand = safeBrandColor(profile.brand_color);
  const brandStyle = {
    "--primary": brand,
    "--ring": `color-mix(in oklab, ${brand} 60%, transparent)`,
    "--gold-soft": `color-mix(in oklab, ${brand} 18%, transparent)`,
  } as CSSProperties;

  const phoneDigits = normalizePhone(profile.phone);
  const telHref = phoneDigits ? `tel:${profile.phone.trim().startsWith("+") ? "+" : ""}${phoneDigits}` : null;
  const smsHref = phoneDigits ? `sms:${profile.phone.trim().startsWith("+") ? "+" : ""}${phoneDigits}` : null;
  const whatsappUrl = buildWhatsAppUrl(profile.whatsapp_number, profile.whatsapp_message);
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim()) ? profile.email.trim() : null;
  const websiteUrl = isValidExternalUrl(profile.website) ? profile.website.trim() : null;
  const safeLinks = links.filter((l) => isValidExternalUrl(l.url));
  const avatarSrc = avatarOverride ?? (profile.avatar_path ? `/api/public/profile-photo/${profile.avatar_path}` : null);

  const handleSave = () => {
    setSaving(true);
    try {
      const blob = new Blob([buildVCard(profile, safeLinks)], { type: "text/vcard;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      downloadUrl(url, vCardFileName(profile.slug));
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
      toast.success("Contact saved", { description: "Open the file to add it to your contacts." });
    } catch {
      toast.error("Could not generate the contact file");
    } finally {
      setTimeout(() => setSaving(false), 600);
    }
  };

  const handleCopyLink = async () => {
    if (!cardUrl) return;
    if (await copyText(cardUrl)) toast.success("Profile link copied");
    else toast.error("Could not copy the link", { description: cardUrl });
  };

  const handleCopyDetails = async () => {
    if (await copyText(contactDetailsText(profile, cardUrl))) toast.success("Contact details copied");
    else toast.error("Could not copy details");
  };

  const handleShare = async () => {
    if ("share" in navigator) {
      try {
        await navigator.share({ title: profile.full_name, text: profile.title, url: cardUrl });
        return;
      } catch (err) {
        if ((err as DOMException)?.name === "AbortError") return;
      }
    }
    void handleCopyLink();
  };

  const handleQrDownload = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    downloadUrl(canvas.toDataURL("image/png"), `${profile.slug || "card"}-qr.png`);
    toast.success("QR code downloaded");
  };

  const hasDetails = telHref || email || profile.location.trim() || websiteUrl || whatsappUrl;
  const subtitle = [profile.title, profile.organization].filter(Boolean).join(" · ");

  const body = (
    <div className="space-y-4">
      {/* Hero */}
      <section className="rounded-3xl border border-border bg-card px-5 pb-6 pt-7 text-center shadow-card" aria-label="Profile">
        <div className="mx-auto size-24 rounded-full p-[3px] ring-1 ring-primary/60">
          {avatarSrc ? (
            <img src={avatarSrc} alt={`${profile.full_name || "Profile"} photo`} className="size-full rounded-full object-cover" width={96} height={96} />
          ) : (
            <div className="flex size-full items-center justify-center rounded-full bg-secondary">
              <UserRound className="size-9 text-muted-foreground" aria-hidden />
            </div>
          )}
        </div>
        <h1 className="mt-4 break-words font-display text-2xl font-semibold leading-tight text-foreground">
          {profile.full_name || "Your name"}
        </h1>
        {subtitle && <p className="mt-1 text-sm font-medium text-primary">{subtitle}</p>}
        {profile.location.trim() && (
          <p className="mt-1.5 flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5" aria-hidden /> {profile.location}
          </p>
        )}
        {profile.bio.trim() && (
          <p className="mx-auto mt-3 max-w-xs whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>
        )}

        {/* Primary actions */}
        <div className="mt-5 space-y-2.5">
          <Button size="lg" onClick={handleSave} disabled={saving} className="h-12 w-full rounded-full text-base font-semibold transition-transform active:scale-[0.98]">
            {saving ? <Loader2 className="animate-spin" aria-hidden /> : <Download aria-hidden />}
            Save Contact
          </Button>
          <div className="grid grid-cols-3 gap-2">
            {[
              whatsappUrl && { href: whatsappUrl, label: "WhatsApp", icon: <MessageCircle aria-hidden />, ext: true },
              telHref && { href: telHref, label: "Call", icon: <Phone aria-hidden /> },
              smsHref && { href: smsHref, label: "Text", icon: <MessageSquare aria-hidden /> },
            ]
              .filter(Boolean)
              .map((a) => {
                const act = a as { href: string; label: string; icon: ReactNode; ext?: boolean };
                return (
                  <a
                    key={act.label}
                    href={act.href}
                    {...(act.ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="flex h-14 flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-secondary/60 text-xs font-medium text-foreground transition-all hover:border-primary/60 active:scale-95 focus-visible:outline-2 focus-visible:outline-ring [&_svg]:size-4 [&_svg]:text-primary"
                  >
                    {act.icon}
                    {act.label}
                  </a>
                );
              })}
          </div>
        </div>
      </section>

      {hasDetails && (
        <section className="rounded-3xl border border-border bg-card p-3 shadow-card">
          <SectionTitle>Contact</SectionTitle>
          <ul className="space-y-0.5">
            {telHref && <Row icon={<Phone className="size-4" />} label="Phone" value={profile.phone} href={telHref} />}
            {whatsappUrl && <Row icon={<MessageCircle className="size-4" />} label="WhatsApp" value={profile.whatsapp_number} href={whatsappUrl} external />}
            {email && <Row icon={<Mail className="size-4" />} label="Email" value={email} href={`mailto:${email}`} />}
            {websiteUrl && <Row icon={<Globe className="size-4" />} label="Website" value={websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")} href={websiteUrl} external />}
            {profile.location.trim() && <Row icon={<MapPin className="size-4" />} label="Location" value={profile.location} />}
          </ul>
        </section>
      )}

      {safeLinks.length > 0 && (
        <section className="rounded-3xl border border-border bg-card p-3 shadow-card">
          <SectionTitle>Social</SectionTitle>
          <nav aria-label="Social profiles" className="flex flex-wrap gap-2 px-1 pb-1">
            {safeLinks.map((link) => {
              const Icon = platformIcon(link.platform);
              return (
                <a
                  key={link.id ?? `${link.platform}-${link.url}`}
                  href={link.url.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={platformAriaLabel(link.platform, link.url)}
                  className="flex h-11 items-center gap-2 rounded-full border border-border px-4 text-sm text-foreground transition-all hover:border-primary hover:text-primary active:scale-95 focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <Icon className="size-4 text-primary" aria-hidden />
                  {link.platform}
                </a>
              );
            })}
          </nav>
        </section>
      )}

      <section className="rounded-3xl border border-border bg-card p-4 shadow-card">
        <SectionTitle>Scan &amp; share</SectionTitle>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <div ref={qrRef} className="shrink-0 rounded-2xl bg-white p-2.5" aria-label="QR code for this contact card" role="img">
            {qrValue ? (
              <QRCodeCanvas value={qrValue} size={132} level="M" marginSize={0} fgColor="#061C17" bgColor="#ffffff" />
            ) : (
              <div className="flex size-[132px] items-center justify-center"><QrCode className="size-8 text-muted-foreground" aria-hidden /></div>
            )}
          </div>
          <div className="grid w-full grid-cols-2 gap-2">
            <Button variant="outline" onClick={handleShare} className="h-11 rounded-full"><Share2 aria-hidden /> Share</Button>
            <Button variant="outline" onClick={handleCopyLink} className="h-11 rounded-full"><Copy aria-hidden /> Copy link</Button>
            <Button variant="outline" onClick={handleCopyDetails} className="h-11 rounded-full"><ClipboardCopy aria-hidden /> Details</Button>
            <Button variant="outline" onClick={handleQrDownload} disabled={!qrValue} className="h-11 rounded-full"><Download aria-hidden /> QR</Button>
          </div>
        </div>
      </section>
    </div>
  );

  if (preview) return <div style={brandStyle}>{body}</div>;

  return (
    <div style={brandStyle} className="fade-in min-h-screen overflow-x-hidden bg-background px-4 pb-8 pt-4">
      <div className="rise mx-auto w-full max-w-md">
        <header className="mb-4 flex items-center justify-between">
          <span className="font-display text-lg font-semibold tracking-tight text-foreground">
            Luxe<span className="text-primary">Card</span>
          </span>
          <ThemeToggle />
        </header>
        <main>{body}</main>
        <footer className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {profile.full_name} · LuxeCard ·{" "}
          <a href="/admin/login" className="underline-offset-2 hover:text-primary hover:underline">Admin</a>
        </footer>
      </div>
    </div>
  );
}
