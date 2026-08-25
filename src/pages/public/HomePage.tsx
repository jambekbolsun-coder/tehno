import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Link } from "react-router-dom";
import { ProductGrid } from "@/components/public/ProductGrid";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppStore } from "@/stores/useAppStore";

const banners = [
  { id: "installment", href: "/catalog", label: "Рассрочка 12 месяцев на все товары" },
  { id: "gift", href: "/catalog", label: "Купите холодильник — чайник в подарок" },
  { id: "sale", href: "/catalog", label: "Горячие скидки до 30 процентов" },
  { id: "address", href: "/contacts", label: "TEHNO CENTER — Токтогула 236" },
];

const wrapIndex = (value: number) => (value + banners.length) % banners.length;

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
  const featuredRail = useRef<HTMLDivElement | null>(null);
  const featuredDrag = useRef({ pointerId: -1, startX: 0, startY: 0, startScrollLeft: 0, moved: false });
  const suppressFeaturedClick = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(
      () => setActiveBanner((value) => wrapIndex(value + 1)),
      5600,
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
        .slice(0, 10),
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
        .slice(0, 24),
    [products],
  );

  const moveBanner = (delta: number) =>
    setActiveBanner((value) => wrapIndex(value + delta));

  const scrollFeatured = (direction: -1 | 1) => {
    const rail = featuredRail.current;
    if (!rail) return;
    rail.scrollBy({ left: rail.clientWidth * 0.82 * direction, behavior: "smooth" });
  };

  const startFeaturedDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    const rail = event.currentTarget;
    featuredDrag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: rail.scrollLeft,
      moved: false,
    };
    suppressFeaturedClick.current = false;
  };

  const moveFeaturedDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = featuredDrag.current;
    if (drag.pointerId !== event.pointerId) return;
    const delta = event.clientX - drag.startX;
    const verticalDelta = event.clientY - drag.startY;
    if (!drag.moved && Math.abs(delta) < 6) return;
    if (!drag.moved && Math.abs(delta) <= Math.abs(verticalDelta)) return;
    drag.moved = true;
    suppressFeaturedClick.current = true;
    if (!event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.classList.add("is-dragging");
    event.preventDefault();
    event.currentTarget.scrollLeft = drag.startScrollLeft - delta;
  };

  const endFeaturedDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (featuredDrag.current.pointerId !== event.pointerId) return;
    event.currentTarget.classList.remove("is-dragging");
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    featuredDrag.current.pointerId = -1;
    window.setTimeout(() => { suppressFeaturedClick.current = false; }, 0);
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
          if (touchStartX.current === null) return;
          const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
          const delta = endX - touchStartX.current;
          touchStartX.current = null;
          if (Math.abs(delta) > 42) moveBanner(delta < 0 ? 1 : -1);
        }}
      >
        <div className="market-banner-track">
          {banners.map((banner, index) => (
            <Link
              key={banner.label}
              to={banner.href}
              className={`market-banner${index === activeBanner ? " is-active" : ""}`}
              aria-label={banner.label}
              aria-hidden={index !== activeBanner}
              tabIndex={index === activeBanner ? 0 : -1}
            >
              <picture>
                <source media="(min-width: 1101px)" srcSet={`/banners-hq/${banner.id}-desktop.webp`} />
                <source media="(min-width: 761px)" srcSet={`/banners-hq/${banner.id}-tablet.webp`} />
                <img
                  src={`/banners-hq/${banner.id}-mobile.webp`}
                  alt=""
                  width="1639"
                  height="960"
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  decoding="async"
                  draggable="false"
                />
              </picture>
              <span className="sr-only">{banner.label}</span>
            </Link>
          ))}
        </div>
        <button
          type="button"
          className="market-banner-arrow market-banner-arrow--left"
          onClick={() => moveBanner(-1)}
          aria-label="Предыдущий баннер"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          type="button"
          className="market-banner-arrow market-banner-arrow--right"
          onClick={() => moveBanner(1)}
          aria-label="Следующий баннер"
        >
          <ChevronRight size={22} />
        </button>
        <div className="market-banner-dots" aria-label="Переключить баннер">
          {banners.map((banner, index) => (
            <button
              type="button"
              key={banner.label}
              className={index === activeBanner ? "is-active" : ""}
              aria-label={`Баннер ${index + 1}`}
              aria-current={index === activeBanner ? "true" : undefined}
              onClick={() => setActiveBanner(index)}
            />
          ))}
        </div>
      </section>

      {categories.length > 0 && (
        <nav className="market-category-pills" aria-label="Категории товаров">
          <Link to="/catalog" className="is-primary">Все товары</Link>
          {categories.map((category) => (
            <Link to={`/catalog?category=${category.id}`} key={category.id}>
              {category.name[language]}
            </Link>
          ))}
        </nav>
      )}

      {featured.length > 0 && (
        <section className="market-featured-strip">
          <div className="market-section-heading market-section-heading--compact">
            <div>
              <span>TEHNO CHOICE</span>
              <h1>Лучшее сейчас</h1>
            </div>
            <div className="market-heading-actions">
              <button type="button" onClick={() => scrollFeatured(-1)} aria-label="Листать товары назад"><ChevronLeft size={19} /></button>
              <button type="button" onClick={() => scrollFeatured(1)} aria-label="Листать товары вперёд"><ChevronRight size={19} /></button>
              <Link to="/catalog">{t("allProducts")} <ChevronRight size={18} /></Link>
            </div>
          </div>
          <div
            className="market-product-rail"
            ref={featuredRail}
            role="region"
            aria-label="Товары TEHNO CHOICE. Проведите пальцем или используйте стрелки."
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") { event.preventDefault(); scrollFeatured(-1); }
              if (event.key === "ArrowRight") { event.preventDefault(); scrollFeatured(1); }
            }}
            onPointerDown={startFeaturedDrag}
            onPointerMove={moveFeaturedDrag}
            onPointerUp={endFeaturedDrag}
            onPointerCancel={endFeaturedDrag}
            onClickCapture={(event) => {
              if (!suppressFeaturedClick.current) return;
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            <ProductGrid products={featured} />
          </div>
        </section>
      )}

      <section className="market-catalog-preview market-catalog-preview--flat">
        <div className="market-section-heading market-section-heading--compact">
          <h2>Популярное для вас</h2>
          <Link to="/catalog">{t("allProducts")} <ChevronRight size={18} /></Link>
        </div>

        {catalog.length > 0 ? (
          <ProductGrid products={catalog} />
        ) : (
          <div className="market-empty-catalog">
            <strong>Товары скоро появятся</strong>
            <p>Мы обновляем ассортимент.</p>
          </div>
        )}
      </section>
    </div>
  );
}
