import { describe, expect, it } from "vitest";
import { toDatabaseLeadStatus, toDatabaseOrderStatus } from "@/repositories/SupabaseGateway";

describe("курьерские статусы", () => {
  it("сохраняет этапы заказа без потери смысла", () => {
    expect(toDatabaseOrderStatus("courier_picked_up")).toBe("courier_picked_up");
    expect(toDatabaseOrderStatus("courier_in_transit")).toBe("courier_in_transit");
    expect(toDatabaseOrderStatus("completed")).toBe("completed");
    expect(toDatabaseOrderStatus("refused")).toBe("rejected");
  });

  it("не записывает технические этапы курьера как выигранную заявку", () => {
    expect(toDatabaseLeadStatus("courier_picked_up")).toBe("confirmed");
    expect(toDatabaseLeadStatus("courier_in_transit")).toBe("confirmed");
    expect(toDatabaseLeadStatus("completed")).toBe("won");
    expect(toDatabaseLeadStatus("refused")).toBe("lost");
  });
});
