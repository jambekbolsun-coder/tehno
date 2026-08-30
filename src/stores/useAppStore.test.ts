import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockProducts } from "@/mock-data/products";
import { supabaseGateway } from "@/repositories/SupabaseGateway";
import { useAppStore } from "@/stores/useAppStore";

describe("useAppStore local customer preferences", () => {
  const product = { ...mockProducts[0], reserved: 0, stock: 3 };

  beforeEach(() => {
    useAppStore.setState({ products: [product], cart: [], favorites: [] });
  });
  afterEach(() => vi.restoreAllMocks());

  it("добавляет товар в корзину", () => {
    useAppStore.getState().addToCart(product.id, 2);
    expect(useAppStore.getState().cart).toEqual([{ productId: product.id, quantity: 2 }]);
  });

  it("разрешает оформить количество выше текущего складского остатка", () => {
    useAppStore.getState().addToCart(product.id, 3);
    useAppStore.getState().addToCart(product.id, 7);
    expect(useAppStore.getState().cart).toEqual([{ productId: product.id, quantity: 10 }]);
  });

  it("сохраняет избранное только на клиентском устройстве", () => {
    useAppStore.getState().toggleFavorite(product.id);
    expect(useAppStore.getState().favorites).toEqual([product.id]);
    useAppStore.getState().toggleFavorite(product.id);
    expect(useAppStore.getState().favorites).toEqual([]);
  });

  it("обновляет сохранённый товар без полной перезагрузки CRM", async () => {
    const savedProduct = { ...product, salePrice: product.salePrice + 100_000 };
    const refresh = vi.fn().mockResolvedValue(undefined);
    const save = vi.spyOn(supabaseGateway, "saveProduct").mockResolvedValue(savedProduct);
    useAppStore.setState({ products: [product], refresh });

    await useAppStore.getState().saveProduct(savedProduct);

    expect(save).toHaveBeenCalledWith(savedProduct, undefined);
    expect(refresh).not.toHaveBeenCalled();
    expect(useAppStore.getState().products[0].salePrice).toBe(savedProduct.salePrice);
    expect(useAppStore.getState().loading).toBe(false);
  });
});
