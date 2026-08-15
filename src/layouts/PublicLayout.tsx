import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Footer } from "@/components/public/Footer";
import { Header } from "@/components/public/Header";
import { MobileBottomNav } from "@/components/public/MobileBottomNav";
import { WhatsAppButton } from "@/components/public/WhatsAppButton";

export function PublicLayout() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname]);
  return (
    <div className="public-app">
      <Header />
      <main id="main-content">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
      <MobileBottomNav />
    </div>
  );
}
