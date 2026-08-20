import { Instagram, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";
import { useTranslation } from "@/hooks/useTranslation";

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="site-footer site-footer--compact">
      <div className="container compact-footer">
        <div className="compact-footer__brand">
          <Logo inverted />
          <span>© {new Date().getFullYear()} TEHNO CENTER</span>
        </div>
        <nav className="compact-footer__links" aria-label={t("menu")}>
          <Link to="/catalog">{t("catalog")}</Link>
          <Link to="/about">{t("about")}</Link>
          <Link to="/faq">{t("faq")}</Link>
          <Link to="/contacts">{t("contacts")}</Link>
        </nav>
        <div className="compact-footer__contacts">
          <a href="tel:+996999230105"><Phone size={15} />+996 999 230 105</a>
          <span><MapPin size={15} />Бишкек, Токтогула 236</span>
          <a href="https://www.instagram.com/tehno_center2" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={17} /></a>
        </div>
      </div>
    </footer>
  );
}
