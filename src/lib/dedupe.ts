// =====================================================================
//  Phone normalisation, validation & dedupe helpers
// =====================================================================

/** Strip everything except digits (keep a leading +). */
export function normalizePhone(raw: string, defaultCountryCode = "91"): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  let digits = trimmed.replace(/[^\d]/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  // Already has country code (12 digits starting with 91)
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  // 10-digit Indian mobile
  if (digits.length === 10) return `+${defaultCountryCode}${digits}`;
  // Generic fallback
  if (digits.length > 10 && !digits.startsWith(defaultCountryCode)) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

export function isValidIndianMobile(phone: string): boolean {
  const digits = phone.replace(/[^\d]/g, "");
  // +91 followed by 10 digits starting 6-9
  return /^91[6-9]\d{9}$/.test(digits);
}

export function isValidEmail(email?: string | null): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Match key used for de-duplication (normalised phone). */
export function dedupeKey(phone: string): string {
  return normalizePhone(phone);
}
