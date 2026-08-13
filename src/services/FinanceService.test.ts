import { beforeEach, describe, expect, it } from "vitest";
import { clearRepositories, repositories } from "@/repositories";
import { financeService } from "@/services/FinanceService";
import type { Order } from "@/types/domain";

const pendingCourierOrder: Order = {
  id: "order-courier",
  number: "SALE-00277",
  customerId: "customer-1",
  managerId: "manager-1",
  items: [{
    id: "item-1",
    productId: "product-1",
    name: "Пылесос",
    quantity: 1,
    unitPrice: 269_000,
    purchasePrice: 200_000,
    total: 269_000,
  }],
  subtotal: 269_000,
  discount: 0,
  total: 269_000,
  paid: 0,
  purchaseMethod: "full",
  source: "online",
  status: "courier_in_transit",
  financialProcessed: false,
  inventoryProcessed: true,
  courierAdvance: 269_000,
  courierAdvanceStatus: "pending",
  createdAt: "2026-08-12T10:00:00.000Z",
  updatedAt: "2026-08-12T10:00:00.000Z",
};

describe("FinanceService", () => {
  beforeEach(() => clearRepositories());

  it("не признаёт курьерский выкуп выручкой до завершения заказа", () => {
    repositories.orders.create(pendingCourierOrder);
    repositories.supplierDebts.create({
      id: "debt-early",
      supplierId: "supplier-1",
      orderId: pendingCourierOrder.id,
      amount: 200_000,
      paid: 0,
      createdAt: pendingCourierOrder.createdAt,
      updatedAt: pendingCourierOrder.updatedAt,
    });
    repositories.commissions.create({
      id: "commission-early",
      managerId: "manager-1",
      orderId: pendingCourierOrder.id,
      amount: 13_450,
      status: "accrued",
      createdAt: pendingCourierOrder.createdAt,
      updatedAt: pendingCourierOrder.updatedAt,
    });

    expect(financeService.summary()).toMatchObject({
      revenue: 0,
      cashReceived: 0,
      onlineRevenue: 0,
      costOfGoods: 0,
      supplierDebt: 0,
      managerCommissions: 0,
      accrualProfit: 0,
      cashFlow: 0,
    });
  });

  it("после завершения считает начисленную прибыль и реальный поток раздельно", () => {
    repositories.orders.create({
      ...pendingCourierOrder,
      status: "completed",
      paid: 269_000,
      financialProcessed: true,
      courierAdvanceStatus: "settled",
    });
    repositories.supplierDebts.create({
      id: "debt-1", supplierId: "supplier-1", orderId: pendingCourierOrder.id,
      amount: 200_000, paid: 100_000,
      createdAt: pendingCourierOrder.createdAt, updatedAt: pendingCourierOrder.updatedAt,
    });
    repositories.commissions.create({
      id: "commission-1", managerId: "manager-1", orderId: pendingCourierOrder.id,
      amount: 13_450, status: "accrued",
      createdAt: pendingCourierOrder.createdAt, updatedAt: pendingCourierOrder.updatedAt,
    });
    repositories.supplierPayments.create({
      id: "supplier-payment-1", supplierId: "supplier-1", amount: 100_000,
      comment: "Частичная выплата", paidByUserId: "admin", paidAt: pendingCourierOrder.updatedAt,
      createdAt: pendingCourierOrder.createdAt, updatedAt: pendingCourierOrder.updatedAt,
    });
    repositories.managerPayouts.create({
      id: "manager-payment-1", managerId: "manager-1", amount: 5_000,
      comment: "Частичная выплата", paidByUserId: "admin", paidAt: pendingCourierOrder.updatedAt,
      createdAt: pendingCourierOrder.createdAt, updatedAt: pendingCourierOrder.updatedAt,
    });
    repositories.expenses.create({
      id: "expense-1", category: "delivery", amount: 9_000, date: "2026-08-12",
      description: "Доставка", recipient: "Курьер", paymentMethod: "cash", authorUserId: "admin",
      createdAt: pendingCourierOrder.createdAt, updatedAt: pendingCourierOrder.updatedAt,
    });

    const summary = financeService.summary();
    expect(summary.revenue).toBe(269_000);
    expect(summary.cashReceived).toBe(269_000);
    expect(summary.costOfGoods).toBe(200_000);
    expect(summary.supplierDebt).toBe(100_000);
    expect(summary.managerCommissions).toBe(13_450);
    expect(summary.managerDebt).toBe(8_450);
    expect(summary.accrualProfit).toBe(46_550);
    expect(summary.cashFlow).toBe(155_000);
  });
});
