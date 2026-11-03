import { describe, expect, it } from "vitest";
import { Send } from "lucide-react";
import { buildVCard, escapeVCardValue, vCardFileName } from "@/lib/vcard";
import { buildWhatsAppUrl, normalizePhone } from "@/lib/phone";
import { isValidExternalUrl, platformIcon, SOCIAL_PLATFORMS } from "@/lib/social";
import type { PublicProfile, SocialLink } from "@/lib/types";

const demoProfile: PublicProfile = {
  slug: "demo",
  full_name: "Alex Morgan",
  title: "Product Designer",
  organization: "Morgan Studio",
  bio: "Designer & builder",
  phone: "+234 800 000 0000",
  whatsapp_number: "+234 900 000 0000",
  whatsapp_message: "Hello!",
  email: "hello@example.com",
  location: "Lagos, Nigeria",
  website: "https://example.com",
  avatar_path: null,
  published: true,
};

describe("escapeVCardValue", () => {
  it("escapes backslash, comma, semicolon and newlines", () => {
    expect(escapeVCardValue("A;B,C\nD\\E")).toBe("A\\;B\\,C\\nD\\\\E");
  });

  it("handles empty strings", () => {
    expect(escapeVCardValue("")).toBe("");
  });
});

describe("buildVCard", () => {
  const links: SocialLink[] = [
    { id: "1", platform: "LinkedIn", url: "https://linkedin.com/in/demo", position: 0 },
  ];

  it("produces a valid vCard 3.0 structure with CRLF endings", () => {
    const vcf = buildVCard(demoProfile, links);
    expect(vcf.startsWith("BEGIN:VCARD\r\n")).toBe(true);
    expect(vcf.endsWith("END:VCARD\r\n")).toBe(true);
    expect(vcf).toContain("VERSION:3.0");
    expect(vcf).toContain("FN:Alex Morgan");
    expect(vcf).toContain("N:Morgan;Alex;;;");
    expect(vcf).toContain("TEL;TYPE=CELL,VOICE:+234 800 000 0000");
    expect(vcf).toContain("EMAIL;TYPE=INTERNET:hello@example.com");
    expect(vcf).toContain("TITLE:Product Designer");
    expect(vcf).toContain("ORG:Morgan Studio");
    expect(vcf).toContain("URL:https://example.com");
    expect(vcf).toContain("NOTE:Designer & builder");
  });

  it("escapes special characters in field values", () => {
    const vcf = buildVCard({ ...demoProfile, organization: "A;B,C" });
    expect(vcf).toContain("ORG:A\\;B\\,C");
  });

  it("uses a safe filename derived from the slug", () => {
    expect(vCardFileName("demo")).toBe("demo.vcf");
    expect(vCardFileName("weird/slug name")).toBe("weirdslugname.vcf");
  });
});

describe("normalizePhone", () => {
  it("strips formatting from international numbers", () => {
    expect(normalizePhone("+234 800 000 0000")).toBe("2348000000000");
  });

  it("drops leading national zero", () => {
    expect(normalizePhone("0803 123 4567")).toBe("8031234567");
  });

  it("rejects numbers that are too short or empty", () => {
    expect(normalizePhone("12345")).toBeNull();
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("not-a-phone")).toBeNull();
  });
});

describe("buildWhatsAppUrl", () => {
  it("builds a wa.me URL with a prefilled message", () => {
    expect(buildWhatsAppUrl("+234 800 000 0000", "Hi there")).toBe(
      "https://wa.me/2348000000000?text=Hi%20there",
    );
  });

  it("builds a plain wa.me URL without a message", () => {
    expect(buildWhatsAppUrl("+2348000000000")).toBe("https://wa.me/2348000000000");
  });

  it("returns null for invalid numbers", () => {
    expect(buildWhatsAppUrl("12")).toBeNull();
  });

  it("treats a missing number as no WhatsApp link, not a crash", () => {
    expect(buildWhatsAppUrl(undefined)).toBeNull();
    expect(buildWhatsAppUrl(null)).toBeNull();
    expect(normalizePhone(undefined)).toBeNull();
  });
});

describe("social platforms", () => {
  it("offers Telegram as a platform", () => {
    expect(SOCIAL_PLATFORMS).toContain("Telegram");
  });

  it("maps Telegram to the Send icon", () => {
    expect(platformIcon("Telegram")).toBe(Send);
  });
});

describe("isValidExternalUrl", () => {
  it("accepts absolute http(s) URLs", () => {
    expect(isValidExternalUrl("https://x.com/user")).toBe(true);
    expect(isValidExternalUrl("http://example.com")).toBe(true);
  });

  it("rejects javascript:, relative and garbage URLs", () => {
    expect(isValidExternalUrl("javascript:alert(1)")).toBe(false);
    expect(isValidExternalUrl("/relative/path")).toBe(false);
    expect(isValidExternalUrl("not a url")).toBe(false);
    expect(isValidExternalUrl("")).toBe(false);
  });
});
