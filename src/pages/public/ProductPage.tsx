import {
  Bell,
  ChevronRight,
  Heart,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { InstallmentCalculator } from "@/components/public/InstallmentCalculator";
import { ProductGrid } from "@/components/public/ProductGrid";
import { ProductLightbox } from "@/components/public/ProductLightbox";
import { ProductSwipeGallery } from "@/components/public/ProductSwipeGallery";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/hooks/useTranslation";
import { analyticsService } from "@/services/AnalyticsService";
import { useAppStore } from "@/stores/useAppStore";
import { calculateDiscountPercent, formatMoney, formatMonths } from "@/utils/money";
import { buildWhatsAppUrl } from "@/utils/whatsapp";
import { isPromotionActive, formatDate } from "@/utils/date";

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { language, t } = useTranslation();
  const products = useAppStore((state) => state.products);
  const favorites = useAppStore((state) => state.favorites);
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);
  const addToCart = useAppStore((state) => state.addToCart);
  const addRecent = useAppStore((state) => state.addRecent);
  const recentIds = useAppStore((state) => state.recentProductIds);
  const showToast = useAppStore((state) => state.showToast);
  const [selectedImage, setSelectedImage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const product = products.find((item) => item.slug === slug);

  useEffect(() => {
    if (!product) return;
    addRecent(product.id);
    analyticsService.track("product_view", { slug: product.slug }, product.id);
  }, [product?.id]);

  useEffect(() => {
    setSelectedImage(0);
    setZoomOpen(false);
    setQuantity(1);
  }, [product?.id]);

  const similar = useMemo(
    () =>
      product
        ? products
            .filter(
              (item) =>
                item.categoryId === product.categoryId &&
                item.id !== product.id &&
                item.isVisible,
            )
            .slice(0, 5)
        : [],
    [product, products],
  );
  const recentlyViewed = products
    .filter((item) => recentIds.includes(item.id) && item.id !== product?.id)
    .sort((a, b) => recentIds.indexOf(a.id) - recentIds.indexOf(b.id))
    .slice(0, 5);
  if (!product)
    return (
      <div className="container page-space">
        <h1>{t("error404")}</h1>
        <Link to="/catalog" className="text-link">
          {t("goCatalog")}
          <ChevronRight size={17} />
        </Link>
      </div>
    );

  const available = product.stock - product.reserved;
  const activePromotion =
    product.promotion?.isActive &&
    isPromotionActive(product.promotion.startAt, product.promotion.endAt)
      ? product.promotion
      : undefined;
  const price = activePromotion?.specialPrice ?? product.salePrice;
  const discount = calculateDiscountPercent(price, product.oldPrice);
  const isFavorite = favorites.includes(product.id);
  const add = () => {
    try {
      addToCart(product.id, quantity);
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("errorGeneric"), "error");
    }
  };
  return (
    <div className="container product-page page-space">
      <nav className="breadcrumbs" aria-label={t("breadcrumbs")}>
        <Link to="/">{t("home")}</Link>
        <ChevronRight size={14} />
        <Link to="/catalog">{t("catalog")}</Link>
        <ChevronRight size={14} />
        <span>{product.name[language]}</span>
      </nav>
      <div className="product-detail-grid">
        <ProductSwipeGallery
          images={product.images.slice(0, 5)}
          index={selectedImage}
          title={product.name[language]}
          onIndexChange={setSelectedImage}
          onOpen={() => setZoomOpen(true)}
        />
        <section className="product-info">
          <div className="product-info__top">
            <div>
              <span className="product-brand">{product.brand}</span>
              <span className="product-code">SKU: {product.sku}</span>
            </div>
            <button
              className={`product-favorite-main${isFavorite ? " active" : ""}`}
              onClick={() => toggleFavorite(product.id)}
            >
              <Heart size={19} fill={isFavorite ? "currentColor" : "none"} />
              <span>{t("addFavorite")}</span>
            </button>
          </div>
          <h1>{product.name[language]}</h1>
          <div className="product-rating">
            <span>
              <Star size={16} fill="currentColor" /> {product.rating}
            </span>
            <span>{product.views.toLocaleString()} {t("views")}</span>
            <span>
              {t("model")}: {product.model}
            </span>
          </div>
          {activePromotion && (
            <div
              className={`product-promo-banner product-promo-banner--${activePromotion.type}`}
            >
              <strong>{activePromotion.title[language]}</strong>
              {activePromotion.endAt && (
                <span>{t("until")} {formatDate(activePromotion.endAt)}</span>
              )}
            </div>
          )}
          <div className="product-price">
            <strong>{formatMoney(price)}</strong>
            {product.oldPrice && product.oldPrice > price && (
              <del>{formatMoney(product.oldPrice)}</del>
            )}
            {discount > 0 && <span>-{discount}%</span>}
          </div>
          <div
            className={`product-stock-status${available <= 0 ? " is-empty" : ""}`}
          >
            <span />
            {available > 0
              ? `${t("inStock")} · ${available} ${t("units")}`
              : t("outOfStock")}
          </div>
          {available > 0 ? (
            <div className="product-buy-row">
              <div className="quantity-control">
                <button
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  aria-label={t("decrease")}
                >
                  <Minus size={17} />
                </button>
                <span>{quantity}</span>
                <button
                  onClick={() =>
                    setQuantity((value) => Math.min(available, value + 1))
                  }
                  aria-label={t("increase")}
                >
                  <Plus size={17} />
                </button>
              </div>
              <Button size="lg" icon={<ShoppingCart size={19} />} onClick={add}>
                {t("addCart")}
              </Button>
            </div>
          ) : (
            <Button
              size="lg"
              variant="secondary"
              icon={<Bell size={19} />}
              onClick={() =>
                navigate(`/checkout?product=${product.id}&notify=1`)
              }
            >
              {t("notify")}
            </Button>
          )}
          <div className="product-actions-secondary">
            <Button
              variant="dark"
              size="lg"
              onClick={() =>
                navigate(`/checkout?product=${product.id}&method=installment`)
              }
            >
              {t("buyInstallment")}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => navigate(`/checkout?product=${product.id}`)}
            >
              {t("leaveRequest")}
            </Button>
          </div>
          <a
            className="product-whatsapp"
            href={buildWhatsAppUrl(
              "+996 999 230 105",
              `${t("whatsappInterest")} ${product.name[language]}, ${t("model").toLowerCase()} ${product.model}`,
            )}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle size={20} />
            <span>{t("whatsapp")}</span>
            <ChevronRight size={18} />
          </a>
          <div className="product-service-grid">
            <div>
              <ShieldCheck size={21} />
              <span>
                <strong>{t("warranty")}</strong>
                {formatMonths(product.warrantyMonths, language)}
              </span>
            </div>
            <div>
              <Truck size={21} />
              <span>
                <strong>{t("delivery")}</strong>{t("deliveryRegions")}
              </span>
            </div>
            <div>
              <MapPin size={21} />
              <span>
                <strong>{t("pickup")}</strong>Токтогула, 236
              </span>
            </div>
          </div>
        </section>
      </div>

      <div className="product-lower-grid">
        <section className="product-description-card">
          <div>
            <h2>{t("description")}</h2>
            <p>{product.description[language]}</p>
          </div>
        </section>
        {product.installmentEligible && (
          <InstallmentCalculator amount={price * quantity} />
        )}
      </div>
      {similar.length > 0 && (
        <section className="section product-related">
          <h2>{t("similar")}</h2>
          <ProductGrid products={similar} />
        </section>
      )}
      {recentlyViewed.length > 0 && (
        <section className="section product-related">
          <h2>{t("recentlyViewed")}</h2>
          <ProductGrid products={recentlyViewed} />
        </section>
      )}
      <ProductLightbox
        open={zoomOpen}
        images={product.images.slice(0, 5)}
        index={selectedImage}
        title={product.name[language]}
        onIndexChange={setSelectedImage}
        onClose={() => setZoomOpen(false)}
      />
    </div>
  );
}
