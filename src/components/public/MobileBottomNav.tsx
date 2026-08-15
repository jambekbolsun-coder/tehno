import { Heart, Home, LayoutGrid, ShoppingCart } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppStore } from "@/stores/useAppStore";

export function MobileBottomNav() {
  const { t } = useTranslation();
  const favorites = useAppStore((state) => state.favorites.length);
  const cart = useAppStore((state) =>
    state.cart.reduce((sum, item) => sum + item.quantity, 0),
  );
  const items = [
    { to: "/", label: t("home"), icon: Home, end: true, count: 0 },
    { to: "/catalog", label: t("catalog"), icon: LayoutGrid, end: false, count: 0 },
    { to: "/favorites", label: t("favorites"), icon: Heart, end: false, count: favorites },
    { to: "/cart", label: t("cart"), icon: ShoppingCart, end: false, count: cart },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label={t("menu")}>
      {items.map(({ to, label, icon: Icon, end, count }) => (
        <NavLink key={to} to={to} end={end}>
          <span className="mobile-bottom-nav__icon">
            <Icon size={21}/>
            {count > 0 && (
              <b className="mobile-bottom-nav__badge">{count > 99 ? "99+" : count}</b>
            )}
          </span>
          <small>{label}</small>
        </NavLink>
      ))}
    </nav>
  );
}
