/**
 * Normalises raw phone input to standard 10-digit Indian mobile number.
 * Kept identical to backend/src/lib/phone.ts.
 */
export function normalisePhone(raw: string): string {
  if (!raw || typeof raw !== "string") {
    throw new Error("Phone number is required");
  }

  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");

  let cleaned = digits;
  if (trimmed.startsWith("+")) {
    if (digits.length === 12 && digits.startsWith("91")) {
      cleaned = digits.slice(2);
    } else {
      throw new Error("Invalid country code, expected +91 followed by 10 digits");
    }
  } else if (digits.length === 12 && digits.startsWith("91")) {
    cleaned = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    cleaned = digits.slice(1);
  }

  if (!/^[6-9]\d{9}$/.test(cleaned)) {
    throw new Error("Phone must be a valid 10-digit Indian mobile number starting with 6-9");
  }

  return cleaned;
}
