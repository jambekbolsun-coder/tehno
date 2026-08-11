import type { AIParsedOrder } from "@/types/domain";
import { toMinor } from "@/utils/money";

export interface AIParserService {
  parse(rawText: string): AIParsedOrder;
}

const clean = (value?: string) => value?.replace(/^[:\s-]+|\s+$/g, "").trim();

export class LocalAIParserService implements AIParserService {
  parse(rawText: string): AIParsedOrder {
    const lines = rawText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const find = (patterns: RegExp[]) => {
      for (const line of lines) {
        for (const pattern of patterns) {
          const match = line.match(pattern);
          if (match?.[1]) return clean(match[1]);
        }
      }
      return undefined;
    };

    const orderNumber = find([/^№\s*([\w-]+)/i, /(?:заказ|номер)\s*[:№]?\s*([\w-]+)/i]);
    const productName = find([/(?:📦\s*)?(?:заказ|товар)\s*:\s*(.+)/i, /(?:продукт)\s*:\s*(.+)/i]);
    const address = find([/(?:🚛\s*)?(?:адрес)\s*:\s*(.+)/i]);
    const managerName = find([/(?:🧑🏻?‍?🔧\s*)?(?:менеджер)\s*:\s*(.+)/i]);
    let fullName = find([/(?:👤\s*)?(?:фио|клиент)\s*:\s*(.+)/i]);
    const phone = find([/(?:📞\s*)?(\+?996[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{3})/]);
    const amountText = find([/(?:💵\s*)?(?:оплата|сумма|итого)\s*:\s*([\d\s.,]+)/i]);
    const paymentType = find([/(?:тип оплаты|способ оплаты)\s*:\s*(.+)/i]);
    const source = find([/(?:источник)\s*:\s*(.+)/i]) ?? "Ручной импорт";
    const dateTime = find([/(?:дата|время)\s*:\s*(.+)/i]) ?? new Date().toISOString();

    if (!fullName) {
      const probableName = lines.find(
        (line) =>
          /^[А-ЯЁA-Z][а-яёa-z]+\s+[А-ЯЁA-Z][а-яёa-z]+/.test(line) &&
          !line.includes(":") &&
          !line.startsWith("№"),
      );
      fullName = probableName;
    }

    const amountNumber = amountText ? Number(amountText.replace(/\s/g, "").replace(",", ".")) : undefined;
    const amount = Number.isFinite(amountNumber) ? toMinor(amountNumber as number) : undefined;
    const required: Array<[keyof AIParsedOrder, string]> = [
      ["productName", "Товар"],
      ["address", "Адрес"],
      ["fullName", "ФИО"],
      ["phone", "Телефон"],
      ["managerName", "Менеджер"],
      ["amount", "Сумма"],
    ];
    const values = { orderNumber, productName, address, fullName, phone, managerName, amount, paymentType, source, dateTime };
    const missingFields = required.filter(([key]) => !values[key as keyof typeof values]).map(([, label]) => label);
    const recognized = required.length - missingFields.length;

    return {
      ...values,
      missingFields,
      confidence: Math.round((recognized / required.length) * 100),
    };
  }
}

export const aiParserService: AIParserService = new LocalAIParserService();
