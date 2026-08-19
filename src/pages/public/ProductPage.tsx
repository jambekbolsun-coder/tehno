import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Heart,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  Share2,
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
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [specsExpanded, setSpecsExpanded] = useState(false);
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
    setDescriptionExpanded(false);
    setSpecsExpanded(false);
  }, [product?.id]);

  const similar = useMemo(
    () =>
      product
        ? products
            .filter(
              (item) =>
                item.categoryId === product.categoryId &&
                item.id !== product.id &&
                item.isVisible &&
                !item.isArchived,
            )
            .slice(0, 6)
        : [],
    [product, products],
  );
  const recentlyViewed = products
    .filter((item) => recentIds.includes(item.id) && item.id !== product?.id)
    .sort((a, b) => recentIds.indexOf(a.id) - recentIds.indexOf(b.id))
    .slice(0, 6);

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

  const activePromotion =
    product.promotion?.isActive &&
    isPromotionActive(product.promotion.startAt, product.promotion.endAt)
      ? product.promotion
      : undefined;
  const price = activePromotion?.specialPrice ?? product.salePrice;
  const discount = calculateDiscountPercent(price, product.oldPrice);
  const isFavorite = favorites.includes(product.id);
  const description = product.description[language] || product.description.ru;
  const shouldCollapseDescription = description.length > 260;
  const visibleSpecs = specsExpanded ? product.specifications : product.specifications.slice(0, 5);

  const add = () => {
    try {
      addToCart(product.id, quantity);
      analyticsService.track("cart_add", { quantity }, product.id);
      showToast("Добавлено в корзину", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("errorGeneric"), "error");
    }
  };

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name[language], url: window.location.href });
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      showToast("Ссылка скопирована", "success");
    } catch {
      // Пользователь мог закрыть системное окно Share — это не ошибка интерфейса.
    }
  };

  return (
    <div className="container product-page page-space product-page--market-v2">
      <div className="market-product-toolbar">
        <button type="button" onClick={() => navigate(-1)} aria-label="Назад"><ArrowLeft size={24} /></button>
        <div>
          <button
            type="button"
            className={isFavorite ? "is-active" : ""}
            onClick={() => toggleFavorite(product.id)}
            aria-label={t("addFavorite")}
          >
            <Heart size={24} fill={isFavorite ? "currentColor" : "none"} />
          </button>
          <button type="button" onClick={share} aria-label="Поделиться"><Share2 size={24} /></button>
        </div>
      </div>

      <nav className="breadcrumbs" aria-label={t("breadcrumbs")}>
        <Link to="/catalog">{t("catalog")}</Link>
        <ChevronRight size={14} />
        <span>{product.name[language]}</span>
      </nav>

      <div className="product-detail-grid market-product-detail">
        <section className="market-product-gallery-card">
          <div className="market-product-badges">
            {discount > 0 && <span>-{discount}%</span>}
            {product.installmentEligible && <b>0·0·12</b>}
          </div>
          <ProductSwipeGallery
            images={product.images.slice(0, 5)}
            index={selectedImage}
            title={product.name[language]}
            onIndexChange={setSelectedImage}
            onOpen={() => setZoomOpen(true)}
          />
        </section>

        <section className="product-info market-product-info-card">
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
            {product.rating ? <span><Star size={16} fill="currentColor" /> {product.rating}</span> : null}
            <span>{product.views.toLocaleString()} {t("views")}</span>
            <span>{t("model")}: {product.model}</span>
          </div>

          {activePromotion && (
            <div className={`product-promo-banner product-promo-banner--${activePromotion.type}`}>
              <strong>{activePromotion.title[language]}</strong>
              {activePromotion.endAt && <span>{t("until")} {formatDate(activePromotion.endAt)}</span>}
            </div>
          )}

          <div className="product-price">
            <strong>{formatMoney(price)}</strong>
            {product.oldPrice && product.oldPrice > price && <del>{formatMoney(product.oldPrice)}</del>}
          </div>

          <div className="product-order-availability">
            <span />
            Доступно к заказу
          </div>

          <div className="product-buy-row">
            <div className="quantity-control">
              <button onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label={t("decrease")}>
                <Minus size={17} />
              </button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity((value) => value + 1)} aria-label={t("increase")}>
                <Plus size={17} />
              </button>
            </div>
            <Button size="lg" icon={<ShoppingCart size={19} />} onClick={add}>
              {t("addCart")}
            </Button>
          </div>

          <div className="product-actions-secondary">
            <Button variant="dark" size="lg" onClick={() => navigate(`/checkout?product=${product.id}&method=installment`)}>
              {t("buyInstallment")}
            </Button>
            <Button variant="ghost" size="lg" onClick={() => navigate(`/checkout?product=${product.id}`)}>
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
              <span><strong>{t("warranty")}</strong>{formatMonths(product.warrantyMonths, language)}</span>
            </div>
            <div>
              <Truck size={21} />
              <span><strong>{t("delivery")}</strong>{t("deliveryRegions")}</span>
            </div>
            <div>
              <MapPin size={21} />
              <span><strong>{t("pickup")}</strong>Токтогула, 236</span>
            </div>
          </div>
        </section>
      </div>

      <div className="product-lower-grid market-product-lower-grid">
        <section className={`product-description-card market-product-card${descriptionExpanded ? " is-expanded" : ""}`}>
          <div>
            <h2>{t("description")}</h2>
            <div className={`product-description-text${shouldCollapseDescription && !descriptionExpanded ? " is-collapsed" : ""}`}>
              <p>{description || "Описание товара будет добавлено позже."}</p>
            </div>
            {shouldCollapseDescription && (
              <button className="product-description-toggle" onClick={() => setDescriptionExpanded((value) => !value)}>
                {descriptionExpanded ? "Скрыть" : "Показать больше"}
                {descriptionExpanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
              </button>
            )}
          </div>
        </section>

        {product.specifications.length > 0 && (
          <section className="market-product-card market-specifications-card">
            <h2>Общие характеристики</h2>
            <dl>
              {visibleSpecs.map((spec) => (
                <div key={spec.id}>
                  <dt>{spec.label[language] || spec.label.ru}</dt>
                  <dd>{spec.value[language] || spec.value.ru}</dd>
                </div>
              ))}
            </dl>
            {product.specifications.length > 5 && (
              <button className="market-spec-toggle" onClick={() => setSpecsExpanded((value) => !value)}>
                {specsExpanded ? "Скрыть" : "Показать больше"}
                {specsExpanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
              </button>
            )}
          </section>
        )}

        <section className="market-product-card market-seller-card">
          <h2>Продавец</h2>
          <div>
            <img src="/logo.jpg" alt="TEHNO CENTER 2" />
            <span><small>Магазин</small><strong>TEHNO CENTER 2</strong></span>
            <ChevronRight size={22} />
          </div>
        </section>

        {product.installmentEligible && <InstallmentCalculator amount={price * quantity} />}
      </div>

      {similar.length > 0 && (
        <section className="section product-related market-related-products">
          <div className="market-section-heading"><h2>{t("similar")}</h2></div>
          <ProductGrid products={similar} />
        </section>
      )}
      {recentlyViewed.length > 0 && (
        <section className="section product-related market-related-products">
          <div className="market-section-heading"><h2>{t("recentlyViewed")}</h2></div>
          <ProductGrid products={recentlyViewed} />
        </section>
      )}

      <div className="market-mobile-buybar">
        <button type="button" onClick={add}>{t("addCart")}</button>
      </div>

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