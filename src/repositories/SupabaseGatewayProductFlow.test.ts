import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Product } from "@/types/domain";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: mocks.rpc,
    from: mocks.from,
  },
}));

import { supabaseGateway } from "@/repositories/SupabaseGateway";

const product: Product = {
  id: "75e1ea38-35ec-4a09-9eae-8ea5af2a9354",
  sku: "TC2-DELIVERY",
  slug: "delivery-product",
  name: { ru: "Товар из поставки", kg: "Товар из поставки", en: "Delivery product" },
  brand: "TestBrand",
  model: "M-1",
  categoryId: "0556428d-bca5-4a1c-9b85-12958341441b",
  supplierId: "935f6ebd-55cb-42c1-ada3-d86c8c091c72",
  description: { ru: "", kg: "", en: "" },
  specifications: [],
  purchasePrice: 1_000_000,
  salePrice: 1_500_000,
  stock: 4,
  reserved: 0,
  minimumStock: 1,
  warrantyMonths: 12,
  managerRewardType: "percent",
  managerRewardValue: 500,
  images: [],
  isFeatured: false,
  isPopular: false,
  isVisible: true,
  isArchived: false,
  installmentEligible: true,
  views: 0,
  source: "supplier",
  arrivalDate: "2026-08-13T00:00:00.000Z",
  createdAt: "2026-08-13T00:00:00.000Z",
  updatedAt: "2026-08-13T00:00:00.000Z",
};

describe("SupabaseGateway supplier product flow", () => {
  beforeEach(() => {
    mocks.rpc.mockReset();
    mocks.from.mockReset();
    mocks.rpc.mockResolvedValue({
      data: { product_id: "c5c26699-8c07-42a0-bbe3-f31fe216c123" },
      error: null,
    });
    mocks.from.mockImplementation((table: string) => {
      if (table !== "product_images") throw new Error(`Unexpected table: ${table}`);
      return {
        delete: () => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      };
    });
  });

  it("всегда использует атомарный RPC, даже если новая карточка уже имеет UUID", async () => {
    await supabaseGateway.saveProduct(product, "a57628ed-c658-4921-b417-5a875458ab21");

    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith(
      "create_product_from_delivery_item",
      expect.objectContaining({
        p_delivery_item_id: "a57628ed-c658-4921-b417-5a875458ab21",
        p_product: expect.objectContaining({
          sale_price_tyiyn: 1_500_000,
          manager_commission_value: 500,
        }),
      }),
    );
  });
});
