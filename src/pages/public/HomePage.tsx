import {
  AirVent,
  ArrowRight,
  BadgePercent,
  ChefHat,
  CircleCheck,
  HeartPulse,
  MapPin,
  Refrigerator,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Tv,
} from "lucide-react";
import { Link } from "react-router-dom";
import { FAQBlock } from "@/components/public/FAQBlock";
import { ProductGrid } from "@/components/public/ProductGrid";
import { QuickLeadForm } from "@/components/public/QuickLeadForm";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppStore } from "@/stores/useAppStore";
import { buildWhatsAppUrl } from "@/utils/whatsapp";

const categoryIcons = {
  ChefHat,
  Sparkles,
  AirVent,
  Refrigerator,
  Tv,
  HeartPulse,
};

export default function HomePage() {
  const { language, t } = useTranslation();
  const products = useAppStore((state) => state.products).filter(
    (product) => product.isVisible && !product.isArchived,
  );
  const categories = useAppStore((state) => state.categories).filter(
    (category) => category.isVisible,
  );
  const recommended = [...products]
    .sort(
      (a, b) =>
        Number(b.isFeatured) - Number(a.isFeatured) || b.views - a.views,
    )
    .slice(0, 9);
  const popular = [...products].sort((a, b) => b.views - a.views).slice(0, 5);
  const heroProducts = products.slice(0, 3);
  return (
    <>
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="hero-eyebrow">
              <span />
              <b>{t("heroEyebrow")}</b>
            </span>
            <h1>{t("heroTitle")}</h1>
            <p>{t("heroText")}</p>
            <div className="hero-actions">
              <Link to="/catalog">
                <Button size="lg" icon={<ArrowRight size={19} />}>
                  {t("goCatalog")}
                </Button>
              </Link>
              <a href="#recommendations">
                <Button
                  size="lg"
                  variant="secondary"
                  icon={<BadgePercent size={19} />}
                >
                  {t("seePromotions")}
                </Button>
              </a>
            </div>
            <div className="hero-proof">
              <div>
                <strong>4.9</strong>
                <span>
                  <span>
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                  </span>
                  {t("customerChoice")}
                </span>
              </div>
              <div>
                <strong>500+</strong>
                <span>{t("catalogModels")}</span>
              </div>
            </div>
          </div>
          <div className="hero-visual" aria-label={t("storeImageAlt")}>
            <div className="hero-visual__glow" />
            <div className="hero-product hero-product--main">
              <span className="hero-product__tag">{t("weekHit")}</span>
              <img
                src={heroProducts[0]?.images[0].url}
                alt={heroProducts[0]?.name[language]}
                fetchPriority="high"
              />
              <div>
                <span>{heroProducts[0]?.brand}</span>
                <strong>{heroProducts[0]?.name[language]}</strong>
              </div>
            </div>
            <div className="hero-product hero-product--top">
              <img
                src={heroProducts[2]?.images[0].url}
                alt={heroProducts[2]?.name[language]}
              />
              <span>{t("smartCleaning")}</span>
            </div>
            <div className="hero-product hero-product--bottom">
              <img
                src={heroProducts[1]?.images[0].url}
                alt={heroProducts[1]?.name[language]}
              />
              <span>{t("warranty12Short")}</span>
            </div>
            <span className="hero-floating-badge">
              <CircleCheck size={18} />
              {t("verified")}
            </span>
          </div>
        </div>
        <div className="container trust-strip">
          <div>
            <span>
              <Truck size={21} />
            </span>
            <div>
              <strong>{t("delivery")}</strong>
              <small>{t("deliveryText")}</small>
            </div>
          </div>
          <div>
            <span>
              <ShieldCheck size={21} />
            </span>
            <div>
              <strong>{t("warranty")}</strong>
              <small>{t("warrantyText")}</small>
            </div>
          </div>
          <div>
            <span>
              <BadgePercent size={21} />
            </span>
            <div>
              <strong>{t("installment")}</strong>
              <small>{t("installmentText")}</small>
            </div>
          </div>
        </div>
      </section>

      <section className="section container" id="recommendations">
        <SectionHeading
          eyebrow="TEHNO CHOICE"
          title={t("recommendations")}
          text={t("recommendationsText")}
          action={
            <Link to="/catalog" className="text-link">
              {t("allProducts")}
              <ArrowRight size={17} />
            </Link>
          }
        />
        <ProductGrid products={recommended} />
        <div className="section-center-action">
          <Link to="/catalog">
            <Button size="lg" variant="dark" icon={<ArrowRight size={19} />}>
              {t("allProducts")}
            </Button>
          </Link>
        </div>
      </section>

      <section className="section section--soft">
        <div className="container">
          <SectionHeading title={t("categories")} text={t("categoriesText")} />
          <div className="category-grid">
            {categories.map((category, index) => {
              const Icon =
                categoryIcons[category.icon as keyof typeof categoryIcons] ??
                Sparkles;
              return (
                <Link
                  to={`/catalog?category=${category.id}`}
                  className={`category-tile category-tile--${index + 1}`}
                  key={category.id}
                >
                  <span>
                    <Icon size={28} />
                  </span>
                  <strong>{category.name[language]}</strong>
                  <small>
                    {
                      products.filter(
                        (product) => product.categoryId === category.id,
                      ).length
                    }{" "}
                    {t("productsUnit")}
                  </small>
                  <ArrowRight size={18} />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section container">
        <SectionHeading
          title={t("popular")}
          text={t("popularText")}
        />
        <ProductGrid products={popular} />
      </section>

      <section className="section why-section">
        <div className="container why-grid">
          <div className="why-copy">
            <span className="eyebrow">TEHNO CARE</span>
            <h2>{t("whyUs")}</h2>
            <p>{t("servicePrinciple")}</p>
            <a
              href={buildWhatsAppUrl("+996 999 230 105")}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="secondary" size="lg">
                {t("whatsapp")}
              </Button>
            </a>
          </div>
          <div className="why-cards">
            <article>
              <span>01</span>
              <h3>{t("why1")}</h3>
              <p>{t("why1Text")}</p>
            </article>
            <article>
              <span>02</span>
              <h3>{t("why2")}</h3>
              <p>{t("why2Text")}</p>
            </article>
            <article>
              <span>03</span>
              <h3>{t("why3")}</h3>
              <p>{t("why3Text")}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section container store-visit">
        <div className="store-visit__visual">
          <img
            src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=84"
            alt={t("storeImageAlt")}
            loading="lazy"
          />
          <span>
            <MapPin size={18} />
            {t("bishkekAddressShort")}
          </span>
        </div>
        <div className="store-visit__copy">
          <span className="eyebrow">OFFLINE BONUS</span>
          <h2>{t("visitTitle")}</h2>
          <p>{t("visitText")}</p>
          <ul>
            <li>
              <CircleCheck size={18} />
              {t("visitBenefit1")}
            </li>
            <li>
              <CircleCheck size={18} />
              {t("visitBenefit2")}
            </li>
            <li>
              <CircleCheck size={18} />
              {t("visitBenefit3")}
            </li>
          </ul>
          <div>
            <a
              href="https://maps.google.com/?q=г.%20Бишкек,%20ул.%20Токтогула,%20236"
              target="_blank"
              rel="noreferrer"
            >
              <Button size="lg" icon={<MapPin size={18} />}>
                {t("route")}
              </Button>
            </a>
            <Link to="/about">
              <Button size="lg" variant="ghost">
                {t("about")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="section section--soft">
        <div className="container faq-home-grid">
          <div>
            <span className="eyebrow">{t("buyerHelpEyebrow")}</span>
            <h2>{t("faqTitle")}</h2>
            <p>{t("faqText")}</p>
            <Link to="/faq" className="text-link">
              {t("allQuestions")}
              <ArrowRight size={17} />
            </Link>
          </div>
          <FAQBlock limit={5} />
        </div>
      </section>

      <section className="section container request-section">
        <div className="request-copy">
          <span className="eyebrow">{t("quickStartEyebrow")}</span>
          <h2>{t("quickRequest")}</h2>
          <p>{t("quickRequestText")}</p>
          <div className="request-stats">
            <div>
              <strong>≤ 15 мин</strong>
              <span>{t("avgResponse")}</span>
            </div>
            <div>
              <strong>{t("fiveManagers")}</strong>
              <span>{t("roundRobinDistribution")}</span>
            </div>
          </div>
        </div>
        <QuickLeadForm />
      </section>
    </>
  );
}
