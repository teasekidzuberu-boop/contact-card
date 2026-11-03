import {
  Facebook,
  Github,
  Globe,
  Instagram,
  Linkedin,
  Link2,
  Send,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";

/** Validate an external URL: must be absolute http(s) with a hostname. */
export function isValidExternalUrl(raw: string): boolean {
  const value = raw.trim();
  if (!value) return false;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  return parsed.hostname.length > 0;
}

export const SOCIAL_PLATFORMS = [
  "LinkedIn",
  "X",
  "Instagram",
  "Facebook",
  "Telegram",
  "YouTube",
  "GitHub",
  "Website",
] as const;

export function platformIcon(platform: string): LucideIcon {
  switch (platform.toLowerCase()) {
    case "linkedin":
      return Linkedin;
    case "x":
    case "twitter":
      return Twitter;
    case "instagram":
      return Instagram;
    case "facebook":
      return Facebook;
    case "telegram":
      return Send;
    case "youtube":
      return Youtube;
    case "github":
      return Github;
    default:
      return Globe;
  }
}

export function platformAriaLabel(platform: string, url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return `${platform} — ${host} (opens in a new tab)`;
  } catch {
    return `${platform} (opens in a new tab)`;
  }
}

export { Link2 };
