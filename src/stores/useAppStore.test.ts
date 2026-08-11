import { beforeEach, describe, expect, it } from "vitest";
import { mockProducts } from "@/mock-data/products";
import { useAppStore } from "@/stores/useAppStore";

describe("useAppStore local customer preferences", () => {
  const product = { ...mockProducts[0], reserved: 0, stock: 3 };

  beforeEach(() => {
    useAppStore.setState({ products: [product], cart: [], favorites: [] });
  });

  it("добавляет доступный товар в корзину", () => {
    useAppStore.getState().addToCart(product.id, 2);
    expect(useAppStore.getState().cart).toEqual([{ productId: product.id, quantity: 2 }]);
  });

  it("не кладёт в корзину больше доступного остатка", () => {
    useAppStore.getState().addToCart(product.id, 3);
    expect(() => useAppStore.getState().addToCart(product.id, 1)).toThrow(/доступно|Available|Жеткиликтүү/);
  });

  it("сохраняет избранное только на клиентском устройстве", () => {
    useAppStore.getState().toggleFavorite(product.id);
    expect(useAppStore.getState().favorites).toEqual([product.id]);
    useAppStore.getState().toggleFavorite(product.id);
    expect(useAppStore.getState().favorites).toEqual([]);
  });
});
