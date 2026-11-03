import { isValidExternalUrl } from "./social";
import type { PublicProfile } from "./types";

export const DEFAULT_BRAND_COLOR = "#D7B56D";

/** Accepts #RGB or #RRGGBB hex colors only. */
export function isHexColor(value: string): boolean {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
}

export function safeBrandColor(value: string | null | undefined): string {
  return value && isHexColor(value) ? value.trim() : DEFAULT_BRAND_COLOR;
}

/** QR destination: custom URL when valid, else the public card URL. */
export function qrTarget(customUrl: string | null | undefined, cardUrl: string): string {
  return customUrl && isValidExternalUrl(customUrl) ? customUrl.trim() : cardUrl;
}

/** Plain-text summary used by "Copy details". */
export function contactDetailsText(p: PublicProfile, cardUrl: string): string {
  return [
    p.full_name,
    [p.title, p.organization].filter(Boolean).join(" · "),
    p.phone && `Phone: ${p.phone}`,
    p.whatsapp_number && `WhatsApp: ${p.whatsapp_number}`,
    p.email && `Email: ${p.email}`,
    p.location && `Location: ${p.location}`,
    p.website && `Website: ${p.website}`,
    cardUrl && `Card: ${cardUrl}`,
  ]
    .filter((l) => l && String(l).trim())
    .join("\n");
}
