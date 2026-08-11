import type { Lead } from "@/types/domain";
import { formatDateTime } from "@/utils/date";
import { formatMoney } from "@/utils/money";

export function buildLeadMessage(lead: Lead): string {
  const products = lead.items
    .map((item) => `${item.productName} — ${item.quantity} шт.`)
    .join(", ");
  return [
    "Новая заявка с сайта TEHNO CENTER 2",
    "",
    `Номер заявки: ${lead.number}`,
    `ФИО: ${lead.fullName}`,
    `Телефон: ${lead.phone}`,
    `Адрес: ${lead.address}, ${lead.region}`,
    `Товар: ${products}`,
    `Количество: ${lead.items.reduce((sum, item) => sum + item.quantity, 0)}`,
    `Тип оплаты: ${lead.purchaseMethod === "installment" ? "Рассрочка" : "Обычная оплата"}`,
    `Срок рассрочки: ${lead.installment ? `${lead.installment.months} мес.` : "—"}`,
    `Ежемесячный платёж: ${lead.installment ? formatMoney(lead.installment.monthlyPayment) : "—"}`,
    `Комментарий: ${lead.comment || "—"}`,
    `Дата и время: ${formatDateTime(lead.createdAt)}`,
  ].join("\n");
}

export function buildWhatsAppUrl(phone: string, message = "Здравствуйте! Хочу узнать о технике."): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
