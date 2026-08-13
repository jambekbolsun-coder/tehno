import { lazy, Suspense, useEffect } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { ToastRegion } from "@/components/ui/Toast";
import { CrmLayout } from "@/layouts/CrmLayout";
import { PublicLayout } from "@/layouts/PublicLayout";
import { analyticsService } from "@/services/AnalyticsService";
import { hasPendingInvite } from "@/lib/supabase";
import { useAppStore } from "@/stores/useAppStore";

const HomePage = lazy(() => import("@/pages/public/HomePage"));
const CatalogPage = lazy(() => import("@/pages/public/CatalogPage"));
const ProductPage = lazy(() => import("@/pages/public/ProductPage"));
const FavoritesPage = lazy(() => import("@/pages/public/FavoritesPage"));
const CartPage = lazy(() => import("@/pages/public/CartPage"));
const AboutPage = lazy(() => import("@/pages/public/AboutPage"));
const ContactsPage = lazy(() => import("@/pages/public/ContactsPage"));
const FAQPage = lazy(() => import("@/pages/public/FAQPage"));
const CheckoutPage = lazy(() => import("@/pages/public/CheckoutPage"));
const SuccessPage = lazy(() => import("@/pages/public/SuccessPage"));
const NotFoundPage = lazy(() => import("@/pages/public/NotFoundPage"));
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const InvitePage = lazy(() => import("@/pages/auth/InvitePage"));
const CrmPortal = lazy(() => import("@/pages/crm/CrmPortal"));

function AppEffects() {
  const theme = useAppStore((state) => state.theme);
  const language = useAppStore((state) => state.language);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.documentElement.lang = language;
  }, [theme, language]);
  useEffect(() => { analyticsService.track("site_visit", { entry: window.location.hash || "#/" }); }, []);
  useEffect(() => {
    if (hasPendingInvite() && window.location.hash !== "#/invite")
      window.location.hash = "#/invite";
  }, []);
  return null;
}

function RouteLoader() {
  return <div className="route-loader" role="status" aria-label="Загрузка"><span/><span/><span/></div>;
}

export default function App() {
  const initialize = useAppStore((state) => state.initialize);
  const ready = useAppStore((state) => state.ready);
  useEffect(() => { void initialize(); }, [initialize]);
  if (!ready) return <RouteLoader/>;
  return (
    <HashRouter>
      <AppEffects/>
      <Suspense fallback={<RouteLoader/>}>
        <Routes>
          <Route element={<PublicLayout/>}>
            <Route path="/" element={<HomePage/>}/>
            <Route path="/catalog" element={<CatalogPage/>}/>
            <Route path="/product/:slug" element={<ProductPage/>}/>
            <Route path="/favorites" element={<FavoritesPage/>}/>
            <Route path="/cart" element={<CartPage/>}/>
            <Route path="/about" element={<AboutPage/>}/>
            <Route path="/contacts" element={<ContactsPage/>}/>
            <Route path="/faq" element={<FAQPage/>}/>
            <Route path="/checkout" element={<CheckoutPage/>}/>
            <Route path="/success" element={<SuccessPage/>}/>
            <Route path="*" element={<NotFoundPage/>}/>
          </Route>
          <Route path="/login" element={<LoginPage/>}/>
          <Route path="/invite" element={<InvitePage/>}/>
          <Route element={<RouteGuard role="admin"/>}>
            <Route path="/admin" element={<Navigate to="/crm/admin/dashboard" replace/>}/>
            <Route path="/crm/admin" element={<CrmLayout role="admin"/>}>
              <Route index element={<Navigate to="dashboard" replace/>}/>
              <Route path=":section" element={<CrmPortal role="admin"/>}/>
            </Route>
          </Route>
          <Route element={<RouteGuard role="manager"/>}>
            <Route path="/crm/manager" element={<CrmLayout role="manager"/>}>
              <Route index element={<Navigate to="dashboard" replace/>}/>
              <Route path=":section" element={<CrmPortal role="manager"/>}/>
            </Route>
          </Route>
        </Routes>
      </Suspense>
      <ToastRegion/>
    </HashRouter>
  );
}
