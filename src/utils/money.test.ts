import { describe, expect, it } from "vitest";
import { DEFAULT_INSTALLMENT_PLANS } from "@/constants/installments";
import { calculateInstallment, formatMonths, toMinor } from "@/utils/money";

describe("calculateInstallment", () => {
  it.each(DEFAULT_INSTALLMENT_PLANS.map((plan) => [plan.months, plan.rateBasisPoints]))(
    "точно считает план на %i мес. с %i базисными пунктами",
    (months, rateBasisPoints) => {
      const amount = toMinor(100_000);
      const result = calculateInstallment(amount, months, DEFAULT_INSTALLMENT_PLANS);
      const overpayment = Math.round((amount * rateBasisPoints) / 10_000);

      expect(result.rateBasisPoints).toBe(rateBasisPoints);
      expect(result.overpayment).toBe(overpayment);
      expect(result.total).toBe(amount + overpayment);
      expect(result.monthlyPayment).toBe(Math.ceil(result.total / months));
      expect(Number.isInteger(result.monthlyPayment)).toBe(true);
    },
  );

  it("не принимает отключённый срок", () => {
    const plans = DEFAULT_INSTALLMENT_PLANS.map((plan) => ({ ...plan, enabled: plan.months !== 6 }));
    expect(() => calculateInstallment(toMinor(20_000), 6, plans)).toThrow("недоступен");
  });

  it("склоняет срок для трёх языков", () => {
    expect(formatMonths(1, "ru")).toBe("1 месяц");
    expect(formatMonths(2, "ru")).toBe("2 месяца");
    expect(formatMonths(12, "ru")).toBe("12 месяцев");
    expect(formatMonths(1, "kg")).toBe("1 ай");
    expect(formatMonths(1, "en")).toBe("1 month");
    expect(formatMonths(6, "en")).toBe("6 months");
  });
});
