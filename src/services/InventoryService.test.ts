import { beforeEach, describe, expect, it } from "vitest";
import { repositories } from "@/repositories";
import { resetTestRepositories } from "@/test/seedRepositories";
import { LocalInventoryService } from "@/services/InventoryService";

describe("LocalInventoryService", () => {
  beforeEach(() => resetTestRepositories());

  it("не позволяет продать больше доступного остатка", () => {
    const product = repositories.products.findAll().find((item) => item.stock > 0)!;
    const service = new LocalInventoryService();
    expect(() => service.validateSale(product.id, product.stock - product.reserved + 1)).toThrow("Недостаточно");
  });

  it("пишет движение и не допускает отрицательный склад", () => {
    const product = repositories.products.findAll().find((item) => item.stock > 0)!;
    const service = new LocalInventoryService();
    const beforeMovements = repositories.inventoryMovements.findAll().length;

    const movement = service.move(product.id, "sale", -product.stock, "Тестовая продажа", "user-admin");
    expect(movement.quantityAfter).toBe(0);
    expect(repositories.products.findById(product.id)?.stock).toBe(0);
    expect(repositories.inventoryMovements.findAll()).toHaveLength(beforeMovements + 1);
    expect(() => service.move(product.id, "sale", -1, "Лишняя продажа", "user-admin")).toThrow("отрицательным");
  });
});
