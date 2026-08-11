import { ArrowLeft, SearchX } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/hooks/useTranslation";

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="container not-found page-space">
      <div className="not-found__number">
        4
        <span>
          <SearchX size={46} />
        </span>
        4
      </div>
      <h1>{t("error404")}</h1>
      <p>{t("error404Text")}</p>
      <div>
        <Link to="/">
          <Button icon={<ArrowLeft size={18} />}>{t("backHome")}</Button>
        </Link>
        <Link to="/catalog">
          <Button variant="secondary">{t("goCatalog")}</Button>
        </Link>
      </div>
    </div>
  );
}
