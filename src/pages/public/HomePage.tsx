import { ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ProductGrid } from "@/components/public/ProductGrid";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppStore } from "@/stores/useAppStore";

const banners = [
  {
    desktop: "/market-installment-desktop.avif",
    tablet: "/market-installment-tablet.avif",
    mobile: "/market-installment-mobile.avif",
    href: "/catalog",
    label: "Рассрочка 12 месяцев на все товары",
  },
  {
    desktop: "/market-gift-desktop.avif",
    tablet: "/market-gift-tablet.avif",
    mobile: "/market-gift-mobile.avif",
    href: "/catalog",
    label: "Купите холодильник — чайник в подарок",
  },
  {
    desktop: "/market-sale-desktop.avif",
    tablet: "/market-sale-tablet.avif",
    mobile: "/market-sale-mobile.avif",
    href: "/catalog",
    label: "Горячие скидки до 30 процентов",
  },
  {
    desktop: "/market-address-desktop.avif",
    tablet: "/market-address-tablet.avif",
    mobile: "/market-address-mobile.avif",
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
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setInterval(
      () => setActiveBanner((value) => (value + 1) % banners.length),
      5000,
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

  const moveBanner = (direction: 1 | -1) => {
    setActiveBanner((value) => (value + direction + banners.length) % banners.length);
  };

  return (
    <div className="market-home container page-space">
      <section
        className="market-banner-carousel"
        aria-label="Акции"
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          const start = touchStartX.current;
          touchStartX.current = null;
          const end = event.changedTouches[0]?.clientX;
          if (start === null || end === undefined || Math.abs(end - start) < 45) return;
          moveBanner(end < start ? 1 : -1);
        }}
      >
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
                <source media="(max-width: 640px)" srcSet={banner.mobile} />
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
