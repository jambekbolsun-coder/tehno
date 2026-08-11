import { useAppStore } from "@/stores/useAppStore";
import { translations, type TranslationKey } from "@/translations";

export function useTranslation() {
  const language = useAppStore((state) => state.language);
  return {
    language,
    t: (key: TranslationKey) => translations[language][key] ?? translations.ru[key] ?? key,
  };
}
