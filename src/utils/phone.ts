export const KG_PHONE_PATTERN = /^(?:\+996|996|0)?\s?(?:5\d{2}|7\d{2}|9\d{2})[\s-]?\d{3}[\s-]?\d{3}$/;

export function normalizeKgPhone(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `996${digits.slice(1)}`;
  if (digits.length === 9) digits = `996${digits}`;
  return `+${digits}`;
}

export function isValidKgPhone(value: string): boolean {
  return KG_PHONE_PATTERN.test(value.trim());
}
