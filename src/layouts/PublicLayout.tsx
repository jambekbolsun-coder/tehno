import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Footer } from "@/components/public/Footer";
import { Header } from "@/components/public/Header";
import { InstagramButton } from "@/components/public/InstagramButton";
import { MobileBottomNav } from "@/components/public/MobileBottomNav";
import { WhatsAppButton } from "@/components/public/WhatsAppButton";

export function PublicLayout() {
  const location = useLocation();
  const routeClass = location.pathname.startsWith("/product/")
    ? " public-app--product"
    : location.pathname === "/catalog"
      ? " public-app--catalog"
      : location.pathname === "/"
        ? " public-app--home"
        : location.pathname.startsWith("/news")
          ? " public-app--news"
          : "";

  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, [location.pathname]);

  return (
    <div className={`public-app${routeClass}`}>
      <Header />
      <main id="main-content"><Outlet /></main>
      <Footer />
      <div className="social-fabs" aria-label="Социальные сети"><WhatsAppButton /><InstagramButton /></div>
      <MobileBottomNav />
    </div>
  );
}
