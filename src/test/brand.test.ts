import { describe, expect, it } from "vitest";
import { isHexColor, qrTarget, safeBrandColor } from "@/lib/brand";
import { buildWhatsAppUrl } from "@/lib/phone";

describe("brand + QR rules", () => {
  it("accepts only hex brand colors", () => {
    expect(isHexColor("#D7B56D")).toBe(true);
    expect(isHexColor("red")).toBe(false);
    expect(safeBrandColor("javascript:x")).toBe("#D7B56D");
  });
  it("QR falls back to card URL when custom destination is invalid", () => {
    expect(qrTarget("", "https://a.com/p/me")).toBe("https://a.com/p/me");
    expect(qrTarget("ftp://x", "https://a.com/p/me")).toBe("https://a.com/p/me");
    expect(qrTarget("https://other.com", "https://a.com/p/me")).toBe("https://other.com");
  });
  it("builds wa.me URL from formatted number", () => {
    expect(buildWhatsAppUrl("+234 801 234 5678", "Hi")).toBe("https://wa.me/2348012345678?text=Hi");
  });
});
