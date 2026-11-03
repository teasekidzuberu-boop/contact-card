import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  LogOut,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SOCIAL_PLATFORMS, isValidExternalUrl } from "@/lib/social";
import type { SocialLink } from "@/lib/types";

const AVATAR_PATH = "avatar";
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface ProfileForm {
  slug: string;
  full_name: string;
  title: string;
  organization: string;
  bio: string;
  phone: string;
  whatsapp_number: string;
  whatsapp_message: string;
  email: string;
  location: string;
  website: string;
  published: boolean;
}

interface LinkRow extends SocialLink {
  _key: string;
}

const EMPTY_FORM: ProfileForm = {
  slug: "",
  full_name: "",
  title: "",
  organization: "",
  bio: "",
  phone: "",
  whatsapp_number: "",
  whatsapp_message: "",
  email: "",
  location: "",
  website: "",
  published: true,
};

let linkKeyCounter = 0;
const nextLinkKey = () => `link-${++linkKeyCounter}-${Date.now()}`;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: rows, error } = await supabase
        .from("card_profile")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(1);
      if (cancelled) return;
      if (error) {
        setLoadError(error.message);
        setLoading(false);
        return;
      }
      let row = rows?.[0];
      if (!row) {
        // First visit after setup: create an empty, unpublished starter card.
        const { data: created, error: createError } = await supabase
          .from("card_profile")
          .insert({ slug: "my-card", published: false })
          .select("*")
          .single();
        if (cancelled) return;
        if (createError || !created) {
          setLoadError(createError?.message ?? "Could not create your card.");
          setLoading(false);
          return;
        }
        row = created;
      }
      setProfileId(row.id);
      setForm({
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
        published: row.published,
      });
      setAvatarPath(row.avatar_path);

      const { data: linkRows, error: linkError } = await supabase
        .from("social_links")
        .select("id, platform, url, position")
        .eq("profile_id", row.id)
        .order("position", { ascending: true });
      if (cancelled) return;
      if (!linkError) {
        setLinks((linkRows ?? []).map((l) => ({ ...l, _key: l.id ?? nextLinkKey() })));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const set = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const updateLink = (key: string, patch: Partial<LinkRow>) =>
    setLinks((ls) => ls.map((l) => (l._key === key ? { ...l, ...patch } : l)));

  const moveLink = (index: number, direction: -1 | 1) =>
    setLinks((ls) => {
      const target = index + direction;
      if (target < 0 || target >= ls.length) return ls;
      const copy = [...ls];
      const moved = copy[index];
      const swapped = copy[target];
      if (!moved || !swapped) return ls;
      copy[index] = swapped;
      copy[target] = moved;
      return copy;
    });

  const removeLink = (key: string) => setLinks((ls) => ls.filter((l) => l._key !== key));

  const addLink = () =>
    setLinks((ls) => [...ls, { platform: "LinkedIn", url: "", position: ls.length, _key: nextLinkKey() }]);

  const handlePhotoChange = (file: File | null) => {
    if (file && !file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file && file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be 5 MB or smaller");
      return;
    }
    setPhotoFile(file);
  };

  const handleSave = async () => {
    if (!profileId) return;
    if (!form.full_name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!SLUG_RE.test(form.slug.trim())) {
      toast.error("Slug may only contain lowercase letters, numbers and dashes");
      return;
    }
    const filledLinks = links.filter((l) => l.url.trim() !== "");
    const invalid = filledLinks.find((l) => !isValidExternalUrl(l.url));
    if (invalid) {
      toast.error(`Invalid URL for ${invalid.platform} — must start with http:// or https://`);
      return;
    }

    setSaving(true);
    try {
      let nextAvatarPath = avatarPath;
      if (photoFile) {
        const { error: uploadError } = await supabase.storage
          .from("profile-photos")
          .upload(AVATAR_PATH, photoFile, { upsert: true, contentType: photoFile.type });
        if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`);
        nextAvatarPath = AVATAR_PATH;
        setAvatarPath(AVATAR_PATH);
        setPhotoFile(null);
        setAvatarVersion((v) => v + 1);
      }

      const { error: updateError } = await supabase
        .from("card_profile")
        .update({
          slug: form.slug.trim(),
          full_name: form.full_name.trim(),
          title: form.title.trim(),
          organization: form.organization.trim(),
          bio: form.bio.trim(),
          phone: form.phone.trim(),
          whatsapp_number: form.whatsapp_number.trim(),
          whatsapp_message: form.whatsapp_message.trim(),
          email: form.email.trim(),
          location: form.location.trim(),
          website: form.website.trim(),
          published: form.published,
          avatar_path: nextAvatarPath,
        })
        .eq("id", profileId);
      if (updateError) throw new Error(updateError.message);

      // Replace the full link set (removes deleted rows, saves order).
      const { error: deleteError } = await supabase
        .from("social_links")
        .delete()
        .eq("profile_id", profileId);
      if (deleteError) throw new Error(deleteError.message);
      if (filledLinks.length > 0) {
        const { error: insertError } = await supabase.from("social_links").insert(
          filledLinks.map((l, index) => ({
            profile_id: profileId,
            platform: l.platform,
            url: l.url.trim(),
            position: index,
          })),
        );
        if (insertError) throw new Error(insertError.message);
      }

      toast.success(
        form.published ? "Saved — your card is live" : "Saved — card is hidden (unpublished)",
      );
    } catch (err) {
      toast.error("Save failed", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", search: { denied: undefined }, replace: true });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" aria-label="Loading dashboard" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="font-display text-2xl text-foreground">Dashboard unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
          <Button variant="outline" className="mt-4" onClick={handleLogout}>
            <LogOut aria-hidden /> Sign out
          </Button>
        </div>
      </div>
    );
  }

  const field = "bg-background/60";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <h1 className="font-display text-xl text-foreground">Contact card admin</h1>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/p/$slug" params={{ slug: form.slug }} target="_blank" rel="noopener noreferrer">
                <ExternalLink aria-hidden /> Preview
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut aria-hidden /> Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6 pb-28">
        {!form.published && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground"
          >
            <EyeOff className="size-4 text-destructive" aria-hidden />
            Card is unpublished — visitors see “Contact card unavailable” until you publish it.
          </div>
        )}

        {/* Identity */}
        <section className="rounded-2xl border border-border bg-card p-5" aria-labelledby="identity-heading">
          <h2 id="identity-heading" className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">
            Identity
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="size-16 shrink-0 overflow-hidden rounded-full border border-border">
                {avatarPath ? (
                  <img
                    src={`/api/public/profile-photo/${avatarPath}?v=${avatarVersion}`}
                    alt="Current profile photo"
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-secondary text-xs text-muted-foreground">
                    No photo
                  </div>
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
                />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <ImagePlus aria-hidden /> {photoFile ? photoFile.name : "Choose photo"}
                </Button>
                <p className="mt-1 text-xs text-muted-foreground">JPG/PNG/WebP, up to 5 MB</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name *</Label>
              <Input id="full_name" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} className={field} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Professional title</Label>
                <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} className={field} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Input id="organization" value={form.organization} onChange={(e) => set("organization", e.target.value)} className={field} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Short bio</Label>
              <Textarea id="bio" rows={3} value={form.bio} onChange={(e) => set("bio", e.target.value)} className={field} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Profile slug (public URL) *</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                className={field}
                placeholder="your-name"
              />
              <p className="text-xs text-muted-foreground">Public card: /p/{form.slug || "your-slug"}</p>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="rounded-2xl border border-border bg-card p-5" aria-labelledby="contact-heading">
          <h2 id="contact-heading" className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">
            Contact details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone — text message (SMS)</Label>
              <Input id="phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={field} placeholder="+234 …" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp_number">WhatsApp number</Label>
              <Input id="whatsapp_number" type="tel" value={form.whatsapp_number} onChange={(e) => set("whatsapp_number", e.target.value)} className={field} placeholder="+234 …" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={field} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={form.location} onChange={(e) => set("location", e.target.value)} className={field} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" type="url" value={form.website} onChange={(e) => set("website", e.target.value)} className={field} placeholder="https://…" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="whatsapp_message">WhatsApp pre-filled message</Label>
              <Input id="whatsapp_message" value={form.whatsapp_message} onChange={(e) => set("whatsapp_message", e.target.value)} className={field} />
            </div>
          </div>
        </section>

        {/* Social links */}
        <section className="rounded-2xl border border-border bg-card p-5" aria-labelledby="links-heading">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="links-heading" className="text-sm font-semibold uppercase tracking-widest text-primary">
              Social links
            </h2>
            <Button variant="outline" size="sm" onClick={addLink}>
              <Plus aria-hidden /> Add
            </Button>
          </div>
          {links.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No social links yet. Only links you add here will appear on the card.
            </p>
          ) : (
            <ul className="space-y-3">
              {links.map((link, index) => (
                <li key={link._key} className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <button
                      type="button"
                      aria-label="Move link up"
                      disabled={index === 0}
                      onClick={() => moveLink(index, -1)}
                      className="rounded p-0.5 text-muted-foreground hover:text-primary disabled:opacity-30"
                    >
                      <ArrowUp className="size-3.5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label="Move link down"
                      disabled={index === links.length - 1}
                      onClick={() => moveLink(index, 1)}
                      className="rounded p-0.5 text-muted-foreground hover:text-primary disabled:opacity-30"
                    >
                      <ArrowDown className="size-3.5" aria-hidden />
                    </button>
                  </div>
                  <select
                    aria-label={`Platform for link ${index + 1}`}
                    value={link.platform}
                    onChange={(e) => updateLink(link._key, { platform: e.target.value })}
                    className="h-9 rounded-md border border-input bg-background/60 px-2 text-sm text-foreground"
                  >
                    {SOCIAL_PLATFORMS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={link.url}
                    onChange={(e) => updateLink(link._key, { url: e.target.value })}
                    placeholder="https://…"
                    className={`flex-1 ${field}`}
                    aria-label={`URL for ${link.platform}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${link.platform} link`}
                    onClick={() => removeLink(link._key)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Visibility */}
        <section className="flex items-center justify-between rounded-2xl border border-border bg-card p-5" aria-labelledby="visibility-heading">
          <div>
            <h2 id="visibility-heading" className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-primary">
              {form.published ? <Eye className="size-4" aria-hidden /> : <EyeOff className="size-4" aria-hidden />}
              Visibility
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {form.published ? "Published — the public card is live." : "Hidden from all visitors."}
            </p>
          </div>
          <Switch
            checked={form.published}
            onCheckedChange={(checked) => set("published", checked)}
            aria-label="Publish card"
          />
        </section>
      </main>

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <p className="hidden text-xs text-muted-foreground sm:block">
            Changes go live on the public card after saving.
          </p>
          <Button onClick={handleSave} disabled={saving} className="ml-auto h-11 min-w-40 rounded-full font-semibold">
            {saving ? (
              <>
                <Loader2 className="animate-spin" aria-hidden /> Saving…
              </>
            ) : (
              <>
                <Save aria-hidden /> Save changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
