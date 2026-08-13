import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { ProductGrid } from "@/components/public/ProductGrid";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppStore } from "@/stores/useAppStore";

export default function FavoritesPage() {
  const { t } = useTranslation();
  const ids = useAppStore((state) => state.favorites);
  const products = useAppStore((state) => state.products).filter((product) =>
    ids.includes(product.id),
  );
  const clear = useAppStore((state) => state.clearFavorites);
  const addToCart = useAppStore((state) => state.addToCart);
  const showToast = useAppStore((state) => state.showToast);
  const moveAll = () => {
    let added = 0;
    products.forEach((product) => {
      try {
        addToCart(product.id);
        added += 1;
      } catch {
        /* unavailable items stay saved */
      }
    });
    showToast(`${t("addedToCartCount")}: ${added}`, added ? "success" : "error");
  };
  return (
    <div className="container page-space collection-page">
      <header className="collection-header">
        <div>
          <span className="eyebrow">{t("saved")}</span>
          <h1>{t("favorites")}</h1>
          <p>{products.length} {t("productsUnit")}</p>
        </div>
        {products.length > 0 && (
          <div>
            <Button
              variant="secondary"
              icon={<ShoppingCart size={18} />}
              onClick={moveAll}
            >
              {t("addAvailableCart")}
            </Button>
            <Button
              variant="ghost"
              icon={<Trash2 size={18} />}
              onClick={() => window.confirm(t("clearFavoritesConfirm")) && clear()}
            >
              {t("clearFavorites")}
            </Button>
          </div>
        )}
      </header>
      {products.length ? (
        <ProductGrid products={products} />
      ) : (
        <EmptyState
          icon={<Heart size={32} />}
          title={t("emptyFavorites")}
          text={t("emptyFavoritesText")}
          action={
            <Link to="/catalog">
              <Button>{t("goCatalog")}</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
