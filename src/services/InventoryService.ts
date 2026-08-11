import { repositories } from "@/repositories";
import type { InventoryMovement, InventoryMovementType, Product } from "@/types/domain";
import { nowIso } from "@/utils/date";
import { createId, createNumber } from "@/utils/id";

export interface InventoryService {
  available(product: Product): number;
  move(productId: string, type: InventoryMovementType, quantity: number, reason: string, userId: string): InventoryMovement;
  validateSale(productId: string, quantity: number): void;
}

export class LocalInventoryService implements InventoryService {
  available(product: Product) {
    return Math.max(0, product.stock - product.reserved);
  }

  validateSale(productId: string, quantity: number): void {
    const product = repositories.products.findById(productId);
    if (!product) throw new Error("Товар не найден");
    if (!Number.isInteger(quantity) || quantity <= 0) throw new Error("Количество должно быть больше нуля");
    if (quantity > this.available(product)) throw new Error("Недостаточно товара на складе");
  }

  move(productId: string, type: InventoryMovementType, quantity: number, reason: string, userId: string): InventoryMovement {
    const product = repositories.products.findById(productId);
    if (!product) throw new Error("Товар не найден");
    if (!Number.isInteger(quantity) || quantity === 0) throw new Error("Количество движения некорректно");
    const isReserve = type === "reserve" || type === "unreserve";
    const quantityBefore = isReserve ? product.reserved : product.stock;
    const quantityAfter = quantityBefore + quantity;
    if (quantityAfter < 0) throw new Error("Остаток не может стать отрицательным");
    const now = nowIso();
    repositories.products.update(productId, isReserve
      ? { reserved: quantityAfter, updatedAt: now }
      : { stock: quantityAfter, updatedAt: now });
    const movements = repositories.inventoryMovements.findAll();
    const movement: InventoryMovement = {
      id: createId("movement"),
      number: createNumber("MOV", movements.length),
      productId,
      type,
      quantity,
      quantityBefore,
      quantityAfter,
      reason,
      responsibleUserId: userId,
      createdAt: now,
      updatedAt: now,
    };
    repositories.inventoryMovements.create(movement);
    return movement;
  }
}

export const inventoryService: InventoryService = new LocalInventoryService();
