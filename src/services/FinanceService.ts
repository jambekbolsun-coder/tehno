import { repositories } from "@/repositories";
import type { FinancialSummary } from "@/types/domain";

export interface FinanceService {
  summary(): FinancialSummary;
  managerDebt(managerId: string): number;
  supplierDebt(supplierId: string): number;
}

class LocalFinanceService implements FinanceService {
  managerDebt(managerId: string): number {
    const accrued = repositories.commissions
      .findAll()
      .filter((item) => item.managerId === managerId && item.status !== "cancelled")
      .reduce((sum, item) => sum + item.amount, 0);
    const paid = repositories.managerPayouts
      .findAll()
      .filter((item) => item.managerId === managerId)
      .reduce((sum, item) => sum + item.amount, 0);
    return Math.max(0, accrued - paid);
  }

  supplierDebt(supplierId: string): number {
    return repositories.supplierDebts
      .findAll()
      .filter((item) => item.supplierId === supplierId)
      .reduce((sum, item) => sum + Math.max(0, item.amount - item.paid), 0);
  }

  summary(): FinancialSummary {
    const orders = repositories.orders.findAll();
    const revenue = orders.reduce((sum, order) => sum + order.total, 0);
    const cashReceived = orders.reduce((sum, order) => sum + order.paid, 0);
    const onlineRevenue = orders.filter((order) => order.source === "online").reduce((sum, order) => sum + order.total, 0);
    const offlineRevenue = orders.filter((order) => order.source === "offline").reduce((sum, order) => sum + order.total, 0);
    const costOfGoods = orders.reduce(
      (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.purchasePrice * item.quantity, 0),
      0,
    );
    const supplierDebt = repositories.supplierDebts.findAll().reduce((sum, item) => sum + Math.max(0, item.amount - item.paid), 0);
    const managerCommissions = repositories.commissions
      .findAll()
      .filter((item) => item.status !== "cancelled")
      .reduce((sum, item) => sum + item.amount, 0);
    const paidCommissions = repositories.managerPayouts.findAll().reduce((sum, item) => sum + item.amount, 0);
    const managerDebt = Math.max(0, managerCommissions - paidCommissions);
    const expenses = repositories.expenses.findAll().reduce((sum, item) => sum + item.amount, 0);
    const returns = repositories.returns.findAll().reduce((sum, item) => sum + item.amount, 0);
    const accrualProfit = revenue - costOfGoods - managerCommissions - expenses - returns;
    const cashFlow = cashReceived - costOfGoods - paidCommissions - expenses - returns;
    return {
      revenue,
      cashReceived,
      onlineRevenue,
      offlineRevenue,
      costOfGoods,
      supplierDebt,
      managerCommissions,
      managerDebt,
      expenses,
      returns,
      accrualProfit,
      cashFlow,
    };
  }
}

export const financeService: FinanceService = new LocalFinanceService();
