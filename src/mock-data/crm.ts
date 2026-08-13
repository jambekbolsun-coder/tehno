import { DEFAULT_INSTALLMENT_PLANS, INSTALLMENT_EXPLANATION } from "@/constants/installments";
import type {
  AIImportLog,
  AnalyticsEvent,
  AppNotification,
  AppSettings,
  AuditLog,
  Customer,
  Expense,
  FAQ,
  InventoryMovement,
  Lead,
  ManagerCommission,
  ManagerPayout,
  ManagerProfile,
  Order,
  Payment,
  ReturnRecord,
  Supplier,
  SupplierDebt,
  SupplierPayment,
  SupplierProduct,
  User,
} from "@/types/domain";
import { toMinor } from "@/utils/money";

const createdAt = "2026-08-01T09:00:00.000Z";
const updatedAt = "2026-08-11T14:20:00.000Z";
const l = (ru: string, kg: string, en: string) => ({ ru, kg, en });

export const mockUsers: User[] = [
  {
    id: "user-admin",
    name: "Айдана Садыкова",
    phone: "+996 700 200 300",
    email: "admin@tehno.kg",
    password: "test-only",
    role: "admin",
    isActive: true,
    createdAt,
    updatedAt,
  },
  ...["Акберди Осмонов", "Алина Мамбетова", "Нурсултан Абдиев", "Мээрим Ибраимова", "Данияр Токтосунов"].map(
    (name, index): User => ({
      id: `user-manager-${index + 1}`,
      name,
      phone: `+996 55${index + 1} 20${index + 1} 30${index + 1}`,
      email: index === 0 ? "manager@tehno.kg" : `manager${index + 1}@tehno.kg`,
      password: "test-only",
      role: "manager",
      isActive: true,
      createdAt,
      updatedAt,
    }),
  ),
];

export const mockManagers: ManagerProfile[] = mockUsers
  .filter((user) => user.role === "manager")
  .map((user, index) => ({
    id: `manager-${index + 1}`,
    userId: user.id,
    name: user.name,
    phone: user.phone,
    status: index === 4 ? "paused" : "active",
    acceptsLeads: index !== 4,
    leadCount: 18 - index * 2,
    processedLeadCount: 14 - index,
    salesCount: 8 - index,
    earned: toMinor(18400 - index * 1800),
    paid: toMinor(9000 - index * 1000),
    createdAt,
    updatedAt,
  }));

export const mockSuppliers: Supplier[] = [
  ["supplier-1", "Asia Tech Distribution", "Бакыт Т.", "+996 555 410 410", "г. Бишкек, ул. Льва Толстого, 104", toMinor(540000)],
  ["supplier-2", "Smart Import KG", "Эльдар К.", "+996 700 505 505", "г. Бишкек, рынок Дордой", toMinor(286000)],
  ["supplier-3", "Home Pro Trade", "Назгуль А.", "+996 777 330 330", "г. Бишкек, ул. Медерова, 42", toMinor(194000)],
].map(([id, name, contactPerson, phone, address, paid]) => ({
  id: id as string,
  name: name as string,
  contactPerson: contactPerson as string,
  phone: phone as string,
  address: address as string,
  notes: "Комиссионные товары. Расчёт только за фактически проданные единицы.",
  paid: paid as number,
  isActive: true,
  createdAt,
  updatedAt,
}));

export const mockCustomers: Customer[] = [
  ["customer-1", "Диёрахон Хамракулова", "+996 507 276 770", "Прибрежная 46/1", "Ош", "manager-1", 3, 124970],
  ["customer-2", "Айбек Султанов", "+996 701 445 566", "12 мкр, 18", "Бишкек", "manager-2", 2, 88980],
  ["customer-3", "Элнура Жумабаева", "+996 555 120 909", "ул. Манаса, 14", "Каракол", "manager-1", 1, 28990],
  ["customer-4", "Руслан Токтогулов", "+996 777 410 220", "ул. Ленина, 57", "Талас", "manager-3", 1, 52990],
  ["customer-5", "Гульмира Асанова", "+996 500 330 881", "8 мкр, 41", "Бишкек", "manager-4", 2, 72980],
].map(([id, fullName, phone, address, region, managerId, purchaseCount, totalSpent]) => ({
  id: id as string,
  fullName: fullName as string,
  phone: phone as string,
  address: address as string,
  region: region as string,
  managerId: managerId as string,
  notes: "Покупатель TEHNO CENTER 2",
  purchaseCount: purchaseCount as number,
  totalSpent: toMinor(totalSpent as number),
  createdAt,
  updatedAt,
}));

const statusHistory = (leadId: string, managerId: string, status: Lead["status"]) => [
  {
    id: `${leadId}-history-1`,
    toStatus: status,
    changedAt: updatedAt,
    changedByUserId: managerId,
    comment: "Статус обновлён в тестовой CRM",
  },
];

const leadSeed: Array<[
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  number,
  Lead["source"],
  Lead["status"],
  string
]> = [
  ["lead-1", "TC2-00001", "Диёрахон Хамракулова", "+996 507 276 770", "г. Ош, Южный, Прибрежная 46/1", "Ош", "product-3", 28990, "site", "new", "manager-1"],
  ["lead-2", "TC2-00002", "Айбек Султанов", "+996 701 445 566", "12 мкр, 18", "Бишкек", "product-8", 64990, "whatsapp", "working", "manager-2"],
  ["lead-3", "TC2-00003", "Элнура Жумабаева", "+996 555 120 909", "ул. Манаса, 14", "Каракол", "product-7", 52990, "instagram", "consulted", "manager-1"],
  ["lead-4", "TC2-00004", "Руслан Токтогулов", "+996 777 410 220", "ул. Ленина, 57", "Талас", "product-2", 48990, "site", "confirmed", "manager-3"],
  ["lead-5", "TC2-00005", "Гульмира Асанова", "+996 500 330 881", "8 мкр, 41", "Бишкек", "product-5", 79990, "store", "packed", "manager-4"],
  ["lead-6", "TC2-00006", "Мирбек Маматов", "+996 709 821 450", "ул. Фрунзе, 7", "Нарын", "product-1", 56990, "site", "handed_to_courier", "manager-2"],
  ["lead-7", "TC2-00007", "Зарина Осмонова", "+996 552 141 888", "ул. Гагарина, 24", "Джалал-Абад", "product-13", 31990, "manual", "completed", "manager-3"],
];

export const mockLeads: Lead[] = leadSeed.map(
  ([id, number, fullName, phone, address, region, productId, amount, source, status, managerId]) => ({
    id,
    number,
    fullName,
    phone,
    address,
    region,
    items: [{ productId, productName: `Товар ${productId.replace("product-", "№")}`, quantity: 1, unitPrice: toMinor(amount) }],
    total: toMinor(amount),
    purchaseMethod: status === "installment" ? "installment" : "full",
    source,
    managerId,
    status,
    comment: "Тестовая заявка",
    statusHistory: statusHistory(id, managerId, status),
    reassignmentHistory: [],
    createdAt,
    updatedAt,
  }),
);

export const mockOrders: Order[] = mockLeads
  .filter((lead) => ["confirmed", "packed", "handed_to_courier", "completed"].includes(lead.status))
  .map((lead, index) => ({
    id: `order-${index + 1}`,
    number: `SALE-${String(index + 1).padStart(5, "0")}`,
    leadId: lead.id,
    customerId: mockCustomers[index % mockCustomers.length].id,
    managerId: lead.managerId,
    items: lead.items.map((item, itemIndex) => ({
      id: `order-${index + 1}-item-${itemIndex + 1}`,
      productId: item.productId,
      name: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      purchasePrice: Math.round(item.unitPrice * 0.8),
      total: item.unitPrice * item.quantity,
    })),
    subtotal: lead.total,
    discount: 0,
    total: lead.total,
    paid: lead.total,
    purchaseMethod: lead.purchaseMethod,
    source: lead.source === "store" ? "offline" : "online",
    status: lead.status,
    createdAt,
    updatedAt,
  }));

export const mockPayments: Payment[] = mockOrders.map((order, index) => ({
  id: `payment-${index + 1}`,
  orderId: order.id,
  amount: order.paid,
  method: index % 2 ? "transfer" : "cash",
  status: "paid",
  paidAt: updatedAt,
  createdAt,
  updatedAt,
}));

export const mockSupplierProducts: SupplierProduct[] = Array.from({ length: 12 }, (_, index) => ({
  id: `supplier-product-${index + 1}`,
  supplierId: `supplier-${(index % 3) + 1}`,
  productId: `product-${index + 1}`,
  receivedQuantity: 15 + index,
  soldQuantity: 4 + (index % 6),
  returnedQuantity: index % 4 === 0 ? 1 : 0,
  purchasePrice: toMinor(8500 + index * 2800),
  createdAt,
  updatedAt,
}));

export const mockInventoryMovements: InventoryMovement[] = mockOrders.flatMap((order, index) =>
  order.items.map((item) => ({
    id: `movement-${index + 1}-${item.id}`,
    number: `MOV-${String(index + 1).padStart(5, "0")}`,
    productId: item.productId,
    type: "sale",
    quantity: -item.quantity,
    quantityBefore: 8 + index,
    quantityAfter: 7 + index,
    reason: `Продажа ${order.number}`,
    responsibleUserId: order.managerId,
    relatedOrderId: order.id,
    createdAt,
    updatedAt,
  })),
);

export const mockManagerCommissions: ManagerCommission[] = mockOrders.map((order, index) => ({
  id: `commission-${index + 1}`,
  managerId: order.managerId,
  orderId: order.id,
  amount: Math.round(order.total * 0.05),
  status: index === 0 ? "paid" : "accrued",
  createdAt,
  updatedAt,
}));

export const mockManagerPayouts: ManagerPayout[] = [
  {
    id: "manager-payout-1",
    managerId: "manager-1",
    amount: toMinor(9000),
    comment: "Выплата за июль",
    paidByUserId: "user-admin",
    paidAt: "2026-08-05T10:00:00.000Z",
    createdAt,
    updatedAt,
  },
];

export const mockSupplierDebts: SupplierDebt[] = mockOrders.map((order, index) => ({
  id: `supplier-debt-${index + 1}`,
  supplierId: `supplier-${(index % 3) + 1}`,
  orderId: order.id,
  amount: order.items.reduce((sum, item) => sum + item.purchasePrice * item.quantity, 0),
  paid: index === 0 ? Math.round(order.items[0].purchasePrice / 2) : 0,
  createdAt,
  updatedAt,
}));

export const mockSupplierPayments: SupplierPayment[] = [
  {
    id: "supplier-payment-1",
    supplierId: "supplier-1",
    amount: toMinor(220000),
    comment: "Частичная выплата",
    paidByUserId: "user-admin",
    paidAt: "2026-08-06T11:30:00.000Z",
    createdAt,
    updatedAt,
  },
];

export const mockExpenses: Expense[] = [
  ["expense-1", "rent", 40000, "Аренда магазина", "Арендодатель", "transfer", "2026-08-01"],
  ["expense-2", "target", 18000, "Таргетированная реклама", "Meta Ads", "card", "2026-08-03"],
  ["expense-3", "delivery", 7200, "Доставка по регионам", "Курьерская служба", "cash", "2026-08-05"],
  ["expense-4", "advertising", 12500, "Контент и баннеры", "Подрядчик", "transfer", "2026-08-08"],
].map(([id, category, amount, description, recipient, paymentMethod, date]) => ({
  id: id as string,
  category: category as Expense["category"],
  amount: toMinor(amount as number),
  description: description as string,
  recipient: recipient as string,
  paymentMethod: paymentMethod as string,
  date: date as string,
  authorUserId: "user-admin",
  createdAt,
  updatedAt,
}));

export const mockReturns: ReturnRecord[] = [
  {
    id: "return-1",
    number: "RET-00001",
    orderId: "order-1",
    productId: "product-2",
    customerId: "customer-2",
    supplierId: "supplier-1",
    managerId: "manager-2",
    reason: "Повреждение упаковки при доставке",
    type: "return",
    quantity: 1,
    condition: "Товар исправен",
    amount: toMinor(48990),
    photos: [],
    comment: "Ожидает решения управляющего",
    decision: "pending",
    createdAt,
    updatedAt,
  },
];

export const mockNotifications: AppNotification[] = [
  ["notification-1", "user-admin", "lead", "Новая заявка", "Поступила заявка TC2-00001", false, "/crm/admin/leads"],
  ["notification-2", "user-admin", "stock", "Низкий остаток", "Кофемашина Philips: осталось 2 шт.", false, "/crm/admin/inventory"],
  ["notification-3", "user-manager-1", "assignment", "Вам назначен клиент", "Заявка TC2-00001 назначена вам", false, "/crm/manager/leads"],
  ["notification-4", "user-admin", "sale", "Новая продажа", "Продажа SALE-00004 проведена", true, "/crm/admin/online-sales"],
].map(([id, userId, type, title, message, isRead, link]) => ({
  id: id as string,
  userId: userId as string,
  type: type as AppNotification["type"],
  title: title as string,
  message: message as string,
  isRead: isRead as boolean,
  link: link as string,
  createdAt,
  updatedAt,
}));

export const mockFaqs: FAQ[] = [
  ["faq-1", "Есть ли гарантия?", "Ооба, кепилдик барбы?", "Is there a warranty?", "Да. На все товары предоставляется гарантия, срок указан в карточке товара.", "Ооба. Бардык товарларга кепилдик берилет, мөөнөтү товар картасында көрсөтүлгөн.", "Yes. Every product has a warranty stated on its page."],
  ["faq-2", "Доставляете ли вы по Кыргызстану?", "Кыргызстан боюнча жеткиресиздерби?", "Do you deliver across Kyrgyzstan?", "Да, доставляем по Бишкеку и во все регионы Кыргызстана.", "Ооба, Бишкек жана Кыргызстандын бардык аймактарына жеткиребиз.", "Yes, we deliver in Bishkek and throughout Kyrgyzstan."],
  ["faq-3", "Можно ли купить в рассрочку?", "Бөлүп төлөөгө болобу?", "Can I buy in installments?", "Да, срок можно выбрать в калькуляторе. Менеджер подтвердит финальные условия.", "Ооба, мөөнөттү калькулятордон тандай аласыз. Акыркы шарттарды менеджер тактайт.", "Yes. Choose a term in the calculator; a manager confirms final terms."],
  ["faq-4", "Как оформить заказ?", "Кантип заказ берсем болот?", "How do I order?", "Добавьте товар в корзину, заполните заявку и отправьте её в WhatsApp.", "Товарды себетке кошуп, арызды толтуруп, WhatsApp аркылуу жөнөтүңүз.", "Add items to cart, complete the form, and send it via WhatsApp."],
  ["faq-5", "Где находится магазин?", "Дүкөн кайда жайгашкан?", "Where is the store?", "г. Бишкек, ул. Токтогула, 236.", "Бишкек ш., Токтогул көч., 236.", "236 Toktogula Street, Bishkek."],
  ["faq-6", "Как узнать наличие?", "Товардын бар экенин кантип билем?", "How do I check availability?", "Актуальный остаток указан в карточке. Для подтверждения напишите менеджеру.", "Учурдагы калдык товар картасында көрсөтүлгөн. Тактоо үчүн менеджерге жазыңыз.", "Current stock is shown on the product page. Message a manager to confirm."],
  ["faq-7", "Как получить скидку?", "Арзандатууну кантип алам?", "How do I get a discount?", "Приходите в магазин и скажите, что узнали о нас через сайт.", "Дүкөнгө келип, биз жөнүндө сайттан укканыңызды айтыңыз.", "Visit the store and mention that you found us through the website."],
  ["faq-8", "Как работает возврат?", "Кайтаруу кандай иштейт?", "How do returns work?", "Свяжитесь с магазином. Мы проверим товар и предложим решение по правилам гарантии.", "Дүкөнгө кайрылыңыз. Биз товарды текшерип, кепилдик шарттарына ылайык чечим сунуштайбыз.", "Contact the store. We inspect the product and offer a solution under warranty terms."],
].map(([id, qRu, qKg, qEn, aRu, aKg, aEn], position) => ({
  id,
  question: l(qRu, qKg, qEn),
  answer: l(aRu, aKg, aEn),
  position,
  status: "published",
  createdAt,
  updatedAt,
}));

export const mockAnalytics: AnalyticsEvent[] = Array.from({ length: 96 }, (_, index): AnalyticsEvent => ({
  id: `analytics-${index + 1}`,
  type: (["site_visit", "page_view", "product_view", "search", "cart_add", "lead_submit"] as const)[index % 6],
  sessionId: `session-${(index % 28) + 1}`,
  productId: index % 3 === 0 ? `product-${(index % 18) + 1}` : undefined,
  source: ["instagram", "direct", "google", "whatsapp"][index % 4],
  data: index % 6 === 3 ? { query: ["холодильник", "пылесос", "телевизор"][index % 3] } : {},
  createdAt: new Date(Date.parse(createdAt) + index * 2_700_000).toISOString(),
  updatedAt,
}));

export const mockAIImportLogs: AIImportLog[] = [];
export const mockAuditLogs: AuditLog[] = [];

export const mockSettings: AppSettings = {
  id: "settings-main",
  storeName: "TEHNO CENTER 2",
  address: "г. Бишкек, ул. Токтогула, 236",
  whatsappPhone: "+996 999 230 105",
  language: "ru",
  theme: "light",
  installmentPlans: DEFAULT_INSTALLMENT_PLANS,
  installmentExplanation: INSTALLMENT_EXPLANATION,
  installmentMinimum: toMinor(3000),
  roundRobinCursor: 0,
  aiAutoSave: false,
  createdAt,
  updatedAt,
};
