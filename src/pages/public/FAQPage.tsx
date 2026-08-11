import { MessageCircle } from "lucide-react";
import { FAQBlock } from "@/components/public/FAQBlock";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/hooks/useTranslation";
import { buildWhatsAppUrl } from "@/utils/whatsapp";

export default function FAQPage() {
  const { t } = useTranslation();
  return (
    <div className="container page-space faq-page">
      <header className="page-heading page-heading--center">
        <span className="eyebrow">{t("buyerHelp")}</span>
        <h1>{t("faqTitle")}</h1>
        <p>{t("faqText")}</p>
      </header>
      <div className="faq-page__content">
        <FAQBlock />
      </div>
      <section className="faq-contact">
        <span>
          <MessageCircle size={26} />
        </span>
        <div>
          <h2>{t("noAnswer")}</h2>
          <p>{t("faqContactText")}</p>
        </div>
        <a
          href={buildWhatsAppUrl("+996 999 230 105")}
          target="_blank"
          rel="noreferrer"
        >
          <Button>{t("whatsapp")}</Button>
        </a>
      </section>
    </div>
  );
}
