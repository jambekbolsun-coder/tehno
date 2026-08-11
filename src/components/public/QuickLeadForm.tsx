import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/hooks/useTranslation";
import { analyticsService } from "@/services/AnalyticsService";
import { useAppStore } from "@/stores/useAppStore";
import { isValidKgPhone, normalizeKgPhone } from "@/utils/phone";

const schema = z.object({
  fullName: z.string().min(2),
  phone: z.string().refine(isValidKgPhone),
  productId: z.string().min(1),
  consent: z.literal(true),
});
type FormData = z.infer<typeof schema>;

export function QuickLeadForm() {
  const { language, t } = useTranslation();
  const products = useAppStore((state) => state.products).filter(
    (product) => product.isVisible && !product.isArchived,
  );
  const createLead = useAppStore((state) => state.createLead);
  const showToast = useAppStore((state) => state.showToast);
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { consent: true, productId: products[0]?.id ?? "" },
  });
  const submit = async (data: FormData) => {
    try {
      const product = products.find((item) => item.id === data.productId)!;
      const lead = await createLead({
      fullName: data.fullName,
      phone: normalizeKgPhone(data.phone),
      address: t("detailsToConfirm"),
      region: t("detailsToConfirm"),
      items: [
        {
          productId: product.id,
          productName: product.name[language],
          quantity: 1,
          unitPrice: product.salePrice,
        },
      ],
      purchaseMethod: "full",
      comment: t("quickLeadComment"),
      source: "site",
    });
      analyticsService.track("lead_submit", { leadNumber: lead.number }, product.id);
      setSent(true);
      window.setTimeout(() => navigate(`/success?lead=${lead.number}`), 800);
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("sendFailed"), "error");
    }
  };
  if (sent)
    return (
      <div className="quick-form-success">
        <CheckCircle2 size={38} />
        <h3>{t("successTitle")}</h3>
        <p>{t("successText")}</p>
      </div>
    );
  return (
    <form
      className="quick-lead-form"
      onSubmit={handleSubmit(submit)}
      noValidate
    >
      <div className="field">
        <label htmlFor="quick-name">{t("fullName")}</label>
        <input
          id="quick-name"
          {...register("fullName")}
          placeholder="Азамат Абдиев"
          aria-invalid={!!errors.fullName}
        />
        {errors.fullName && (
          <span className="field-error">{t("required")}</span>
        )}
      </div>
      <div className="field">
        <label htmlFor="quick-phone">{t("phone")}</label>
        <input
          id="quick-phone"
          {...register("phone")}
          placeholder="+996 555 123 456"
          inputMode="tel"
          aria-invalid={!!errors.phone}
        />
        {errors.phone && (
          <span className="field-error">{t("invalidPhone")}</span>
        )}
      </div>
      <div className="field">
        <label htmlFor="quick-product">{t("product")}</label>
        <select id="quick-product" {...register("productId")}>
          {products.slice(0, 12).map((product) => (
            <option key={product.id} value={product.id}>
              {product.name[language]}
            </option>
          ))}
        </select>
      </div>
      <label className="checkbox-field">
        <input type="checkbox" {...register("consent")} />
        <span>{t("consent")}</span>
      </label>
      <Button
        type="submit"
        size="lg"
        icon={<ArrowRight size={18} />}
        disabled={isSubmitting}
      >
        {t("sendRequest")}
      </Button>
    </form>
  );
}
