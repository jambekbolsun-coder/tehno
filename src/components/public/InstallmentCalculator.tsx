import { Calculator, Info } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppStore } from "@/stores/useAppStore";
import {
  calculateInstallment,
  formatMoney,
  formatMonths,
  formatPercent,
} from "@/utils/money";

export function InstallmentCalculator({
  amount,
  value,
  onChange,
}: {
  amount: number;
  value?: number;
  onChange?: (months: number) => void;
}) {
  const { language, t } = useTranslation();
  const settings = useAppStore((state) => state.settings);
  const plans = settings.installmentPlans.filter((plan) => plan.enabled);
  const [localMonths, setLocalMonths] = useState(
    value ?? plans[0]?.months ?? 1,
  );
  const months = value ?? localMonths;
  const result = useMemo(
    () => calculateInstallment(amount, months, plans),
    [amount, months, plans],
  );
  const locale = language === "en" ? "en-US" : "ru-RU";
  const setMonths = (next: number) => {
    setLocalMonths(next);
    onChange?.(next);
  };
  return (
    <section className="installment-card">
      <div className="installment-card__title">
        <span>
          <Calculator size={20} />
        </span>
        <div>
          <h3>{t("installmentCalculator")}</h3>
          <p>{t("installmentText")}</p>
        </div>
      </div>
      <label className="field">
        <span>{t("term")}</span>
        <select
          value={months}
          onChange={(event) => setMonths(Number(event.target.value))}
        >
          {plans.map((plan) => (
            <option key={plan.id} value={plan.months}>
              {formatMonths(plan.months, language)} ·{" "}
              {formatPercent(plan.rateBasisPoints, locale)}
            </option>
          ))}
        </select>
      </label>
      <dl className="installment-summary">
        <div>
          <dt>{t("subtotal")}</dt>
          <dd>{formatMoney(amount)}</dd>
        </div>
        <div>
          <dt>{t("rate")}</dt>
          <dd>{formatPercent(result.rateBasisPoints, locale)}</dd>
        </div>
        <div>
          <dt>{t("overpayment")}</dt>
          <dd>{formatMoney(result.overpayment)}</dd>
        </div>
        <div>
          <dt>{t("finalAmount")}</dt>
          <dd>{formatMoney(result.total)}</dd>
        </div>
      </dl>
      <div className="monthly-payment">
        <span>{t("monthlyPayment")}</span>
        <strong>{formatMoney(result.monthlyPayment)}</strong>
      </div>
      <p className="installment-note">
        <Info size={15} />
        {settings.installmentExplanation[language]}
      </p>
    </section>
  );
}
