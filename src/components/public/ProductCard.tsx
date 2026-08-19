import { Heart, ShoppingCart, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppStore } from "@/stores/useAppStore";
import type { Product, PromotionType } from "@/types/domain";
import { calculateDiscountPercent, formatMoney } from "@/utils/money";
import { isPromotionActive, formatDate } from "@/utils/date";
import { analyticsService } from "@/services/AnalyticsService";

const promoKey: Record<PromotionType, "sale" | "promoDiscount" | "cashback" | "giveaway" | "hit" | "new"> = {
  sale: "sale",
  discount: "promoDiscount",
  cashback: "cashback",
  giveaway: "giveaway",
  hit: "hit",
  new: "new",
};

export function ProductCard({ product }: { product: Product }) {
  const { language, t } = useTranslation();
  const favorites = useAppStore((state) => state.favorites);
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);
  const addToCart = useAppStore((state) => state.addToCart);
  const showToast = useAppStore((state) => state.showToast);
  const activePromotion = product.promotion?.isActive && isPromotionActive(product.promotion.startAt, product.promotion.endAt)
    ? product.promotion
    : undefined;
  const price = activePromotion?.specialPrice ?? product.salePrice;
  const discount = calculateDiscountPercent(price, product.oldPrice);
  const isFavorite = favorites.includes(product.id);
  const add = () => {
    try {
      addToCart(product.id);
      analyticsService.track("cart_add", { quantity: 1 }, product.id);
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("errorGeneric"), "error");
    }
  };

  return (
    <article className="product-card">
      <div className="product-card__media">
        {activePromotion && <span className={`promo-ribbon promo-ribbon--${activePromotion.type}`}>{t(promoKey[activePromotion.type])}</span>}
        <button
          className={`favorite-button${isFavorite ? " is-active" : ""}`}
          onClick={() => {
            toggleFavorite(product.id);
            analyticsService.track("favorite_add", {}, product.id);
          }}
          aria-label={t("addFavorite")}
        >
          <Heart size={19} fill={isFavorite ? "currentColor" : "none"} />
        </button>
        <Link to={`/product/${product.slug}`} aria-label={product.name[language]}>
          <img src={product.images[0]?.url || "/logo.jpg"} alt={product.name[language]} loading="lazy" width="450" height="450" />
        </Link>
      </div>
      <div className="product-card__body">
        <div className="product-card__meta">
          <span>{product.brand}</span>
          {product.rating && <span><Star size={13} fill="currentColor" />{product.rating}</span>}
        </div>
        <Link to={`/product/${product.slug}`} className="product-card__title">{product.name[language]}</Link>
        <span className="product-card__model">{product.model}</span>
        <div className="product-card__price-row">
          <strong>{formatMoney(price)}</strong>
          {product.oldPrice && product.oldPrice > price && <del>{formatMoney(product.oldPrice)}</del>}
          {discount > 0 && <span>-{discount}%</span>}
        </div>
        {activePromotion?.endAt && <span className="product-card__deadline">{t("until")} {formatDate(activePromotion.endAt)}</span>}
        <div className="product-card__footer">
          <button className="product-cart-button" onClick={add} aria-label={t("addCart")}>
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}
