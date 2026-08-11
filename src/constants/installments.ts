import type { InstallmentPlan, LocalizedText } from "@/types/domain";

const now = "2026-08-11T00:00:00.000Z";

export const DEFAULT_INSTALLMENT_PLANS: InstallmentPlan[] = [
  [1, 300],
  [2, 450],
  [3, 600],
  [4, 800],
  [5, 950],
  [6, 1100],
  [7, 1200],
  [8, 1200],
  [9, 1300],
  [10, 1400],
  [11, 1500],
  [12, 1600],
].map(([months, rateBasisPoints]) => ({
  id: `plan-${months}`,
  months,
  rateBasisPoints,
  enabled: true,
  createdAt: now,
  updatedAt: now,
}));

export const INSTALLMENT_EXPLANATION: LocalizedText = {
  ru: "Расчёт предварительный. Финальные условия подтверждает менеджер магазина.",
  kg: "Эсеп алдын ала берилет. Акыркы шарттарды дүкөндүн менеджери тактайт.",
  en: "This is an estimate. Final terms are confirmed by the store manager.",
};
