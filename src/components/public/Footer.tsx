import {
  Clock3,
  Instagram,
  MapPin,
  Phone,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "@/components/public/LanguageSwitcher";
import { buildWhatsAppUrl } from "@/utils/whatsapp";

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Logo inverted />
          <p>{t("footerText")}</p>
          <div className="footer-trust">
            <span>
              <ShieldCheck size={16} />
              {t("warranty")}
            </span>
            <span>
              <Truck size={16} />
              {t("delivery")}
            </span>
          </div>
        </div>
        <details className="footer-column" open>
          <summary>{t("catalog")}</summary>
          <Link to="/catalog">{t("allProducts")}</Link>
          <Link to="/favorites">{t("favorites")}</Link>
          <Link to="/cart">{t("cart")}</Link>
          <Link to="/faq">{t("faq")}</Link>
        </details>
        <details className="footer-column" open>
          <summary>{t("contacts")}</summary>
          <a href="tel:+996999230105">
            <Phone size={15} />
            +996 999 230 105
          </a>
          <span>
            <MapPin size={15} />
            Токтогула, 236
          </span>
          <span>
            <Clock3 size={15} />
            {t("workingHours")}
          </span>
          <a
            href={buildWhatsAppUrl("+996 999 230 105")}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp
          </a>
        </details>
        <div className="footer-language">
          <span>{t("language")}</span>
          <LanguageSwitcher expanded />
          <a
            className="footer-instagram"
            href="https://www.instagram.com/tehno_center2"
            target="_blank"
            rel="noreferrer"
          >
            <Instagram size={17} />
            tehno_center2
          </a>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} TEHNO CENTER 2. {t("rights")}
        </span>
      </div>
    </footer>
  );
}
