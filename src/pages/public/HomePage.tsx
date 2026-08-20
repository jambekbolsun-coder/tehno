import { ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ProductGrid } from "@/components/public/ProductGrid";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppStore } from "@/stores/useAppStore";

const banners = [
  {
    desktop: "/promo/installment-desktop.webp",
    tablet: "/promo/installment-tablet.webp",
    mobile: "/promo/installment-mobile.webp",
    href: "/catalog",
    label: "Рассрочка 12 месяцев на все товары",
  },
  {
    desktop: "/promo/gift-desktop.webp",
    tablet: "/promo/gift-tablet.webp",
    mobile: "/promo/gift-mobile.webp",
    href: "/catalog?category=refrigerators",
    label: "Чайник в подарок при покупке холодильника",
  },
  {
    desktop: "/promo/discount-desktop.webp",
    tablet: "/promo/discount-tablet.webp",
    mobile: "/promo/discount-mobile.webp",
    href: "/catalog",
    label: "Горячие скидки на бытовую технику",
  },
  {
    desktop: "/promo/address-desktop.webp",
    tablet: "/promo/address-tablet.webp",
    mobile: "/promo/address-mobile.webp",
    href: "/contacts",
    label: "TEHNO CENTER — Токтогула 236",
  },
];

export default function HomePage() {
  const { language, t } = useTranslation();
  const products = useAppStore((state) => state.products).filter(
    (product) => product.isVisible && !product.isArchived,
  );
  const categories = useAppStore((state) => state.categories).filter(
    (category) => category.isVisible,
  );
  const [activeBanner, setActiveBanner] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setActiveBanner((value) => (value + 1) % banners.length),
      4600,
    );
    return () => window.clearInterval(timer);
  }, []);

  const featured = useMemo(
    () =>
      [...products]
        .sort(
          (a, b) =>
            Number(b.isFeatured) - Number(a.isFeatured) ||
            Number(b.isPopular) - Number(a.isPopular) ||
            b.views - a.views,
        )
        .slice(0, 4),
    [products],
  );

  const catalog = useMemo(
    () =>
      [...products]
        .sort(
          (a, b) =>
            Number(b.isPopular) - Number(a.isPopular) ||
            Number(b.isFeatured) - Number(a.isFeatured) ||
            b.views - a.views,
        )
        .slice(0, 10),
    [products],
  );

  return (
    <div className="market-home container page-space">
      <section className="market-banner-carousel" aria-label="Акции">
        <div className="market-banner-track">
          {banners.map((banner, index) => (
            <Link
              key={banner.desktop}
              to={banner.href}
              className={`market-banner${index === activeBanner ? " is-active" : ""}`}
              aria-hidden={index !== activeBanner}
              tabIndex={index === activeBanner ? 0 : -1}
            >
              <picture>
                <source media="(max-width: 600px)" srcSet={banner.mobile} />
                <source media="(max-width: 1024px)" srcSet={banner.tablet} />
                <img src={banner.desktop} alt={banner.label} fetchPriority={index === 0 ? "high" : "auto"} />
              </picture>
            </Link>
          ))}
        </div>
        <div className="market-banner-dots" aria-label="Переключить баннер">
          {banners.map((banner, index) => (
            <button
              type="button"
              key={banner.desktop}
              className={index === activeBanner ? "is-active" : ""}
              aria-label={`Баннер ${index + 1}`}
              onClick={() => setActiveBanner(index)}
            />
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="market-featured-panel">
          <div className="market-section-heading market-section-heading--inverse">
            <div>
              <span>TEHNO CHOICE</span>
              <h1>Подборка топ электроники</h1>
            </div>
            <Link to="/catalog">{t("allProducts")} <ChevronRight size={18} /></Link>
          </div>
          <ProductGrid products={featured} />
        </section>
      )}

      {categories.length > 0 && (
        <section className="market-category-block">
          <div className="market-section-heading">
            <h2>{t("catalog")}</h2>
            <Link to="/catalog">{t("allProducts")} <ChevronRight size={18} /></Link>
          </div>
          <div className="market-category-rail">
            {categories.map((category) => {
              const preview = products.find((product) => product.categoryId === category.id);
              return (
                <Link to={`/catalog?category=${category.id}`} key={category.id}>
                  <span className="market-category-image">
                    <img
                      src={preview?.images[0]?.url || "/logo.jpg"}
                      alt={category.name[language]}
                      loading="lazy"
                    />
                  </span>
                  <strong>{category.name[language]}</strong>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="market-catalog-preview">
        <div className="market-section-heading">
          <div>
            <span>TEHNO CENTER</span>
            <h2>Популярные товары</h2>
          </div>
          <Link to="/catalog">{t("allProducts")} <ChevronRight size={18} /></Link>
        </div>

        {catalog.length > 0 ? (
          <ProductGrid products={catalog} />
        ) : (
          <div className="market-empty-catalog">
            <strong>Каталог пока пуст</strong>
            <p>Добавь товары в админке — они автоматически появятся здесь.</p>
          </div>
        )}
      </section>
    </div>
  );
}
