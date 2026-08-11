import {
  Clock3,
  Instagram,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/hooks/useTranslation";
import { buildWhatsAppUrl } from "@/utils/whatsapp";

export default function ContactsPage() {
  const { t } = useTranslation();
  return (
    <div className="container page-space contacts-page">
      <header className="page-heading">
        <span className="eyebrow">{t("contactEyebrow")}</span>
        <h1>{t("contactsTitle")}</h1>
        <p>{t("contactsText")}</p>
      </header>
      <div className="contacts-grid">
        <section className="contact-cards">
          <a href="tel:+996999230105">
            <span>
              <Phone size={22} />
            </span>
            <div>
              <small>{t("phone")}</small>
              <strong>+996 999 230 105</strong>
              <p>{t("callStore")}</p>
            </div>
          </a>
          <a
            href={buildWhatsAppUrl("+996 999 230 105")}
            target="_blank"
            rel="noreferrer"
          >
            <span>
              <MessageCircle size={22} />
            </span>
            <div>
              <small>WhatsApp</small>
              <strong>{t("messageManager")}</strong>
              <p>{t("stockDeliveryAnswer")}</p>
            </div>
          </a>
          <a
            href="https://www.instagram.com/tehno_center2"
            target="_blank"
            rel="noreferrer"
          >
            <span>
              <Instagram size={22} />
            </span>
            <div>
              <small>Instagram</small>
              <strong>@tehno_center2</strong>
              <p>{t("dealsReviews")}</p>
            </div>
          </a>
          <div>
            <span>
              <Clock3 size={22} />
            </span>
            <div>
              <small>{t("schedule")}</small>
              <strong>09:00–19:00</strong>
              <p>{t("dailyNoDaysOff")}</p>
            </div>
          </div>
        </section>
        <section className="contact-map-card">
          <div className="map-placeholder">
            <div className="map-lines">
              <i />
              <i />
              <i />
              <i />
              <b>
                <MapPin size={18} />
              </b>
            </div>
          </div>
          <div>
            <span>{t("address")}</span>
            <h2>г. Бишкек, ул. Токтогула, 236</h2>
            <p>{t("visitConsultationText")}</p>
            <a
              href="https://maps.google.com/?q=г.%20Бишкек,%20ул.%20Токтогула,%20236"
              target="_blank"
              rel="noreferrer"
            >
              <Button icon={<MapPin size={18} />}>{t("route")}</Button>
            </a>
          </div>
        </section>
      </div>
      <section className="contact-cta">
        <div>
          <span className="eyebrow">{t("missingModelEyebrow")}</span>
          <h2>{t("leaveRequest")}</h2>
          <p>{t("missingModelText")}</p>
        </div>
        <Link to="/checkout">
          <Button size="lg" icon={<Send size={18} />}>
            {t("sendRequest")}
          </Button>
        </Link>
      </section>
    </div>
  );
}
