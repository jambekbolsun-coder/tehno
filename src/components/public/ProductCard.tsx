import { Heart, ImageIcon, ShoppingCart, Star } from "lucide-react";
import type { MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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
  const detailsPath = `/product/${product.slug}`;
  const image = product.images[0]?.url;

  const add = () => {
    try {
      addToCart(product.id);
      analyticsService.track("cart_add", { quantity: 1 }, product.id);
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("errorGeneric"), "error");
    }
  };

  const openDetails = (event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("a, button")) return;
    navigate(detailsPath);
  };

  return (
    <article className="product-card product-card--clickable" onClick={openDetails}>
      <div className="product-card__media">
        <div className="product-card__badges">
          {discount > 0 && <span className="market-discount-badge">-{discount}%</span>}
          {activePromotion && !discount && (
            <span className={`promo-ribbon promo-ribbon--${activePromotion.type}`}>
              {t(promoKey[activePromotion.type])}
            </span>
          )}
        </div>
        <button
          className={`favorite-button${isFavorite ? " is-active" : ""}`}
          onClick={(event) => {
            event.stopPropagation();
            toggleFavorite(product.id);
            analyticsService.track("favorite_add", {}, product.id);
          }}
          aria-label={t("addFavorite")}
        >
          <Heart size={19} fill={isFavorite ? "currentColor" : "none"} />
        </button>
        <Link to={detailsPath} aria-label={product.name[language]} onClick={(event) => event.stopPropagation()}>
          {image ? (
            <img
              src={image}
              alt={product.name[language]}
              loading="lazy"
              decoding="async"
              width="600"
              height="600"
            />
          ) : (
            <span className="product-card__placeholder" aria-hidden="true">
              <ImageIcon size={34} />
              <small>Фото скоро</small>
            </span>
          )}
        </Link>
      </div>
      <div className="product-card__body">
        <div className="product-card__meta">
          <span>{product.brand}</span>
          {product.rating && <span><Star size={13} fill="currentColor" />{product.rating}</span>}
        </div>
        <Link to={detailsPath} className="product-card__title" onClick={(event) => event.stopPropagation()}>{product.name[language]}</Link>
        <span className="product-card__model">{product.model}</span>
        <div className="product-card__price-row">
          <strong>{formatMoney(price)}</strong>
          {product.oldPrice && product.oldPrice > price && <del>{formatMoney(product.oldPrice)}</del>}
        </div>
        {activePromotion?.endAt && <span className="product-card__deadline">{t("until")} {formatDate(activePromotion.endAt)}</span>}
        <div className="product-card__footer">
          <button
            className="product-cart-button"
            onClick={(event) => {
              event.stopPropagation();
              add();
            }}
            aria-label={t("addCart")}
          >
            <ShoppingCart size={19} />
            <span>{t("addCart")}</span>
          </button>
          <Link
            className="product-details-button"
            to={detailsPath}
            onClick={(event) => event.stopPropagation()}
            aria-label={`Подробнее: ${product.name[language]}`}
          >
            Подробнее
          </Link>
        </div>
      </div>
    </article>
  );
}
