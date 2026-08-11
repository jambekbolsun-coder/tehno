import { ChevronDown } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppStore } from "@/stores/useAppStore";

export function FAQBlock({ limit }: { limit?: number }) {
  const { language } = useTranslation();
  const faqs = useAppStore((state) => state.faqs)
    .filter((faq) => faq.status === "published")
    .sort((a, b) => a.position - b.position)
    .slice(0, limit);
  return (
    <div className="faq-list">
      {faqs.map((faq) => (
        <details key={faq.id} className="faq-item">
          <summary>
            <span>{faq.question[language]}</span>
            <ChevronDown size={19} />
          </summary>
          <p>{faq.answer[language]}</p>
        </details>
      ))}
    </div>
  );
}
