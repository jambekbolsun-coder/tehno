import { Activity, BarChart3, Bell, Bot, Boxes, ChevronDown, CircleDollarSign, ClipboardList, ContactRound, CreditCard, FileQuestion, HandCoins, LayoutDashboard, LogOut, Menu, PackageSearch, ReceiptText, RotateCcw, Search, Settings, ShoppingCart, Store, Truck, UserRound, UsersRound, WalletCards, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ADMIN_SECTIONS, MANAGER_SECTIONS } from "@/constants/routes";
import { useBodyLock } from "@/hooks/useBodyLock";
import { useAppStore } from "@/stores/useAppStore";

const icons: Record<string, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard, ai: Bot, leads: ClipboardList, funnel: Activity, catalog: PackageSearch, inventory: Boxes,
  "online-sales": ShoppingCart, "offline-sales": Store, managers: UsersRound, customers: ContactRound, suppliers: Truck,
  returns: RotateCcw, expenses: ReceiptText, finance: CircleDollarSign, analytics: BarChart3, notifications: Bell, faq: FileQuestion,
  settings: Settings, profile: UserRound, sales: CreditCard, earnings: HandCoins,
};

export function CrmLayout({ role }: { role: "admin" | "manager" }) {
  const session = useAppStore((state) => state.session)!;
  const notifications = useAppStore((state) => state.notifications);
  const logout = useAppStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  useBodyLock(sidebarOpen);
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);
  const sections = role === "admin" ? ADMIN_SECTIONS : MANAGER_SECTIONS;
  const unread = useMemo(() => notifications.filter((item) => !item.isRead && (!item.userId || item.userId === session.id)).length, [notifications, session.id]);
  const current = sections.find(([key]) => location.pathname.endsWith(`/${key}`))?.[1] ?? "CRM";
  const signOut = async () => { await logout(); navigate("/"); };
  return (
    <div className="crm-app">
      <div className={`crm-sidebar-layer${sidebarOpen ? " is-open" : ""}`} onMouseDown={(event) => event.currentTarget === event.target && setSidebarOpen(false)}>
        <aside className="crm-sidebar">
          <div className="crm-sidebar__brand"><span>TC</span><div><strong>TEHNO OPS</strong><small>{role === "admin" ? "Управление магазином" : "Рабочее место"}</small></div><button onClick={() => setSidebarOpen(false)} aria-label="Закрыть меню"><X size={19}/></button></div>
          <div className="crm-sidebar__user"><span>{session.name.split(" ").map((word) => word[0]).slice(0, 2).join("")}</span><div><strong>{session.name}</strong><small>{role === "admin" ? "Управляющий" : "Менеджер"}</small></div></div>
          <nav className="crm-nav">{sections.map(([key, label]) => { const Icon = icons[key] ?? LayoutDashboard; return <NavLink key={key} to={`/crm/${role}/${key}`}><Icon size={18}/><span>{label}</span>{key === "notifications" && unread > 0 && <b>{unread}</b>}</NavLink>; })}</nav>
          <div className="crm-sidebar__bottom"><NavLink to="/"><Store size={18}/><span>Открыть сайт</span></NavLink><button onClick={signOut}><LogOut size={18}/><span>Выйти</span></button></div>
        </aside>
      </div>
      <div className="crm-main">
        <header className="crm-topbar"><div className="crm-topbar__left"><button className="crm-mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Открыть меню"><Menu size={21}/></button><div><span>Рабочее пространство</span><h1>{current}</h1></div></div><div className="crm-topbar__actions"><label className="crm-global-search"><Search size={17}/><input placeholder="Поиск в CRM…"/></label><NavLink className="crm-topbar-icon" to={`/crm/${role}/notifications`} aria-label="Уведомления"><Bell size={19}/>{unread > 0 && <span>{unread}</span>}</NavLink><div className="crm-profile-menu"><button onClick={() => setProfileOpen((value) => !value)}><span>{session.name.split(" ").map((word) => word[0]).slice(0, 2).join("")}</span><div><strong>{session.name.split(" ")[0]}</strong><small>{role === "admin" ? "Управляющий" : "Менеджер"}</small></div><ChevronDown size={15}/></button>{profileOpen && <div><NavLink to={`/crm/${role}/profile`}><UserRound size={16}/>Профиль</NavLink><button onClick={signOut}><LogOut size={16}/>Выйти</button></div>}</div></div></header>
        <main className="crm-content"><Outlet/></main>
      </div>
    </div>
  );
}
