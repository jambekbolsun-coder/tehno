import { repositories } from "@/repositories";
import type { FinancialSummary } from "@/types/domain";
import { isOrderFinanciallyRecognized } from "@/utils/orders";

export interface FinanceService {
  summary(): FinancialSummary;
  managerDebt(managerId: string): number;
  supplierDebt(supplierId: string): number;
}

class LocalFinanceService implements FinanceService {
  managerDebt(managerId: string): number {
    const recognizedOrderIds = new Set(
      repositories.orders.findAll().filter(isOrderFinanciallyRecognized).map((order) => order.id),
    );
    const accrued = repositories.commissions
      .findAll()
      .filter((item) => item.managerId === managerId && item.status !== "cancelled" && recognizedOrderIds.has(item.orderId))
      .reduce((sum, item) => sum + item.amount, 0);
    const paid = repositories.managerPayouts
      .findAll()
      .filter((item) => item.managerId === managerId)
      .reduce((sum, item) => sum + item.amount, 0);
    return Math.max(0, accrued - paid);
  }

  supplierDebt(supplierId: string): number {
    const recognizedOrderIds = new Set(
      repositories.orders.findAll().filter(isOrderFinanciallyRecognized).map((order) => order.id),
    );
    return repositories.supplierDebts
      .findAll()
      .filter((item) => item.supplierId === supplierId && recognizedOrderIds.has(item.orderId))
      .reduce((sum, item) => sum + Math.max(0, item.amount - item.paid), 0);
  }

  summary(): FinancialSummary {
    const orders = repositories.orders.findAll().filter(isOrderFinanciallyRecognized);
    const recognizedOrderIds = new Set(orders.map((order) => order.id));
    const revenue = orders.reduce((sum, order) => sum + order.total, 0);
    const cashReceived = orders.reduce((sum, order) => sum + order.paid, 0);
    const onlineRevenue = orders.filter((order) => order.source === "online").reduce((sum, order) => sum + order.total, 0);
    const offlineRevenue = orders.filter((order) => order.source === "offline").reduce((sum, order) => sum + order.total, 0);
    const costOfGoods = orders.reduce(
      (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.purchasePrice * item.quantity, 0),
      0,
    );
    const supplierDebt = repositories.supplierDebts.findAll()
      .filter((item) => recognizedOrderIds.has(item.orderId))
      .reduce((sum, item) => sum + Math.max(0, item.amount - item.paid), 0);
    const managerCommissions = repositories.commissions
      .findAll()
      .filter((item) => item.status !== "cancelled" && recognizedOrderIds.has(item.orderId))
      .reduce((sum, item) => sum + item.amount, 0);
    const paidCommissions = repositories.managerPayouts.findAll().reduce((sum, item) => sum + item.amount, 0);
    const supplierPayments = repositories.supplierPayments.findAll().reduce((sum, item) => sum + item.amount, 0);
    const managerDebt = Math.max(0, managerCommissions - paidCommissions);
    const expenses = repositories.expenses.findAll().reduce((sum, item) => sum + item.amount, 0);
    const returns = repositories.returns.findAll().reduce((sum, item) => sum + item.amount, 0);
    const accrualProfit = revenue - costOfGoods - managerCommissions - expenses - returns;
    const cashFlow = cashReceived - supplierPayments - paidCommissions - expenses - returns;
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
