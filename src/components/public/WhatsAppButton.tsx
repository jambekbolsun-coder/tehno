import { MessageCircle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { buildWhatsAppUrl } from "@/utils/whatsapp";
import { analyticsService } from "@/services/AnalyticsService";

export function WhatsAppButton() {
  const { t } = useTranslation();
  return (
    <a
      className="whatsapp-fab"
      href={buildWhatsAppUrl("+996 999 230 105")}
      target="_blank"
      rel="noreferrer"
      aria-label={t("whatsapp")}
      title={t("whatsapp")}
      onClick={() => analyticsService.track("whatsapp_click")}
    >
      <MessageCircle size={24} />
      <span>WhatsApp</span>
    </a>
  );
}
