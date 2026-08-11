import { describe, expect, it } from "vitest";
import { LocalAIParserService } from "@/services/AIParserService";
import { toMinor } from "@/utils/money";

describe("LocalAIParserService", () => {
  it("разбирает полевой текст заказа и нормализует сумму", () => {
    const result = new LocalAIParserService().parse(`
№ 2
📦 Заказ: руч пыл
🚛 Адрес: г. Ош, Южный, Прибрежная 46/1
Хамракулова Диёрахон
🧑🏻‍🔧 Менеджер: Акберди
👤 ФИО: Диёрахон Хамракулова
📞 +996 507 276 770
💵 Оплата: 2790 сом
`);

    expect(result.orderNumber).toBe("2");
    expect(result.productName).toBe("руч пыл");
    expect(result.address).toContain("г. Ош");
    expect(result.fullName).toBe("Диёрахон Хамракулова");
    expect(result.phone).toBe("+996 507 276 770");
    expect(result.managerName).toBe("Акберди");
    expect(result.amount).toBe(toMinor(2790));
    expect(result.missingFields).toEqual([]);
    expect(result.confidence).toBe(100);
  });

  it("показывает недостающие обязательные поля", () => {
    const result = new LocalAIParserService().parse("📦 Товар: чайник");
    expect(result.missingFields).toContain("Телефон");
    expect(result.missingFields).toContain("Адрес");
    expect(result.confidence).toBeLessThan(100);
  });
});

