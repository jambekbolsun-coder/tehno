import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronLeft, LockKeyhole, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { InstallmentCalculator } from "@/components/public/InstallmentCalculator";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/hooks/useTranslation";
import { analyticsService } from "@/services/AnalyticsService";
import { useAppStore } from "@/stores/useAppStore";
import { calculateInstallment, formatMoney, formatMonths } from "@/utils/money";
import { isValidKgPhone, normalizeKgPhone } from "@/utils/phone";
import { buildLeadMessage, buildWhatsAppUrl } from "@/utils/whatsapp";

const schema = z.object({
  fullName: z.string().min(2),
  phone: z.string().refine(isValidKgPhone),
  address: z.string().min(3),
  region: z.string().min(2),
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
  method: z.enum(["full", "installment"]),
  months: z.number().int().min(1).max(12),
  comment: z.string().max(500).optional(),
  consent: z.literal(true),
});
type FormData = z.infer<typeof schema>;

export default function CheckoutPage() {
  const { language, t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const products = useAppStore((state) => state.products).filter(
    (product) => product.isVisible && !product.isArchived,
  );
  const cart = useAppStore((state) => state.cart);
  const settings = useAppStore((state) => state.settings);
  const createLead = useAppStore((state) => state.createLead);
  const clearCart = useAppStore((state) => state.clearCart);
  const showToast = useAppStore((state) => state.showToast);
  const requestedId = params.get("product");
  const cartItems = cart.flatMap((item) => {
    const product = products.find((entry) => entry.id === item.productId);
    return product ? [{ product, quantity: item.quantity }] : [];
  });
  const defaultProductId =
    requestedId ?? cartItems[0]?.product.id ?? products[0]?.id ?? "";
  const defaultMethod =
    params.get("method") === "installment" ? "installment" : "full";
  const [installmentMonths, setInstallmentMonths] = useState(6);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      productId: defaultProductId,
      quantity: 1,
      method: defaultMethod,
      months: 6,
      consent: true,
      comment: params.get("notify") ? t("notifyComment") : "",
    },
  });
  const selectedProductId = watch("productId");
  const quantity = Number(watch("quantity") || 1);
  const method = watch("method");
  const selectedProduct =
    products.find((product) => product.id === selectedProductId) ?? products[0];
  const checkoutItems = useMemo(
    () =>
      requestedId || !cartItems.length
        ? [{ product: selectedProduct, quantity }]
        : cartItems,
    [requestedId, cartItems, selectedProduct, quantity],
  );
  const total = checkoutItems.reduce(
    (sum, item) => sum + (item.product?.salePrice ?? 0) * item.quantity,
    0,
  );

  const submit = async (data: FormData) => {
    try {
      const items = checkoutItems.map((item) => ({
        productId: item.product.id,
        productName: item.product.name[language],
        quantity: item.quantity,
        unitPrice: item.product.salePrice,
      }));
      for (const item of checkoutItems) {
        if (item.quantity > item.product.stock - item.product.reserved)
          throw new Error(`${t("insufficientProduct")}: ${item.product.name[language]}`);
      }
      const installment =
        data.method === "installment"
          ? calculateInstallment(
              total,
              installmentMonths,
              settings.installmentPlans,
            )
          : undefined;
      const lead = await createLead({
        fullName: data.fullName,
        phone: normalizeKgPhone(data.phone),
        address: data.address,
        region: data.region,
        items,
        purchaseMethod: data.method,
        installment,
        comment: data.comment ?? "",
        source: "site",
      });
      analyticsService.track(
        "lead_submit",
        { leadNumber: lead.number, total },
        selectedProduct?.id,
      );
      const url = buildWhatsAppUrl(
        settings.whatsappPhone,
        buildLeadMessage(lead),
      );
      window.open(url, "_blank", "noopener,noreferrer");
      clearCart();
      navigate(`/success?lead=${encodeURIComponent(lead.number)}`);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : t("sendFailed"),
        "error",
      );
    }
  };

  return (
    <div className="container page-space checkout-page">
      <Link to="/cart" className="back-link">
        <ChevronLeft size={17} />
        {t("cart")}
      </Link>
      <header className="page-heading">
        <span className="eyebrow">{t("checkoutEyebrow")}</span>
        <h1>{t("checkoutTitle")}</h1>
        <p>{t("checkoutText")}</p>
      </header>
      <div className="checkout-layout">
        <form
          className="checkout-form"
          onSubmit={handleSubmit(submit)}
          noValidate
        >
          <section>
            <div className="form-section-title">
              <span>1</span>
              <div>
                <h2>{t("contactDetails")}</h2>
                <p>{t("managerWillContact")}</p>
              </div>
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="fullName">{t("fullName")} *</label>
                <input
                  id="fullName"
                  {...register("fullName")}
                  placeholder="Азамат Абдиев"
                  aria-invalid={!!errors.fullName}
                />
                {errors.fullName && (
                  <span className="field-error">{t("required")}</span>
                )}
              </div>
              <div className="field">
                <label htmlFor="phone">{t("phone")} *</label>
                <input
                  id="phone"
                  {...register("phone")}
                  placeholder="+996 555 123 456"
                  inputMode="tel"
                  aria-invalid={!!errors.phone}
                />
                {errors.phone && (
                  <span className="field-error">{t("invalidPhone")}</span>
                )}
              </div>
              <div className="field field--wide">
                <label htmlFor="address">{t("address")} *</label>
                <input
                  id="address"
                  {...register("address")}
                  placeholder={t("streetHouse")}
                  aria-invalid={!!errors.address}
                />
                {errors.address && (
                  <span className="field-error">{t("required")}</span>
                )}
              </div>
              <div className="field field--wide">
                <label htmlFor="region">{t("region")} *</label>
                <select id="region" {...register("region")}>
                  <option value="">{t("chooseRegion")}</option>
                  {[
                    "Бишкек",
                    "Ош",
                    "Чуй",
                    "Иссык-Куль",
                    "Нарын",
                    "Талас",
                    "Джалал-Абад",
                    "Баткен",
                  ].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                {errors.region && (
                  <span className="field-error">{t("required")}</span>
                )}
              </div>
            </div>
          </section>
          <section>
            <div className="form-section-title">
              <span>2</span>
              <div>
                <h2>{t("productAndQuantity")}</h2>
                <p>{t("cartIncludedText")}</p>
              </div>
            </div>
            {requestedId || !cartItems.length ? (
              <div className="form-grid">
                <div className="field field--wide">
                  <label htmlFor="productId">{t("product")} *</label>
                  <select id="productId" {...register("productId")}>
                    {products.map((product) => (
                      <option value={product.id} key={product.id}>
                        {product.name[language]} —{" "}
                        {formatMoney(product.salePrice)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="quantity">{t("quantity")} *</label>
                  <input
                    id="quantity"
                    type="number"
                    min="1"
                    max={selectedProduct?.stock ?? 1}
                    {...register("quantity", { valueAsNumber: true })}
                  />
                </div>
              </div>
            ) : (
              <div className="checkout-cart-note">
                <ShoppingBag size={20} />
                <span>{t("fromCartAdded")} {cartItems.length} {t("positions")}</span>
                <Link to="/cart">{t("change")}</Link>
              </div>
            )}
          </section>
          <section>
            <div className="form-section-title">
              <span>3</span>
              <div>
                <h2>{t("purchaseMethod")}</h2>
                <p>{t("paymentChoiceText")}</p>
              </div>
            </div>
            <div className="payment-methods">
              <label className={method === "full" ? "active" : ""}>
                <input type="radio" value="full" {...register("method")} />
                <span>
                  <Check size={17} />
                </span>
                <div>
                  <strong>{t("regularPayment")}</strong>
                  <small>{t("paymentAfterConfirmation")}</small>
                </div>
              </label>
              <label className={method === "installment" ? "active" : ""}>
                <input
                  type="radio"
                  value="installment"
                  {...register("method")}
                />
                <span>
                  <Check size={17} />
                </span>
                <div>
                  <strong>{t("installment")}</strong>
                  <small>{t("oneToTwelve")}</small>
                </div>
              </label>
            </div>
            {method === "installment" && (
              <div className="field">
                <label htmlFor="months">{t("term")}</label>
                <select
                  id="months"
                  value={installmentMonths}
                  onChange={(event) => {
                    const months = Number(event.target.value);
                    setInstallmentMonths(months);
                    setValue("months", months, { shouldValidate: true });
                  }}
                >
                  {settings.installmentPlans
                    .filter((plan) => plan.enabled)
                    .map((plan) => (
                      <option value={plan.months} key={plan.id}>
                        {formatMonths(plan.months, language)}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </section>
          <section>
            <div className="field">
              <label htmlFor="comment">{t("comment")}</label>
              <textarea
                id="comment"
                rows={4}
                {...register("comment")}
                placeholder={t("convenientTime")}
              />
            </div>
            <label className="checkbox-field">
              <input type="checkbox" {...register("consent")} />
              <span>{t("consent")}</span>
            </label>
            {errors.consent && (
              <span className="field-error">{t("confirmConsent")}</span>
            )}
            <Button type="submit" block size="lg" disabled={isSubmitting}>
              {t("sendRequest")}
            </Button>
            <p className="secure-note">
              <LockKeyhole size={15} />
              {t("localDemoData")}
            </p>
          </section>
        </form>
        <aside className="checkout-aside">
          <div className="checkout-products">
            <h2>{t("yourOrder")}</h2>
            {checkoutItems.map((item) => (
              <div key={item.product.id}>
                <img
                  src={item.product.images[0].url}
                  alt={item.product.name[language]}
                />
                <span>
                  <strong>{item.product.name[language]}</strong>
                  <small>
                    {item.quantity} × {formatMoney(item.product.salePrice)}
                  </small>
                </span>
                <b>{formatMoney(item.product.salePrice * item.quantity)}</b>
              </div>
            ))}
            <footer>
              <span>{t("total")}</span>
              <strong>{formatMoney(total)}</strong>
            </footer>
          </div>
          {method === "installment" && (
            <InstallmentCalculator
              amount={total}
              value={installmentMonths}
              onChange={setInstallmentMonths}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
