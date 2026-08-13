import type { Order } from "@/types/domain";

/**
 * Only finalized orders belong in revenue, profit, commission and sold-unit KPIs.
 * `financialProcessed` is authoritative for Supabase data. The status fallback
 * keeps local fixtures and older exports compatible.
 */
export function isOrderFinanciallyRecognized(order: Order): boolean {
  return order.financialProcessed ?? ["completed", "paid", "installment"].includes(order.status);
}
