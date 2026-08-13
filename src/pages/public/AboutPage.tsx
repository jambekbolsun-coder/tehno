import {
  BadgePercent,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Store,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/hooks/useTranslation";
import { buildWhatsAppUrl } from "@/utils/whatsapp";

export default function AboutPage() {
  const { t } = useTranslation();
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="container about-hero__grid">
          <div>
            <span className="eyebrow">{t("aboutEyebrow")}</span>
            <h1>{t("aboutTitle")}</h1>
            <p className="lead">{t("aboutLead")}</p>
            <p>{t("aboutStory")}</p>
            <div className="hero-actions">
              <Link to="/catalog">
                <Button size="lg">{t("goCatalog")}</Button>
              </Link>
              <a
                href={buildWhatsAppUrl("+996 999 230 105")}
                target="_blank"
                rel="noreferrer"
              >
                <Button size="lg" variant="secondary">
                  {t("whatsapp")}
                </Button>
              </a>
            </div>
          </div>
          <div className="about-hero__image">
            <img
              src="/tehno-center-store.jpg"
              alt="Магазин TEHNO CENTER на улице Токтогула, 236 в Бишкеке"
            />
            <span>
              <Store size={19} />
              {t("storeInBishkek")}
            </span>
          </div>
        </div>
      </section>
      <section className="section container about-values">
        <article>
          <ShieldCheck size={25} />
          <h2>{t("warranty")}</h2>
          <p>{t("guaranteeDetail")}</p>
        </article>
        <article>
          <Truck size={25} />
          <h2>{t("delivery")}</h2>
          <p>{t("deliveryDetail")}</p>
        </article>
        <article>
          <BadgePercent size={25} />
          <h2>{t("installment")}</h2>
          <p>{t("installmentDetail")}</p>
        </article>
      </section>
      <section className="section section--dark">
        <div className="container assortment-section">
          <div>
            <span className="eyebrow">{t("assortmentEyebrow")}</span>
            <h2>{t("assortmentTitle")}</h2>
            <p>{t("assortmentText")}</p>
          </div>
          <ul>
            <li>
              <CheckCircle2 size={18} />
              {t("kitchenTech")}
            </li>
            <li>
              <CheckCircle2 size={18} />
              {t("cleaningTech")}
            </li>
            <li>
              <CheckCircle2 size={18} />
              {t("largeTech")}
            </li>
            <li>
              <CheckCircle2 size={18} />
              {t("climateTech")}
            </li>
            <li>
              <CheckCircle2 size={18} />
              {t("electronicsTech")}
            </li>
            <li>
              <CheckCircle2 size={18} />
              {t("brandsModels")}
            </li>
          </ul>
        </div>
      </section>
      <section className="section container website-discount">
        <div className="website-discount__icon">
          <BadgePercent size={42} />
        </div>
        <div>
          <span className="eyebrow">{t("specialForYou")}</span>
          <h2>{t("siteDiscount")}</h2>
          <p>{t("siteDiscountText")}</p>
          <div>
            <a
              href="https://maps.google.com/?q=г.%20Бишкек,%20ул.%20Токтогула,%20236"
              target="_blank"
              rel="noreferrer"
            >
              <Button icon={<MapPin size={18} />}>{t("route")}</Button>
            </a>
            <Link to="/contacts">
              <Button variant="ghost">{t("contacts")}</Button>
            </Link>
          </div>
        </div>
      </section>
      <section className="container about-map">
        <div>
          <MapPin size={30} />
          <strong>г. Бишкек, ул. Токтогула, 236</strong>
          <span>{t("workingHours")}</span>
        </div>
        <div className="map-lines" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <b>236</b>
        </div>
      </section>
    </div>
  );
}
