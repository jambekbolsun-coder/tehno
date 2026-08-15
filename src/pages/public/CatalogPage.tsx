import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ProductGrid } from "@/components/public/ProductGrid";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "@/hooks/useTranslation";
import { analyticsService } from "@/services/AnalyticsService";
import { useAppStore } from "@/stores/useAppStore";
import { calculateDiscountPercent, fromMinor } from "@/utils/money";
import { isPromotionActive } from "@/utils/date";

type SortValue = "popular" | "new" | "price-asc" | "price-desc" | "discount";

export default function CatalogPage() {
  const { language, t } = useTranslation();
  const products = useAppStore((state) => state.products);
  const categories = useAppStore((state) => state.categories);
  const brands = useAppStore((state) => state.brands);
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "all");
  const [brand, setBrand] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [promotion, setPromotion] = useState("all");
  const [maxPrice, setMaxPrice] = useState(100000);
  const [sort, setSort] = useState<SortValue>("popular");
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 320);
  const pageSize = 12;

  useEffect(() => {
    setLoading(true);
    const timer = window.setTimeout(() => setLoading(false), 260);
    setPage(1);
    return () => window.clearTimeout(timer);
  }, [
    debouncedQuery,
    category,
    brand,
    availability,
    promotion,
    maxPrice,
    sort,
  ]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (debouncedQuery) next.set("q", debouncedQuery);
    if (category !== "all") next.set("category", category);
    setParams(next, { replace: true });
    if (debouncedQuery)
      analyticsService.track("search", { query: debouncedQuery });
  }, [debouncedQuery, category, setParams]);

  const filtered = useMemo(() => {
    const normalized = debouncedQuery.trim().toLowerCase();
    const result = products.filter((product) => {
      if (!product.isVisible || product.isArchived) return false;
      const matchesQuery =
        !normalized ||
        [
          product.name.ru,
          product.name.kg,
          product.name.en,
          product.brand,
          product.model,
          product.sku,
        ].some((value) => value.toLowerCase().includes(normalized));
      const activePromotion =
        product.promotion?.isActive &&
        isPromotionActive(product.promotion.startAt, product.promotion.endAt)
          ? product.promotion
          : undefined;
      return (
        matchesQuery &&
        (category === "all" || product.categoryId === category) &&
        (brand === "all" || product.brand === brand) &&
        (availability === "all" ||
          (availability === "in"
            ? product.stock - product.reserved > 0
            : product.stock - product.reserved <= 0)) &&
        (promotion === "all" || activePromotion?.type === promotion) &&
        fromMinor(activePromotion?.specialPrice ?? product.salePrice) <=
          maxPrice
      );
    });
    return result.sort((a, b) => {
      const priceA = a.promotion?.specialPrice ?? a.salePrice;
      const priceB = b.promotion?.specialPrice ?? b.salePrice;
      if (sort === "price-asc") return priceA - priceB;
      if (sort === "price-desc") return priceB - priceA;
      if (sort === "new")
        return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      if (sort === "discount")
        return (
          calculateDiscountPercent(priceB, b.oldPrice) -
          calculateDiscountPercent(priceA, a.oldPrice)
        );
      return b.views - a.views;
    });
  }, [
    products,
    debouncedQuery,
    category,
    brand,
    availability,
    promotion,
    maxPrice,
    sort,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const reset = () => {
    setQuery("");
    setCategory("all");
    setBrand("all");
    setAvailability("all");
    setPromotion("all");
    setMaxPrice(100000);
    setSort("popular");
  };
  const activeFilterCount = [
    category !== "all",
    brand !== "all",
    availability !== "all",
    promotion !== "all",
    maxPrice < 100000,
  ].filter(Boolean).length;

  const FilterContent = () => (
    <div className="catalog-filters">
      <div className="filter-header">
        <strong>
          <SlidersHorizontal size={18} />
          {t("filters")}
        </strong>
        <button onClick={reset}>{t("reset")}</button>
      </div>
      <div className="filter-group">
        <span>{t("category")}</span>
        <div className="filter-options">
          <label>
            <input
              type="radio"
              checked={category === "all"}
              onChange={() => setCategory("all")}
            />
            <span>{t("allProducts")}</span>
          </label>
          {categories.map((item) => (
            <label key={item.id}>
              <input
                type="radio"
                checked={category === item.id}
                onChange={() => {
                  setCategory(item.id);
                  analyticsService.track("filter", { category: item.id });
                }}
              />
              <span>{item.name[language]}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="filter-group">
        <span>{t("brand")}</span>
        <select
          value={brand}
          onChange={(event) => setBrand(event.target.value)}
        >
          <option value="all">{t("allBrands")}</option>
          {brands.map((item) => (
            <option key={item.id} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <div className="range-label">
          <span>{t("price")}</span>
          <b>{t("upTo")} {new Intl.NumberFormat(language === "en" ? "en-US" : "ru-RU").format(maxPrice)} сом</b>
        </div>
        <input
          type="range"
          min="4000"
          max="100000"
          step="1000"
          value={maxPrice}
          onChange={(event) => setMaxPrice(Number(event.target.value))}
        />
        <div className="range-scale">
          <span>4 000</span>
          <span>100 000+</span>
        </div>
      </div>
      <div className="filter-group">
        <span>{t("availability")}</span>
        <div className="segmented-control">
          <button
            className={availability === "all" ? "active" : ""}
            onClick={() => setAvailability("all")}
          >
            {t("allOption")}
          </button>
          <button
            className={availability === "in" ? "active" : ""}
            onClick={() => setAvailability("in")}
          >
            {t("inStock")}
          </button>
          <button
            className={availability === "out" ? "active" : ""}
            onClick={() => setAvailability("out")}
          >
            {t("outOfStock")}
          </button>
        </div>
      </div>
      <div className="filter-group">
        <span>{t("promotions")}</span>
        <div className="promotion-filter-grid">
          {[
            ["all", t("allOption")],
            ["sale", t("sale")],
            ["discount", t("promoDiscount")],
            ["cashback", t("cashback")],
            ["giveaway", t("giveaway")],
            ["hit", t("hit")],
            ["new", t("new")],
          ].map(([value, label]) => (
            <button
              key={value}
              className={promotion === value ? "active" : ""}
              onClick={() => setPromotion(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <Button
        block
        className="mobile-filter-apply"
        onClick={() => setFilterOpen(false)}
      >
        {t("showProducts")} · {filtered.length}
      </Button>
    </div>
  );

  return (
    <div className="catalog-page container page-space">
      <header className="page-heading">
        <span className="eyebrow">TEHNO MARKET</span>
        <h1>{t("catalog")}</h1>
        <p>{t("catalogIntro")}</p>
      </header>
      <div className="catalog-toolbar">
        <form
          className="catalog-search"
          onSubmit={(event) => event.preventDefault()}
        >
          <Search size={20} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("search")}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={t("clearSearch")}
            >
              <X size={17} />
            </button>
          )}
        </form>
        <button
          className="mobile-filter-button"
          onClick={() => setFilterOpen(true)}
        >
          <Filter size={18} />
          {t("filters")}
          {activeFilterCount > 0 && <span>{activeFilterCount}</span>}
        </button>
        <label className="sort-select">
          <span>{t("sort")}</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortValue)}
          >
            <option value="popular">{t("sortPopular")}</option>
            <option value="new">{t("sortNew")}</option>
            <option value="price-asc">{t("sortPriceAsc")}</option>
            <option value="price-desc">{t("sortPriceDesc")}</option>
            <option value="discount">{t("sortDiscount")}</option>
          </select>
        </label>
      </div>
      <nav className="catalog-category-rail" aria-label={t("categories")}>
        <button
          className={category === "all" ? "active" : ""}
          onClick={() => setCategory("all")}
        >
          {t("allProducts")}
        </button>
        {categories.filter((item) => item.isVisible).map((item) => (
          <button
            key={item.id}
            className={category === item.id ? "active" : ""}
            onClick={() => setCategory(item.id)}
          >
            {item.name[language]}
          </button>
        ))}
      </nav>
      <div className="catalog-layout">
        <aside className="catalog-sidebar">
          <FilterContent />
        </aside>
        <section className="catalog-results">
          <div className="catalog-result-meta">
            <span>
              {t("found")}: <strong>{filtered.length}</strong>
            </span>
            {activeFilterCount > 0 && (
              <button onClick={reset}>
                {t("reset")} <X size={14} />
              </button>
            )}
          </div>
          {loading ? (
            <ProductGrid products={[]} skeleton />
          ) : visible.length ? (
            <ProductGrid products={visible} />
          ) : (
            <EmptyState
              icon={<Search size={30} />}
              title={t("nothingFound")}
              text={t("nothingFoundText")}
              action={<Button onClick={reset}>{t("reset")}</Button>}
            />
          )}
          {totalPages > 1 && (
            <nav className="pagination" aria-label={t("catalogPages")}>
              <button
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={page === 1}
                aria-label={t("previousPage")}
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (number) => (
                  <button
                    key={number}
                    className={page === number ? "active" : ""}
                    onClick={() => setPage(number)}
                  >
                    {number}
                  </button>
                ),
              )}
              <button
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
                disabled={page === totalPages}
                aria-label={t("nextPage")}
              >
                <ChevronRight size={18} />
              </button>
            </nav>
          )}
        </section>
      </div>
      <Modal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title={t("filters")}
        size="full"
      >
        <FilterContent />
      </Modal>
    </div>
  );
}
