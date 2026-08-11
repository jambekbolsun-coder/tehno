import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import type { Language } from "@/types/domain";
import { useTranslation } from "@/hooks/useTranslation";

const languages: Array<{ code: Language; label: string }> = [
  { code: "ru", label: "RU" },
  { code: "kg", label: "KG" },
  { code: "en", label: "EN" },
];

function Flag({ code }: { code: Language }) {
  if (code === "ru")
    return (
      <svg viewBox="0 0 24 16" aria-hidden="true">
        <rect width="24" height="5.34" fill="#fff" />
        <rect y="5.33" width="24" height="5.34" fill="#1453b8" />
        <rect y="10.66" width="24" height="5.34" fill="#d52b1e" />
      </svg>
    );
  if (code === "kg")
    return (
      <svg viewBox="0 0 24 16" aria-hidden="true">
        <rect width="24" height="16" fill="#e32636" />
        <circle cx="12" cy="8" r="3.8" fill="#ffcf00" />
        <path
          d="M12 1.5v3M12 11.5v3M5.5 8h3M15.5 8h3M7.4 3.4l2.2 2.2M14.4 10.4l2.2 2.2M16.6 3.4l-2.2 2.2M9.6 10.4l-2.2 2.2"
          stroke="#ffcf00"
          strokeWidth="1"
        />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 16" aria-hidden="true">
      <rect width="24" height="16" fill="#153b8f" />
      <path d="M0 0l24 16M24 0L0 16" stroke="#fff" strokeWidth="3" />
      <path d="M0 0l24 16M24 0L0 16" stroke="#d62d3a" strokeWidth="1.5" />
      <path d="M12 0v16M0 8h24" stroke="#fff" strokeWidth="5" />
      <path d="M12 0v16M0 8h24" stroke="#d62d3a" strokeWidth="2.7" />
    </svg>
  );
}

export function LanguageSwitcher({ expanded = false }: { expanded?: boolean }) {
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const [open, setOpen] = useState(false);
  if (expanded) {
    return (
      <div className="language-tabs" aria-label={t("language")}>
        {languages.map((item) => (
          <button
            key={item.code}
            className={language === item.code ? "active" : ""}
            onClick={() => setLanguage(item.code)}
          >
            <Flag code={item.code} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="language-switcher">
      <button
        className="language-switcher__button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Flag code={language} />
        <span>{language.toUpperCase()}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="language-switcher__menu" role="listbox">
          {languages.map((item) => (
            <button
              key={item.code}
              className={language === item.code ? "active" : ""}
              onClick={() => {
                setLanguage(item.code);
                setOpen(false);
              }}
              role="option"
              aria-selected={language === item.code}
            >
              <Flag code={item.code} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
