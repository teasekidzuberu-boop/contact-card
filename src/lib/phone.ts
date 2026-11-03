/**
 * Normalize a phone number into E.164-ish digits for wa.me / tel: links.
 * Returns null when the number cannot be a valid phone number.
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;
  const hadPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  // Optional leading zero from national formats only when no country code given.
  let e164 = digits;
  if (!hadPlus && digits.startsWith("0")) {
    e164 = digits.replace(/^0+/, "");
  }
  // E.164: max 15 digits, min 7 for a usable number.
  if (e164.length < 7 || e164.length > 15) return null;
  return e164;
}

export function buildWhatsAppUrl(
  phone: string | null | undefined,
  message?: string,
): string | null {
  const digits = normalizePhone(phone);
  if (!digits) return null;
  const base = `https://wa.me/${digits}`;
  const text = message?.trim();
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

