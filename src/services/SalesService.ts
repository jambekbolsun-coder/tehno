import { repositories } from "@/repositories";
import { inventoryService } from "@/services/InventoryService";
import type { AIParsedOrder, Customer, Order } from "@/types/domain";
import { nowIso } from "@/utils/date";
import { createId, createNumber } from "@/utils/id";

export interface CreateSaleInput {
  productId: string;
  quantity: number;
  fullName: string;
  phone: string;
  address: string;
  region: string;
  managerId: string;
  amount?: number;
  source: "online" | "offline";
  paymentMethod?: "cash" | "card" | "transfer" | "installment";
}

export interface SalesService {
  createSale(input: CreateSaleInput, userId: string): Order;
  createFromAI(parsed: AIParsedOrder, userId: string): Order;
}

class LocalSalesService implements SalesService {
  createSale(input: CreateSaleInput, userId: string): Order {
    const product = repositories.products.findById(input.productId);
    if (!product) throw new Error("Товар не найден");
    inventoryService.validateSale(product.id, input.quantity);
    const now = nowIso();
    let customer = repositories.customers.findAll().find((item) => item.phone.replace(/\D/g, "") === input.phone.replace(/\D/g, ""));
    if (!customer) {
      customer = {
        id: createId("customer"),
        fullName: input.fullName,
        phone: input.phone,
        address: input.address,
        region: input.region,
        managerId: input.managerId,
        notes: "Создан автоматически при продаже",
        totalSpent: 0,
        purchaseCount: 0,
        createdAt: now,
        updatedAt: now,
      } satisfies Customer;
      repositories.customers.create(customer);
    }
    const unitPrice = input.amount && input.quantity === 1 ? input.amount : product.salePrice;
    const total = unitPrice * input.quantity;
    const orders = repositories.orders.findAll();
    const order: Order = {
      id: createId("order"),
      number: createNumber("SALE", orders.length),
      customerId: customer.id,
      managerId: input.managerId,
      items: [{
        id: createId("order-item"),
        productId: product.id,
        name: product.name.ru,
        quantity: input.quantity,
        unitPrice,
        purchasePrice: product.purchasePrice,
        total,
      }],
      subtotal: total,
      discount: 0,
      total,
      paid: total,
      purchaseMethod: input.paymentMethod === "installment" ? "installment" : "full",
      source: input.source,
      status: "completed",
      createdAt: now,
      updatedAt: now,
    };
    repositories.orders.create(order);
    inventoryService.move(product.id, "sale", -input.quantity, `Продажа ${order.number}`, userId);
    repositories.customers.update(customer.id, {
      totalSpent: customer.totalSpent + total,
      purchaseCount: customer.purchaseCount + 1,
      updatedAt: now,
    });
    const commissionAmount = product.managerRewardType === "percent"
      ? Math.round((total * product.managerRewardValue) / 10_000)
      : product.managerRewardValue * input.quantity;
    repositories.commissions.create({
      id: createId("commission"),
      managerId: input.managerId,
      orderId: order.id,
      amount: commissionAmount,
      status: "accrued",
      createdAt: now,
      updatedAt: now,
    });
    repositories.supplierDebts.create({
      id: createId("supplier-debt"),
      supplierId: product.supplierId,
      orderId: order.id,
      amount: product.purchasePrice * input.quantity,
      paid: 0,
      createdAt: now,
      updatedAt: now,
    });
    repositories.payments.create({
      id: createId("payment"),
      orderId: order.id,
      amount: total,
      method: input.paymentMethod ?? "cash",
      status: "paid",
      paidAt: now,
      createdAt: now,
      updatedAt: now,
    });
    const manager = repositories.managers.findById(input.managerId);
    if (manager) repositories.managers.update(manager.id, { salesCount: manager.salesCount + 1, earned: manager.earned + commissionAmount, updatedAt: now });
    const supplierProduct = repositories.supplierProducts.findAll().find((item) => item.productId === product.id && item.supplierId === product.supplierId);
    if (supplierProduct) repositories.supplierProducts.update(supplierProduct.id, { soldQuantity: supplierProduct.soldQuantity + input.quantity, updatedAt: now });
    repositories.auditLogs.create({
      id: createId("audit"),
      userId,
      action: "sale.created",
      entityType: "Order",
      entityId: order.id,
      after: order,
      comment: "Продажа проведена атомарной тестовой операцией",
      createdAt: now,
      updatedAt: now,
    });
    repositories.notifications.create({
      id: createId("notification"),
      userId: "user-admin",
      type: "sale",
      title: "Новая продажа",
      message: `${order.number} · ${product.name.ru}`,
      isRead: false,
      link: `/crm/admin/${input.source === "online" ? "online-sales" : "offline-sales"}`,
      createdAt: now,
      updatedAt: now,
    });
    return order;
  }

  createFromAI(parsed: AIParsedOrder, userId: string): Order {
    if (parsed.missingFields.length) throw new Error(`Не заполнено: ${parsed.missingFields.join(", ")}`);
    const query = parsed.productName!.toLowerCase();
    const product = repositories.products.findAll().find((item) =>
      [item.name.ru, item.name.kg, item.name.en, item.model, item.sku].some((value) => value.toLowerCase().includes(query) || query.includes(value.toLowerCase().split(" ")[0])),
    );
    if (!product) throw new Error("Товар не найден в каталоге. Выберите его вручную.");
    const managerQuery = parsed.managerName!.toLowerCase();
    const manager = repositories.managers.findAll().find((item) => item.name.toLowerCase().includes(managerQuery) || managerQuery.includes(item.name.split(" ")[0].toLowerCase()));
    if (!manager) throw new Error("Менеджер не найден");
    return this.createSale({
      productId: product.id,
      quantity: 1,
      fullName: parsed.fullName!,
      phone: parsed.phone!,
      address: parsed.address!,
      region: parsed.address!.match(/г\.\s*([^,]+)/i)?.[1] ?? "Уточнить",
      managerId: manager.id,
      amount: parsed.amount,
      source: "offline",
      paymentMethod: parsed.paymentType?.toLowerCase().includes("расср") ? "installment" : "cash",
    }, userId);
  }
}

export const salesService: SalesService = new LocalSalesService();
