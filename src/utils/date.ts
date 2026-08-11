export const nowIso = () => new Date().toISOString();

export function formatDate(value: string, locale = "ru-RU"): string {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: string, locale = "ru-RU"): string {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function isPromotionActive(startAt: string, endAt?: string): boolean {
  const now = Date.now();
  return new Date(startAt).getTime() <= now && (!endAt || new Date(endAt).getTime() > now);
}
