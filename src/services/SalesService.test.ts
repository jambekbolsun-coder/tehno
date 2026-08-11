import { beforeEach, describe, expect, it } from "vitest";
import { repositories } from "@/repositories";
import { resetTestRepositories } from "@/test/seedRepositories";
import { salesService } from "@/services/SalesService";

describe("SalesService", () => {
  beforeEach(() => resetTestRepositories());

  it("одной операцией обновляет заказ, склад, комиссию и долг поставщику", () => {
    const product = repositories.products.findAll().find((item) => item.stock > 1)!;
    const manager = repositories.managers.findAll().find((item) => item.status === "active")!;
    const stockBefore = product.stock;
    const order = salesService.createSale({
      productId: product.id,
      quantity: 1,
      fullName: "Айжан Тестова",
      phone: "+996 700 111 222",
      address: "ул. Токтогула, 236",
      region: "Бишкек",
      managerId: manager.id,
      source: "offline",
      paymentMethod: "cash",
    }, "user-admin");

    expect(order.number).toMatch(/^SALE-/);
    expect(repositories.products.findById(product.id)?.stock).toBe(stockBefore - 1);
    const commission = repositories.commissions.findAll().find((item) => item.orderId === order.id)!;
    const expectedCommission = product.managerRewardType === "percent"
      ? Math.round((order.total * product.managerRewardValue) / 10_000)
      : product.managerRewardValue;
    expect(commission.amount).toBe(expectedCommission);
    expect(repositories.supplierDebts.findAll().find((item) => item.orderId === order.id)?.amount).toBe(product.purchasePrice);
    expect(repositories.payments.findAll().find((item) => item.orderId === order.id)?.amount).toBe(order.total);
  });

  it("не создаёт продажу при превышении остатка", () => {
    const product = repositories.products.findAll().find((item) => item.stock > 0)!;
    const manager = repositories.managers.findAll()[0];
    const ordersBefore = repositories.orders.findAll().length;
    expect(() => salesService.createSale({
      productId: product.id,
      quantity: product.stock + 1,
      fullName: "Клиент",
      phone: "+996 700 000 000",
      address: "Бишкек",
      region: "Бишкек",
      managerId: manager.id,
      source: "online",
    }, "user-admin")).toThrow("Недостаточно");
    expect(repositories.orders.findAll()).toHaveLength(ordersBefore);
  });
});
