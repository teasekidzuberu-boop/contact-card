import type { PublicProfile, SocialLink } from "./types";

/**
 * Escape a value for use inside a vCard text property (RFC 6350 §3.4).
 * Backslash, comma, semicolon and newlines must be escaped.
 */
export function escapeVCardValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/** Split a full name into first / last for the N property. */
function splitName(fullName: string): { first: string; last: string } {
  const trimmed = fullName.trim();
  const idx = trimmed.indexOf(" ");
  if (idx === -1) return { first: trimmed, last: "" };
  return { first: trimmed.slice(0, idx), last: trimmed.slice(idx + 1) };
}

export function buildVCard(profile: PublicProfile, socialLinks?: SocialLink[]): string {
  const { first, last } = splitName(profile.full_name);
  const links = socialLinks ?? [];
  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeVCardValue(last)};${escapeVCardValue(first)};;;`,
    `FN:${escapeVCardValue(profile.full_name)}`,
  ];

  if (profile.organization.trim()) {
    lines.push(`ORG:${escapeVCardValue(profile.organization)}`);
  }
  if (profile.title.trim()) {
    lines.push(`TITLE:${escapeVCardValue(profile.title)}`);
  }
  if (profile.phone.trim()) {
    lines.push(`TEL;TYPE=CELL,VOICE:${escapeVCardValue(profile.phone.trim())}`);
  }
  if (profile.email.trim()) {
    lines.push(`EMAIL;TYPE=INTERNET:${escapeVCardValue(profile.email.trim())}`);
  }
  if (profile.website.trim()) {
    lines.push(`URL:${escapeVCardValue(profile.website.trim())}`);
  }
  if (profile.location.trim()) {
    lines.push(`ADR;TYPE=HOME:;;${escapeVCardValue(profile.location.trim())};;;;`);
  }
  if (links.length > 0) {
    lines.push(
      `X-SOCIALPROFILE:${links
        .map((l) => `${l.platform}:${l.url}`)
        .map(escapeVCardValue)
        .join(",")}`,
    );
  }
  if (profile.bio.trim()) {
    lines.push(`NOTE:${escapeVCardValue(profile.bio)}`);
  }

  lines.push("END:VCARD");
  // CRLF line endings are required by the vCard spec.
  return lines.join("\r\n") + "\r\n";
}

export function vCardFileName(slug: string): string {
  const safe = slug.replace(/[^a-z0-9-]/gi, "") || "contact";
  return `${safe}.vcf`;
}
