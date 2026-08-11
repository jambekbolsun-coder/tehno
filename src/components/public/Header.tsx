import {
  Heart,
  Menu,
  Moon,
  Search,
  ShoppingBag,
  Sun,
  X,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useBodyLock } from "@/hooks/useBodyLock";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppStore } from "@/stores/useAppStore";
import { LanguageSwitcher } from "@/components/public/LanguageSwitcher";
import { Logo } from "@/components/ui/Logo";

export function Header() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const favorites = useAppStore((state) => state.favorites.length);
  const cart = useAppStore((state) =>
    state.cart.reduce((sum, item) => sum + item.quantity, 0),
  );
  useBodyLock(menuOpen);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) =>
      event.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const search = (event: FormEvent) => {
    event.preventDefault();
    if (query.trim().toLowerCase() === "/admin") {
      setQuery("");
      navigate("/admin");
      return;
    }
    navigate(
      `/catalog${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`,
    );
  };
  const nav = [
    ["/", t("home")],
    ["/catalog", t("catalog")],
    ["/about", t("about")],
    ["/contacts", t("contacts")],
  ];

  return (
    <header className="site-header">
      <div className="site-header__inner container">
        <Logo />
        <nav className="desktop-nav" aria-label={t("menu")}>
          {nav.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === "/"}>
              {label}
            </NavLink>
          ))}
        </nav>
        <form className="header-search" onSubmit={search} role="search">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("search")}
          />
        </form>
        <div className="header-actions">
          <LanguageSwitcher />
          <button
            className="icon-button"
            onClick={toggleTheme}
            aria-label={t("theme")}
            title={t("theme")}
          >
            {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
          </button>
          <NavLink
            className="icon-button badge-button"
            to="/favorites"
            aria-label={t("favorites")}
            title={t("favorites")}
          >
            <Heart size={19} />
            {favorites > 0 && <span>{favorites}</span>}
          </NavLink>
          <NavLink
            className="icon-button badge-button"
            to="/cart"
            aria-label={t("cart")}
            title={t("cart")}
          >
            <ShoppingBag size={19} />
            {cart > 0 && <span>{cart}</span>}
          </NavLink>
          <button
            className="icon-button burger-button"
            onClick={() => setMenuOpen(true)}
            aria-label={t("menu")}
            aria-expanded={menuOpen}
          >
            <Menu size={22} />
          </button>
        </div>
      </div>
      <div
        className={`mobile-drawer-layer${menuOpen ? " is-open" : ""}`}
        aria-hidden={!menuOpen}
        onMouseDown={(event) =>
          event.target === event.currentTarget && setMenuOpen(false)
        }
      >
        <aside className="mobile-drawer" aria-label={t("menu")}>
          <div className="mobile-drawer__top">
            <Logo />
            <button
              className="icon-button"
              onClick={() => setMenuOpen(false)}
              aria-label={t("close")}
            >
              <X size={22} />
            </button>
          </div>
          <form className="mobile-search" onSubmit={search}>
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
            />
          </form>
          <nav>
            {nav.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === "/"}>
                {label}
              </NavLink>
            ))}
            <NavLink to="/faq">{t("faq")}</NavLink>
          </nav>
          <div className="mobile-drawer__controls">
            <span>{t("language")}</span>
            <LanguageSwitcher expanded />
          </div>
          <button className="mobile-theme" onClick={toggleTheme}>
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            <span>{t("theme")}</span>
          </button>
          <p className="mobile-drawer__address">
            г. Бишкек, ул. Токтогула, 236
            <br />
            +996 999 230 105
          </p>
        </aside>
      </div>
    </header>
  );
}
