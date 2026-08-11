import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppStore } from "@/stores/useAppStore";
import type { Role } from "@/types/domain";

export function RouteGuard({ role }: { role: Role }) {
  const session = useAppStore((state) => state.session);
  const location = useLocation();
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (session.role !== role) return <Navigate to={session.role === "admin" ? "/crm/admin/dashboard" : "/crm/manager/dashboard"} replace />;
  return <Outlet/>;
}
