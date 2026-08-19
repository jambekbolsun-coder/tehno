import { Navigate, useParams } from "react-router-dom";
import { CatalogSection, InventorySection, SalesSection } from "@/pages/crm/CatalogSections";
import { DashboardSection } from "@/pages/crm/DashboardSection";
import { AnalyticsSection, ExpensesSection, FAQManagementSection, FinanceSection, NotificationsSection, ProfileSection, ReturnsSection, SettingsSection } from "@/pages/crm/ManagementSections";
import { AISection, FunnelSection, LeadsSection } from "@/pages/crm/OperationsSections";
import { CustomersSection, EarningsSection, SuppliersSection } from "@/pages/crm/PeopleSections";
import { ManagersQrSection } from "@/pages/crm/ManagersQrSection";

export default function CrmPortal({ role }: { role: "admin" | "manager" }) {
  const { section } = useParams();
  if (section === "dashboard") return <DashboardSection role={role}/>;
  if (section === "ai") return <AISection role={role}/>;
  if (section === "leads") return <LeadsSection role={role}/>;
  if (section === "funnel") return <FunnelSection role={role}/>;
  if (section === "catalog") return <CatalogSection role={role}/>;
  if (section === "customers") return <CustomersSection role={role}/>;
  if (section === "notifications") return <NotificationsSection role={role}/>;
  if (section === "profile") return <ProfileSection/>;
  if (role === "manager") {
    if (section === "sales") return <SalesSection role="manager"/>;
    if (section === "earnings") return <EarningsSection/>;
    return <Navigate to="/crm/manager/dashboard" replace/>;
  }
  if (section === "inventory") return <InventorySection/>;
  if (section === "online-sales") return <SalesSection role="admin" source="online"/>;
  if (section === "offline-sales") return <SalesSection role="admin" source="offline"/>;
  if (section === "managers") return <ManagersQrSection/>;
  if (section === "suppliers") return <SuppliersSection/>;
  if (section === "returns") return <ReturnsSection/>;
  if (section === "expenses") return <ExpensesSection/>;
  if (section === "finance") return <FinanceSection/>;
  if (section === "analytics") return <AnalyticsSection/>;
  if (section === "faq") return <FAQManagementSection/>;
  if (section === "settings") return <SettingsSection/>;
  return <Navigate to="/crm/admin/dashboard" replace/>;
}
