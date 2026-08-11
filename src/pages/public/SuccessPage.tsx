import { CheckCircle2, Copy, Home, MessageCircle } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppStore } from "@/stores/useAppStore";
import { buildLeadMessage, buildWhatsAppUrl } from "@/utils/whatsapp";

export default function SuccessPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const number = params.get("lead") ?? "TC2-DEMO";
  const lead = useAppStore((state) =>
    state.leads.find((item) => item.number === number),
  );
  const phone = useAppStore((state) => state.settings.whatsappPhone);
  return (
    <div className="container success-page page-space">
      <div className="success-card">
        <span className="success-icon">
          <CheckCircle2 size={46} />
        </span>
        <span className="eyebrow">{t("ready")}</span>
        <h1>{t("successTitle")}</h1>
        <p>{t("successText")}</p>
        <div className="success-number">
          <span>{t("requestNumber")}</span>
          <strong>{number}</strong>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(number);
            }}
            aria-label={t("copyNumber")}
          >
            <Copy size={17} />
          </button>
        </div>
        <div className="success-steps">
          <div>
            <span>1</span>
            <p>{t("requestSavedCrm")}</p>
          </div>
          <div>
            <span>2</span>
            <p>{t("managerAssigned")}</p>
          </div>
          <div>
            <span>3</span>
            <p>{t("expectContact")}</p>
          </div>
        </div>
        <div className="success-actions">
          <Link to="/">
            <Button size="lg" icon={<Home size={18} />}>
              {t("backHome")}
            </Button>
          </Link>
          {lead && (
            <a
              href={buildWhatsAppUrl(phone, buildLeadMessage(lead))}
              target="_blank"
              rel="noreferrer"
            >
              <Button
                size="lg"
                variant="secondary"
                icon={<MessageCircle size={18} />}
              >
                {t("reopenWhatsApp")}
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
