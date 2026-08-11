import type {
  InstallmentPlan,
  InstallmentSelection,
  Language,
  Money,
} from "@/types/domain";

export const toMinor = (som: number): Money => Math.round(som * 100);
export const fromMinor = (minor: Money): number => minor / 100;

export function formatMoney(minor: Money, locale = "ru-RU"): string {
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(
    fromMinor(minor),
  )} сом`;
}

export function formatPercent(basisPoints: number, locale = "ru-RU"): string {
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(
    basisPoints / 100,
  )}%`;
}

export function formatMonths(months: number, language: Language): string {
  if (language === "kg") return `${months} ай`;
  if (language === "en")
    return `${months} ${months === 1 ? "month" : "months"}`;
  const lastTwo = months % 100;
  const last = months % 10;
  const label =
    lastTwo >= 11 && lastTwo <= 14
      ? "месяцев"
      : last === 1
        ? "месяц"
        : last >= 2 && last <= 4
          ? "месяца"
          : "месяцев";
  return `${months} ${label}`;
}

export function calculateDiscountPercent(
  price: Money,
  oldPrice?: Money,
): number {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

export function calculateInstallment(
  amount: Money,
  months: number,
  plans: InstallmentPlan[],
): InstallmentSelection {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error(
      "Стоимость должна быть положительным целым числом в тыйынах",
    );
  }
  const plan = plans.find((item) => item.months === months && item.enabled);
  if (!plan) throw new Error("Выбранный срок рассрочки недоступен");

  const overpayment = Math.round((amount * plan.rateBasisPoints) / 10_000);
  const total = amount + overpayment;
  const monthlyPayment = Math.ceil(total / months);

  return {
    months,
    rateBasisPoints: plan.rateBasisPoints,
    overpayment,
    total,
    monthlyPayment,
  };
}
