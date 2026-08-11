import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { repositories } from "@/repositories";
import { DEFAULT_INSTALLMENT_PLANS, INSTALLMENT_EXPLANATION } from "@/constants/installments";
import type {
  AIImportLog,
  AnalyticsEvent,
  AppNotification,
  AppSettings,
  AuditLog,
  Brand,
  Category,
  Customer,
  Expense,
  FAQ,
  InventoryMovement,
  Lead,
  LeadStatus,
  ManagerCommission,
  ManagerPayout,
  ManagerProfile,
  Order,
  OrderItem,
  Product,
  ProductImage,
  ProductSpecification,
  ReturnRecord,
  SessionUser,
  Supplier,
  SupplierDebt,
  SupplierPayment,
} from "@/types/domain";
import type { Json, Tables, TablesUpdate } from "@/types/supabase";
import type { CreateLeadInput } from "@/services/LeadService";
import { nowIso } from "@/utils/date";
import { createId } from "@/utils/id";

type ProfileRow = Tables<"profiles">;
type ProductRow = Tables<"products">;
type ProductImageRow = Tables<"product_images">;
type SupplierProductRow = Tables<"supplier_products">;
type PromotionRow = Tables<"promotions">;
type PromotionProductRow = Tables<"promotion_products">;
type OrderRow = Tables<"orders"> & {
  public_request_id?: string | null;
  requested_purchase_method?: string;
  requested_installment_months?: number | null;
  request_metadata?: Json;
};

const asObject = (value: Json | null | undefined): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const text = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;
const number = (value: unknown, fallback = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
const boolean = (value: unknown, fallback = false) =>
  typeof value === "boolean" ? value : fallback;

const mapLeadStatus = (status: string): LeadStatus => {
  const map: Record<string, LeadStatus> = {
    in_progress: "working",
    won: "completed",
    lost: "refused",
    courier_requested: "courier_ordered",
    assembled: "packed",
    rejected: "refused",
  };
  return map[status] ?? (status as LeadStatus);
};

export const toDatabaseLeadStatus = (status: LeadStatus) => {
  if (status === "working") return "in_progress";
  if (["paid", "installment", "completed"].includes(status)) return "won";
  if (status === "refused") return "lost";
  if (status === "cancelled") return "cancelled";
  if (["courier_ordered", "packed", "handed_to_courier", "received"].includes(status))
    return "confirmed";
  return status;
};

export const toDatabaseOrderStatus = (status: LeadStatus) => {
  const map: Partial<Record<LeadStatus, string>> = {
    working: "in_progress",
    courier_ordered: "courier_requested",
    packed: "assembled",
    refused: "rejected",
  };
  return map[status] ?? status;
};

export interface SupabaseSnapshot {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  leads: Lead[];
  orders: Order[];
  managers: ManagerProfile[];
  customers: Customer[];
  suppliers: Supplier[];
  supplierDebts: SupplierDebt[];
  supplierPayments: SupplierPayment[];
  managerCommissions: ManagerCommission[];
  managerPayouts: ManagerPayout[];
  expenses: Expense[];
  returns: ReturnRecord[];
  movements: InventoryMovement[];
  notifications: AppNotification[];
  faqs: FAQ[];
  analytics: AnalyticsEvent[];
  aiLogs: AIImportLog[];
  auditLogs: AuditLog[];
  settings: AppSettings;
}

const defaultSettings = (): AppSettings => {
  const timestamp = nowIso();
  return {
    id: "settings",
    storeName: "TEHNO CENTER 2",
    address: "г. Бишкек",
    whatsappPhone: "+996503500441",
    language: "ru",
    theme: "light",
    installmentPlans: DEFAULT_INSTALLMENT_PLANS.map((plan) => ({ ...plan })),
    installmentExplanation: { ...INSTALLMENT_EXPLANATION },
    installmentMinimum: 0,
    roundRobinCursor: 0,
    aiAutoSave: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

const emptySnapshot = (): SupabaseSnapshot => ({
  products: [],
  categories: [],
  brands: [],
  leads: [],
  orders: [],
  managers: [],
  customers: [],
  suppliers: [],
  supplierDebts: [],
  supplierPayments: [],
  managerCommissions: [],
  managerPayouts: [],
  expenses: [],
  returns: [],
  movements: [],
  notifications: [],
  faqs: [],
  analytics: [],
  aiLogs: [],
  auditLogs: [],
  settings: defaultSettings(),
});

const unwrap = <T>(result: { data: T | null; error: { message: string } | null }, label: string): T => {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data as T;
};

const localized = (
  ru: string,
  kg?: string | null,
  en?: string | null,
) => ({ ru, kg: kg || ru, en: en || ru });

const mapSpecifications = (value: Json): ProductSpecification[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry, index) => {
    const item = asObject(entry);
    const labelRu = text(item.label_ru ?? item.label);
    const valueRu = text(item.value_ru ?? item.value);
    if (!labelRu && !valueRu) return [];
    return [{
      id: text(item.id, `spec-${index + 1}`),
      label: localized(labelRu, text(item.label_kg), text(item.label_en)),
      value: localized(valueRu, text(item.value_kg), text(item.value_en)),
    }];
  });
};

const mapImage = (row: ProductImageRow): ProductImage => ({
  id: row.id,
  url: row.public_url || "",
  alt: localized(row.alt_ru || "", row.alt_kg, row.alt_en),
  position: row.sort_order,
});

const mapSettings = (rows: Tables<"app_settings">[]): AppSettings => {
  const settings = defaultSettings();
  const byKey = new Map(rows.map((row) => [row.key, asObject(row.value)]));
  const store = byKey.get("store") ?? {};
  const contacts = byKey.get("contacts") ?? {};
  const config = byKey.get("installment_config") ?? {};
  const plans = Array.isArray(config.plans) ? config.plans : [];
  if (plans.length) {
    settings.installmentPlans = plans.map((raw, index) => {
      const item = asObject(raw as Json);
      const months = number(item.months, index + 1);
      const timestamp = nowIso();
      return {
        id: `plan-${months}`,
        months,
        rateBasisPoints: number(item.rate_basis_points),
        enabled: boolean(item.enabled, true),
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    });
  }
  const explanation = asObject(config.explanation as Json);
  settings.storeName = text(store.name, settings.storeName);
  settings.address = text(contacts.address, settings.address);
  settings.whatsappPhone = text(contacts.whatsapp, settings.whatsappPhone);
  settings.installmentMinimum = number(config.minimum_tyiyn);
  settings.installmentExplanation = localized(
    text(explanation.ru, settings.installmentExplanation.ru),
    text(explanation.kg, settings.installmentExplanation.kg),
    text(explanation.en, settings.installmentExplanation.en),
  );
  settings.aiAutoSave = boolean(config.ai_auto_save);
  settings.updatedAt = rows.reduce(
    (latest, row) => row.updated_at > latest ? row.updated_at : latest,
    settings.updatedAt,
  );
  return settings;
};

const makeSession = (user: User, profile: ProfileRow): SessionUser => ({
  id: user.id,
  name: profile.full_name || user.email || "Пользователь",
  phone: profile.phone || "",
  email: user.email || "",
  role: profile.role === "admin" ? "admin" : "manager",
  avatar: profile.avatar_url || undefined,
  managerProfileId: profile.role === "manager" ? user.id : undefined,
});

const cacheSnapshot = (snapshot: SupabaseSnapshot) => {
  repositories.products.replaceAll(snapshot.products);
  repositories.categories.replaceAll(snapshot.categories);
  repositories.brands.replaceAll(snapshot.brands);
  repositories.leads.replaceAll(snapshot.leads);
  repositories.orders.replaceAll(snapshot.orders);
  repositories.managers.replaceAll(snapshot.managers);
  repositories.customers.replaceAll(snapshot.customers);
  repositories.suppliers.replaceAll(snapshot.suppliers);
  repositories.supplierDebts.replaceAll(snapshot.supplierDebts);
  repositories.supplierPayments.replaceAll(snapshot.supplierPayments);
  repositories.commissions.replaceAll(snapshot.managerCommissions);
  repositories.managerPayouts.replaceAll(snapshot.managerPayouts);
  repositories.expenses.replaceAll(snapshot.expenses);
  repositories.returns.replaceAll(snapshot.returns);
  repositories.inventoryMovements.replaceAll(snapshot.movements);
  repositories.notifications.replaceAll(snapshot.notifications);
  repositories.faqs.replaceAll(snapshot.faqs);
  repositories.analytics.replaceAll(snapshot.analytics);
  repositories.aiImports.replaceAll(snapshot.aiLogs);
  repositories.auditLogs.replaceAll(snapshot.auditLogs);
  repositories.settings.replaceAll([snapshot.settings]);
};

class SupabaseGateway {
  private async uploadDataUrl(bucket: string, dataUrl: string, folder: string): Promise<string> {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) throw new Error("Требуется авторизация для загрузки файла");
    const blob = await fetch(dataUrl).then((response) => response.blob());
    const extension = blob.type.split("/")[1]?.replace("jpeg", "jpg") || "bin";
    const path = `${authData.user.id}/${folder}/${crypto.randomUUID()}.${extension}`;
    const uploaded = await supabase.storage.from(bucket).upload(path, blob, {
      contentType: blob.type,
      cacheControl: "3600",
    });
    if (uploaded.error) throw new Error(uploaded.error.message);
    return path;
  }

  async getSessionUser(): Promise<SessionUser | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    const result = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    const profile = unwrap(result, "Профиль");
    if (!profile.is_active) {
      await supabase.auth.signOut();
      throw new Error("Учётная запись ещё не активирована управляющим");
    }
    return makeSession(session.user, profile);
  }

  async login(email: string, password: string): Promise<SessionUser> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) throw new Error("Неверный email или пароль");
    const profile = unwrap<ProfileRow>(
      await supabase.from("profiles").select("*").eq("id", data.user.id).single(),
      "Профиль",
    );
    if (!profile) throw new Error("Профиль не найден");
    if (!profile.is_active) {
      await supabase.auth.signOut();
      throw new Error("Учётная запись не активирована");
    }
    return makeSession(data.user, profile);
  }

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const email = userData.user?.email;
    if (userError || !email) throw new Error("Не удалось подтвердить текущую сессию");

    const verification = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (verification.error) throw new Error("Текущий пароль указан неверно");

    const { error } = await supabase.auth.updateUser({
      current_password: currentPassword,
      password: newPassword,
    });
    if (error) throw new Error(error.message);
  }

  async load(session: SessionUser | null): Promise<SupabaseSnapshot> {
    const base = emptySnapshot();
    const [
      categoriesResult,
      brandsResult,
      productsResult,
      imagesResult,
      promotionsResult,
      promotionProductsResult,
      faqsResult,
      settingsResult,
    ] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("brands").select("*").order("sort_order"),
      supabase.from("products").select("*").order("sort_order"),
      supabase.from("product_images").select("*").order("sort_order"),
      supabase.from("promotions").select("*").order("starts_at", { ascending: false }),
      supabase.from("promotion_products").select("*"),
      supabase.from("faqs").select("*").order("sort_order"),
      supabase.from("app_settings").select("*"),
    ]);
    const categories = unwrap(categoriesResult, "Категории");
    const brands = unwrap(brandsResult, "Бренды");
    const productRows = unwrap(productsResult, "Товары");
    const imageRows = unwrap(imagesResult, "Изображения");
    const promotions = unwrap(promotionsResult, "Акции");
    const promotionProducts = unwrap(promotionProductsResult, "Товары акций");
    const faqRows = unwrap(faqsResult, "FAQ");
    const settingsRows = unwrap(settingsResult, "Настройки");

    let supplierProducts: SupplierProductRow[] = [];
    let staffData: {
      profiles: ProfileRow[];
      managerProfiles: Tables<"manager_profiles">[];
      customers: Tables<"customers">[];
      leads: Tables<"leads">[];
      orders: OrderRow[];
      orderItems: Tables<"order_items">[];
      statusHistory: Tables<"order_status_history">[];
      itemFinancials: Tables<"order_item_financials">[];
      suppliers: Tables<"suppliers">[];
      debts: Tables<"supplier_debts">[];
      supplierPayments: Tables<"supplier_payments">[];
      commissions: Tables<"manager_commissions">[];
      managerPayouts: Tables<"manager_payouts">[];
      expenses: Tables<"expenses">[];
      returns: Tables<"returns">[];
      movements: Tables<"inventory_movements">[];
      notifications: Tables<"notifications">[];
      analytics: Tables<"analytics_events">[];
      aiLogs: Tables<"ai_import_logs">[];
      auditLogs: Tables<"audit_logs">[];
    } | null = null;

    if (session) {
      const results = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("manager_profiles").select("*"),
        supabase.from("customers").select("*").order("created_at", { ascending: false }),
        supabase.from("leads").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("order_items").select("*"),
        supabase.from("order_status_history").select("*").order("created_at"),
        supabase.from("order_item_financials").select("*"),
        supabase.from("suppliers").select("*").order("name"),
        supabase.from("supplier_products").select("*"),
        supabase.from("supplier_debts").select("*"),
        supabase.from("supplier_payments").select("*"),
        supabase.from("manager_commissions").select("*"),
        supabase.from("manager_payouts").select("*"),
        supabase.from("expenses").select("*").order("expense_date", { ascending: false }),
        supabase.from("returns").select("*").order("created_at", { ascending: false }),
        supabase.from("inventory_movements").select("*").order("created_at", { ascending: false }),
        supabase.from("notifications").select("*").order("created_at", { ascending: false }),
        supabase.from("analytics_events").select("*").order("occurred_at", { ascending: false }).limit(5000),
        supabase.from("ai_import_logs").select("*").order("created_at", { ascending: false }),
        supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(2000),
      ]);
      const values: unknown[][] = results.map((result, index) => {
        if (result.error) throw new Error(`CRM ${index + 1}: ${result.error.message}`);
        return result.data as unknown[];
      });
      supplierProducts = values[9] as SupplierProductRow[];
      staffData = {
        profiles: values[0] as ProfileRow[],
        managerProfiles: values[1] as Tables<"manager_profiles">[],
        customers: values[2] as Tables<"customers">[],
        leads: values[3] as Tables<"leads">[],
        orders: values[4] as OrderRow[],
        orderItems: values[5] as Tables<"order_items">[],
        statusHistory: values[6] as Tables<"order_status_history">[],
        itemFinancials: values[7] as Tables<"order_item_financials">[],
        suppliers: values[8] as Tables<"suppliers">[],
        debts: values[10] as Tables<"supplier_debts">[],
        supplierPayments: values[11] as Tables<"supplier_payments">[],
        commissions: values[12] as Tables<"manager_commissions">[],
        managerPayouts: values[13] as Tables<"manager_payouts">[],
        expenses: values[14] as Tables<"expenses">[],
        returns: values[15] as Tables<"returns">[],
        movements: values[16] as Tables<"inventory_movements">[],
        notifications: values[17] as Tables<"notifications">[],
        analytics: values[18] as Tables<"analytics_events">[],
        aiLogs: values[19] as Tables<"ai_import_logs">[],
        auditLogs: values[20] as Tables<"audit_logs">[],
      };
    }

    const brandById = new Map(brands.map((row) => [row.id, row]));
    const promotionById = new Map((promotions as PromotionRow[]).map((row) => [row.id, row]));
    const promotionByProduct = new Map(
      (promotionProducts as PromotionProductRow[]).map((row) => [row.product_id, promotionById.get(row.promotion_id)]),
    );
    const supplierByProduct = new Map(
      supplierProducts
        .slice()
        .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
        .map((row) => [row.product_id, row]),
    );
    const viewsByProduct = new Map<string, number>();
    staffData?.analytics.forEach((event) => {
      if (event.event_name === "product_view" && event.product_id)
        viewsByProduct.set(event.product_id, (viewsByProduct.get(event.product_id) ?? 0) + 1);
    });

    base.categories = categories.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: localized(row.name_ru, row.name_kg, row.name_en),
      icon: row.image_url || "package",
      isVisible: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    base.brands = brands.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    base.products = (productRows as ProductRow[]).map((row) => {
      const supplier = supplierByProduct.get(row.id);
      const promotion = promotionByProduct.get(row.id);
      const images = (imageRows as ProductImageRow[])
        .filter((image) => image.product_id === row.id)
        .map(mapImage);
      return {
        id: row.id,
        sku: row.sku,
        slug: row.slug,
        name: localized(row.name_ru, row.name_kg, row.name_en),
        brand: row.brand_id ? brandById.get(row.brand_id)?.name || "" : "",
        model: row.model || "",
        categoryId: row.category_id,
        supplierId: supplier?.supplier_id || "",
        description: localized(row.description_ru || "", row.description_kg, row.description_en),
        specifications: mapSpecifications(row.specifications),
        purchasePrice: supplier?.purchase_price_tyiyn || 0,
        salePrice: row.sale_price_tyiyn,
        oldPrice: row.old_price_tyiyn || undefined,
        stock: row.stock_quantity,
        reserved: row.reserved_quantity,
        minimumStock: row.minimum_stock,
        warrantyMonths: row.warranty_months,
        managerRewardType: row.manager_commission_type === "fixed" ? "fixed" : "percent",
        managerRewardValue: row.manager_commission_value,
        images,
        promotion: promotion ? {
          id: promotion.id,
          type: promotion.discount_type === "fixed" ? "sale" : "discount",
          title: localized(promotion.title_ru, promotion.title_kg, promotion.title_en),
          startAt: promotion.starts_at,
          endAt: promotion.ends_at,
          discountPercent: promotion.discount_type === "percent" ? promotion.discount_value : undefined,
          specialPrice: promotion.discount_type === "fixed" ? promotion.discount_value : undefined,
          isActive: promotion.is_active,
          createdAt: promotion.created_at,
          updatedAt: promotion.updated_at,
        } : undefined,
        isFeatured: row.is_featured,
        isPopular: row.sort_order < 10,
        isVisible: row.is_active && row.status !== "hidden" && row.status !== "archived",
        isArchived: row.status === "archived",
        installmentEligible: row.installment_allowed,
        views: viewsByProduct.get(row.id) ?? 0,
        source: supplier ? "supplier" : "store",
        arrivalDate: row.created_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });
    base.faqs = faqRows.map((row) => ({
      id: row.id,
      question: localized(row.question_ru, row.question_kg, row.question_en),
      answer: localized(row.answer_ru, row.answer_kg, row.answer_en),
      position: row.sort_order,
      status: row.is_active ? "published" : "hidden",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    base.settings = mapSettings(settingsRows);

    if (!staffData) {
      cacheSnapshot(base);
      return base;
    }

    const customerById = new Map(staffData.customers.map((row) => [row.id, row]));
    const itemsByOrder = new Map<string, Tables<"order_items">[]>();
    staffData.orderItems.forEach((item) =>
      itemsByOrder.set(item.order_id, [...(itemsByOrder.get(item.order_id) ?? []), item]),
    );
    const financialByItem = new Map(staffData.itemFinancials.map((row) => [row.order_item_id, row]));
    const orderByLead = new Map(staffData.orders.filter((row) => row.lead_id).map((row) => [row.lead_id!, row]));

    base.customers = staffData.customers.map((row) => ({
      id: row.id,
      fullName: row.full_name,
      phone: row.phone,
      address: row.address || "",
      region: row.region || row.city || "",
      managerId: row.manager_id || undefined,
      notes: row.notes || "",
      totalSpent: row.total_spent_tyiyn,
      purchaseCount: row.total_orders,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    base.orders = staffData.orders.map((row) => {
      const items: OrderItem[] = (itemsByOrder.get(row.id) ?? []).map((item) => ({
        id: item.id,
        productId: item.product_id || "",
        name: item.product_name,
        quantity: item.quantity,
        unitPrice: item.unit_price_tyiyn,
        purchasePrice: financialByItem.get(item.id)?.unit_cost_tyiyn || 0,
        total: item.line_total_tyiyn,
      }));
      const months = row.requested_installment_months || undefined;
      return {
        id: row.id,
        number: `ORD-${row.order_number}`,
        leadId: row.lead_id || undefined,
        customerId: row.customer_id,
        managerId: row.assigned_manager_id || "",
        items,
        subtotal: row.subtotal_tyiyn,
        discount: row.discount_tyiyn,
        total: row.total_tyiyn,
        paid: row.paid_tyiyn,
        purchaseMethod: row.requested_purchase_method === "installment" ? "installment" : "full",
        installment: months ? {
          months,
          rateBasisPoints: 0,
          overpayment: 0,
          total: row.total_tyiyn,
          monthlyPayment: Math.ceil(row.total_tyiyn / months),
        } : undefined,
        source: row.sale_channel === "offline" ? "offline" : "online",
        status: mapLeadStatus(row.status),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });
    base.leads = staffData.leads.map((row) => {
      const customer = customerById.get(row.customer_id);
      const order = orderByLead.get(row.id);
      const items = order ? (itemsByOrder.get(order.id) ?? []).map((item) => ({
        productId: item.product_id || "",
        productName: item.product_name,
        quantity: item.quantity,
        unitPrice: item.unit_price_tyiyn,
      })) : [];
      return {
        id: row.id,
        number: `LEAD-${row.lead_number}`,
        fullName: customer?.full_name || "Клиент",
        phone: customer?.phone || "",
        address: customer?.address || "",
        region: customer?.region || customer?.city || "",
        items,
        total: order?.total_tyiyn || items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
        purchaseMethod: order?.requested_purchase_method === "installment" ? "installment" : "full",
        source: row.source === "website" ? "site" : row.source as Lead["source"],
        managerId: row.assigned_manager_id || "",
        status: mapLeadStatus(row.status),
        comment: row.message || "",
        statusHistory: [],
        reassignmentHistory: [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });
    base.suppliers = staffData.suppliers.map((row) => ({
      id: row.id,
      name: row.name,
      contactPerson: row.contact_person || "",
      phone: row.phone || "",
      address: row.address || "",
      notes: row.notes || "",
      paid: staffData.supplierPayments
        .filter((payment) => payment.supplier_id === row.id)
        .reduce((sum, payment) => sum + payment.amount_tyiyn, 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    base.supplierDebts = staffData.debts.map((row) => ({
      id: row.id,
      supplierId: row.supplier_id,
      orderId: row.order_id,
      amount: Math.max(0, row.amount_tyiyn - row.adjusted_tyiyn),
      paid: row.paid_tyiyn,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    base.supplierPayments = staffData.supplierPayments.map((row) => ({
      id: row.id,
      supplierId: row.supplier_id,
      amount: row.amount_tyiyn,
      comment: row.note || "",
      paidByUserId: row.created_by || "",
      paidAt: row.paid_at,
      createdAt: row.created_at,
      updatedAt: row.created_at,
    }));
    base.managerCommissions = staffData.commissions.map((row) => ({
      id: row.id,
      managerId: row.manager_id,
      orderId: row.order_id,
      amount: Math.max(0, row.amount_tyiyn - row.adjusted_tyiyn),
      status: row.status === "cancelled" ? "cancelled" : row.paid_tyiyn >= row.amount_tyiyn ? "paid" : "accrued",
      createdAt: row.accrued_at,
      updatedAt: row.updated_at,
    }));
    base.managerPayouts = staffData.managerPayouts.map((row) => ({
      id: row.id,
      managerId: row.manager_id,
      amount: row.amount_tyiyn,
      comment: row.note || "",
      paidByUserId: row.created_by || "",
      paidAt: row.paid_at,
      createdAt: row.created_at,
      updatedAt: row.created_at,
    }));
    base.managers = staffData.managerProfiles.flatMap((manager) => {
      const profile = staffData!.profiles.find((item) => item.id === manager.user_id);
      if (!profile || profile.role !== "manager") return [];
      const commissions = base.managerCommissions.filter((item) => item.managerId === manager.user_id);
      const payouts = base.managerPayouts.filter((item) => item.managerId === manager.user_id);
      return [{
        id: manager.user_id,
        userId: manager.user_id,
        name: profile.full_name || "Менеджер",
        phone: profile.phone || "",
        avatar: profile.avatar_url || undefined,
        status: profile.is_active ? "active" : "archived",
        acceptsLeads: manager.accepts_leads,
        leadCount: manager.leads_assigned,
        processedLeadCount: base.leads.filter((lead) => lead.managerId === manager.user_id && lead.status !== "new").length,
        salesCount: base.orders.filter((order) => order.managerId === manager.user_id && ["paid","completed"].includes(order.status)).length,
        earned: commissions.reduce((sum, item) => sum + item.amount, 0),
        paid: payouts.reduce((sum, item) => sum + item.amount, 0),
        createdAt: manager.created_at,
        updatedAt: manager.updated_at,
      }];
    });
    base.expenses = staffData.expenses.map((row) => ({
      id: row.id,
      category: row.category as Expense["category"],
      amount: row.amount_tyiyn,
      date: row.expense_date,
      description: row.description,
      recipient: row.recipient || "",
      paymentMethod: row.payment_method,
      receiptImage: row.receipt_path || undefined,
      authorUserId: row.created_by || "",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    base.returns = staffData.returns.map((row) => ({
      id: row.id,
      number: `RET-${row.return_number}`,
      orderId: row.order_id || "",
      productId: row.product_id,
      customerId: row.customer_id || "",
      supplierId: row.supplier_id || "",
      managerId: row.manager_id || "",
      reason: row.reason,
      type: row.return_type === "defect" ? "defect" : "return",
      quantity: row.quantity,
      condition: row.item_condition || "",
      amount: row.amount_tyiyn,
      photos: row.photo_paths,
      comment: row.comment || "",
      decision: (row.decision as ReturnRecord["decision"]) || "pending",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    base.movements = staffData.movements.map((row, index) => ({
      id: row.id,
      number: `MOV-${index + 1}`,
      productId: row.product_id,
      type: row.movement_type as InventoryMovement["type"],
      quantity: row.quantity_delta,
      quantityBefore: row.balance_after - row.quantity_delta,
      quantityAfter: row.balance_after,
      reason: row.note || "",
      responsibleUserId: row.created_by || "",
      relatedOrderId: row.reference_type === "order" ? row.reference_id || undefined : undefined,
      createdAt: row.created_at,
      updatedAt: row.created_at,
    }));
    base.notifications = staffData.notifications.map((row) => ({
      id: row.id,
      userId: row.target_user_id || "",
      type: ["lead","assignment","status","stock","promotion","sale","return","defect","debt","payout"].includes(row.type)
        ? row.type as AppNotification["type"]
        : "lead",
      title: row.title,
      message: row.message,
      isRead: row.is_read,
      link: row.entity_type && row.entity_id ? `/crm/${session!.role}/${row.entity_type}s` : undefined,
      createdAt: row.created_at,
      updatedAt: row.read_at || row.created_at,
    }));
    base.analytics = staffData.analytics.map((row) => ({
      id: row.id,
      type: row.event_name as AnalyticsEvent["type"],
      sessionId: row.session_id || row.id,
      productId: row.product_id || undefined,
      source: row.source || undefined,
      data: asObject(row.metadata).valueOf() as AnalyticsEvent["data"],
      createdAt: row.occurred_at,
      updatedAt: row.occurred_at,
    }));
    base.aiLogs = staffData.aiLogs.map((row) => ({
      id: row.id,
      rawText: row.raw_text,
      parsedData: asObject(row.parsed_data) as AIImportLog["parsedData"],
      status: ["preview","confirmed","rejected"].includes(row.status) ? row.status as AIImportLog["status"] : "preview",
      authorUserId: row.created_by,
      relatedOrderId: row.created_order_id || undefined,
      createdAt: row.created_at,
      updatedAt: row.created_at,
    }));
    base.auditLogs = staffData.auditLogs.map((row) => ({
      id: String(row.id),
      userId: row.actor_id || "",
      action: row.action,
      entityType: row.table_name,
      entityId: row.record_id || "",
      before: row.old_data,
      after: row.new_data,
      comment: text(asObject(row.metadata).comment),
      createdAt: row.created_at,
      updatedAt: row.created_at,
    }));
    cacheSnapshot(base);
    return base;
  }

  async createPublicLead(input: CreateLeadInput, locale: string): Promise<Lead> {
    const requestId = crypto.randomUUID();
    const payload = {
      request_id: requestId,
      full_name: input.fullName,
      phone: input.phone,
      address: input.address,
      region: input.region,
      items: input.items.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
      })),
      purchase_method: input.purchaseMethod,
      installment_months: input.installment?.months,
      comment: input.comment,
      locale,
      page_path: window.location.hash || "#/",
    };
    const { data, error } = await supabase.functions.invoke("public-shop", {
      body: { action: "lead", payload, website: "" },
    });
    if (error) throw new Error(error.message || "Не удалось отправить заявку");
    if (!data?.ok) throw new Error(data?.error || "Не удалось отправить заявку");
    const result = data.result as {
      lead_id: string;
      lead_number: number;
      total_tyiyn: number;
      assigned_manager_id?: string | null;
    };
    const timestamp = nowIso();
    return {
      id: result.lead_id,
      number: `LEAD-${result.lead_number}`,
      ...input,
      source: input.source || "site",
      total: result.total_tyiyn,
      managerId: result.assigned_manager_id || "",
      status: "new",
      statusHistory: [],
      reassignmentHistory: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  trackPublicEvent(event: {
    eventName: string;
    sessionId: string;
    productId?: string;
    source?: string;
    metadata?: Record<string, string | number | boolean>;
  }) {
    void supabase.functions.invoke("public-shop", {
      body: {
        action: "event",
        website: "",
        payload: {
          event_name: event.eventName,
          session_id: event.sessionId,
          product_id: event.productId,
          source: event.source || "website",
          page_path: window.location.hash || "#/",
          metadata: event.metadata || {},
        },
      },
    });
  }

  async saveProduct(product: Product): Promise<void> {
    let brandId: string | null = null;
    const brandName = product.brand.trim();
    if (brandName) {
      const existing = await supabase.from("brands").select("id").ilike("name", brandName).limit(1).maybeSingle();
      if (existing.error) throw new Error(existing.error.message);
      if (existing.data) brandId = existing.data.id;
      else {
        const slugBase = brandName.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, "-").replace(/^-|-$/g, "");
        const created = await supabase.from("brands").insert({
          name: brandName,
          slug: `${slugBase || "brand"}-${Date.now().toString().slice(-5)}`,
        }).select("id").single();
        brandId = unwrap(created, "Бренд").id;
      }
    }
    const validUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(product.id);
    const payload = {
      ...(validUuid ? { id: product.id } : {}),
      sku: product.sku,
      slug: product.slug,
      name_ru: product.name.ru,
      name_kg: product.name.kg,
      name_en: product.name.en,
      description_ru: product.description.ru,
      description_kg: product.description.kg,
      description_en: product.description.en,
      brand_id: brandId,
      model: product.model,
      category_id: product.categoryId,
      sale_price_tyiyn: product.salePrice,
      old_price_tyiyn: product.oldPrice || null,
      stock_quantity: product.stock,
      reserved_quantity: Math.min(product.reserved, product.stock),
      minimum_stock: product.minimumStock,
      warranty_months: product.warrantyMonths,
      manager_commission_type: product.managerRewardType,
      manager_commission_value: product.managerRewardValue,
      specifications: product.specifications as unknown as Json,
      installment_allowed: product.installmentEligible,
      is_featured: product.isFeatured,
      is_active: product.isVisible && !product.isArchived,
      status: product.isArchived ? "archived" : product.isVisible ? (product.stock > 0 ? "available" : "out_of_stock") : "hidden",
    };
    const saved = validUuid
      ? await supabase.from("products").upsert(payload, { onConflict: "id" }).select("id").single()
      : await supabase.from("products").insert(payload).select("id").single();
    const productId = unwrap(saved, "Товар").id;

    if (product.supplierId) {
      const relation = await supabase.from("supplier_products").upsert({
        supplier_id: product.supplierId,
        product_id: productId,
        purchase_price_tyiyn: product.purchasePrice,
        is_primary: true,
        is_active: true,
      }, { onConflict: "supplier_id,product_id" });
      if (relation.error) throw new Error(relation.error.message);
    }
    const removed = await supabase.from("product_images").delete().eq("product_id", productId);
    if (removed.error) throw new Error(removed.error.message);
    if (product.images.length) {
      const preparedImages = await Promise.all(product.images.slice(0, 5).map(async (image, index) => {
        if (!image.url.startsWith("data:")) {
          return { ...image, storagePath: `external/${productId}/${index + 1}` };
        }
        const blob = await fetch(image.url).then((response) => response.blob());
        const extension = blob.type.split("/")[1]?.replace("jpeg", "jpg") || "webp";
        const storagePath = `${productId}/${crypto.randomUUID()}.${extension}`;
        const uploaded = await supabase.storage.from("product-images").upload(storagePath, blob, {
          contentType: blob.type,
          cacheControl: "31536000",
        });
        if (uploaded.error) throw new Error(uploaded.error.message);
        const { data } = supabase.storage.from("product-images").getPublicUrl(storagePath);
        return { ...image, url: data.publicUrl, storagePath };
      }));
      const inserted = await supabase.from("product_images").insert(
        preparedImages.map((image, index) => ({
          product_id: productId,
          storage_path: image.storagePath,
          public_url: image.url,
          alt_ru: image.alt.ru,
          alt_kg: image.alt.kg,
          alt_en: image.alt.en,
          sort_order: index,
          is_primary: index === 0,
        })),
      );
      if (inserted.error) throw new Error(inserted.error.message);
    }
  }

  async archiveProduct(productId: string, archived: boolean) {
    const result = await supabase.from("products").update({
      status: archived ? "archived" : "available",
      is_active: !archived,
    }).eq("id", productId);
    if (result.error) throw new Error(result.error.message);
  }

  async deleteProduct(productId: string) {
    const result = await supabase.from("products").delete().eq("id", productId);
    if (result.error) throw new Error(result.error.message);
  }

  async adjustStock(productId: string, delta: number, reason: string) {
    const { error } = await supabase.rpc("record_inventory_adjustment", {
      p_product_id: productId,
      p_quantity_delta: delta,
      p_note: reason,
    });
    if (error) throw new Error(error.message);
  }

  async activateManager(userId: string, name: string, phone: string) {
    const { error } = await supabase.rpc("activate_manager", {
      p_user_id: userId,
      p_full_name: name,
      p_phone: phone || undefined,
    });
    if (error) throw new Error(error.message);
  }

  async archiveManager(userId: string) {
    const { error } = await supabase.rpc("archive_manager", {
      p_user_id: userId,
      p_reason: "Удалён управляющим из CRM",
    });
    if (error) throw new Error(error.message);
  }

  async setManagerDistribution(userId: string, acceptsLeads: boolean) {
    const result = await supabase.from("manager_profiles").update({
      accepts_leads: acceptsLeads,
    } satisfies TablesUpdate<"manager_profiles">).eq("user_id", userId);
    if (result.error) throw new Error(result.error.message);
  }

  async addSupplier(input: Pick<Supplier, "name" | "contactPerson" | "phone" | "address" | "notes">) {
    const result = await supabase.from("suppliers").insert({
      name: input.name,
      contact_person: input.contactPerson,
      phone: input.phone,
      address: input.address,
      notes: input.notes,
    });
    if (result.error) throw new Error(result.error.message);
  }

  async archiveSupplier(supplierId: string) {
    const { error } = await supabase.rpc("archive_supplier", {
      p_supplier_id: supplierId,
      p_reason: "Удалён управляющим из CRM",
    });
    if (error) throw new Error(error.message);
  }

  async payoutManager(managerId: string, amount: number, comment: string) {
    const { error } = await supabase.rpc("pay_manager_commissions", {
      p_manager_id: managerId,
      p_amount_tyiyn: amount,
      p_note: comment,
      p_payment_method: "cash",
    });
    if (error) throw new Error(error.message);
  }

  async payoutSupplier(supplierId: string, amount: number, comment: string) {
    const { error } = await supabase.rpc("pay_supplier_debts", {
      p_supplier_id: supplierId,
      p_amount_tyiyn: amount,
      p_note: comment,
      p_payment_method: "cash",
    });
    if (error) throw new Error(error.message);
  }

  async addExpense(expense: Expense) {
    const receiptPath = expense.receiptImage?.startsWith("data:")
      ? await this.uploadDataUrl("documents", expense.receiptImage, "receipts")
      : expense.receiptImage || null;
    const result = await supabase.from("expenses").insert({
      category: expense.category,
      amount_tyiyn: expense.amount,
      expense_date: expense.date,
      description: expense.description,
      recipient: expense.recipient,
      payment_method: expense.paymentMethod,
      receipt_path: receiptPath,
    });
    if (result.error) throw new Error(result.error.message);
  }

  async deleteExpense(expenseId: string) {
    const result = await supabase.from("expenses").delete().eq("id", expenseId);
    if (result.error) throw new Error(result.error.message);
  }

  async addReturn(record: ReturnRecord) {
    const photoPaths = await Promise.all(record.photos.map((photo) =>
      photo.startsWith("data:") ? this.uploadDataUrl("return-photos", photo, "returns") : Promise.resolve(photo),
    ));
    const result = await supabase.from("returns").insert({
      order_id: record.orderId || null,
      product_id: record.productId,
      customer_id: record.customerId || null,
      supplier_id: record.supplierId || null,
      manager_id: record.managerId || null,
      reason: record.reason,
      return_type: record.type,
      quantity: record.quantity,
      item_condition: record.condition,
      amount_tyiyn: record.amount,
      photo_paths: photoPaths,
      comment: record.comment,
      decision: record.decision === "pending" ? null : record.decision,
    });
    if (result.error) throw new Error(result.error.message);
  }

  async resolveReturn(returnId: string, decision: ReturnRecord["decision"]) {
    const { error } = await supabase.rpc("process_return", {
      p_return_id: returnId,
      p_decision: decision,
      p_refund_tyiyn: 0,
    });
    if (error) throw new Error(error.message);
  }

  async saveFaq(faq: FAQ) {
    const validUuid = /^[0-9a-f-]{36}$/i.test(faq.id);
    const result = await supabase.from("faqs").upsert({
      ...(validUuid ? { id: faq.id } : {}),
      question_ru: faq.question.ru,
      question_kg: faq.question.kg,
      question_en: faq.question.en,
      answer_ru: faq.answer.ru,
      answer_kg: faq.answer.kg,
      answer_en: faq.answer.en,
      sort_order: faq.position,
      is_active: faq.status === "published",
    }, { onConflict: "id" });
    if (result.error) throw new Error(result.error.message);
  }

  async deleteFaq(faqId: string) {
    const result = await supabase.from("faqs").delete().eq("id", faqId);
    if (result.error) throw new Error(result.error.message);
  }

  async markNotificationRead(id: string) {
    const { error } = await supabase.rpc("mark_notification_read", { p_notification_id: id });
    if (error) throw new Error(error.message);
  }

  async clearNotifications(userId?: string) {
    let query = supabase.from("notifications").update({ is_read: true, read_at: nowIso() }).eq("is_read", false);
    if (userId) query = query.eq("target_user_id", userId);
    const result = await query;
    if (result.error) throw new Error(result.error.message);
  }

  async saveSettings(settings: AppSettings) {
    const value = {
      minimum_tyiyn: settings.installmentMinimum,
      plans: settings.installmentPlans.map((plan) => ({
        months: plan.months,
        rate_basis_points: plan.rateBasisPoints,
        enabled: plan.enabled,
      })),
      explanation: settings.installmentExplanation,
      ai_auto_save: settings.aiAutoSave,
    };
    const result = await supabase.from("app_settings").upsert({
      key: "installment_config",
      value: value as Json,
      is_public: true,
      description: "Настройки рассрочки и CRM",
    }, { onConflict: "key" });
    if (result.error) throw new Error(result.error.message);
  }

  async addAILog(log: AIImportLog) {
    const result = await supabase.from("ai_import_logs").insert({
      raw_text: log.rawText,
      parsed_data: log.parsedData as Json,
      status: log.status,
      created_by: log.authorUserId,
      created_order_id: log.relatedOrderId || null,
    });
    if (result.error) throw new Error(result.error.message);
  }

  async updateProfile(name: string, phone: string, avatar?: string) {
    const { error } = await supabase.rpc("update_my_profile", {
      p_full_name: name,
      p_phone: phone || undefined,
      p_avatar_url: avatar,
    });
    if (error) throw new Error(error.message);
  }

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const extension = file.name.split(".").pop()?.toLowerCase() || "webp";
    const path = `${userId}/avatar.${extension}`;
    const uploaded = await supabase.storage.from("avatars").upload(path, file, {
      upsert: true,
      cacheControl: "3600",
      contentType: file.type,
    });
    if (uploaded.error) throw new Error(uploaded.error.message);
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return `${data.publicUrl}?v=${Date.now()}`;
  }

  async reassignLead(leadId: string, managerId: string) {
    const lead = unwrap<{ customer_id: string }>(
      await supabase.from("leads").select("customer_id").eq("id", leadId).single(),
      "Заявка",
    );
    if (!lead) throw new Error("Заявка не найдена");
    const updates = await Promise.all([
      supabase.from("leads").update({ assigned_manager_id: managerId }).eq("id", leadId),
      supabase.from("customers").update({ manager_id: managerId }).eq("id", lead.customer_id),
      supabase.from("orders").update({ assigned_manager_id: managerId }).eq("lead_id", leadId),
    ]);
    const failed = updates.find((result) => result.error);
    if (failed?.error) throw new Error(failed.error.message);
  }

  async changeLeadStatus(leadId: string, status: LeadStatus, comment?: string) {
    const leadResult = await supabase.from("leads").update({
      status: toDatabaseLeadStatus(status),
      message: comment || undefined,
    }).eq("id", leadId);
    if (leadResult.error) throw new Error(leadResult.error.message);
    const order = await supabase.from("orders").select("id").eq("lead_id", leadId).maybeSingle();
    if (order.error) throw new Error(order.error.message);
    if (order.data) {
      const { error } = await supabase.rpc("set_order_status", {
        p_order_id: order.data.id,
        p_new_status: toDatabaseOrderStatus(status),
        p_comment: comment,
      });
      if (error) throw new Error(error.message);
    }
  }

  async createStaffSale(input: {
    productId: string;
    managerId: string;
    fullName: string;
    phone: string;
    quantity: number;
    address: string;
    region: string;
    source: "online" | "offline";
    paymentMethod: "cash" | "card" | "transfer" | "installment";
  }): Promise<{ number: string }> {
    const created = await supabase.rpc("create_staff_order", {
      p_customer: { full_name: input.fullName, phone: input.phone },
      p_items: [{ product_id: input.productId, quantity: input.quantity }],
      p_sale_channel: input.source,
      p_source: input.source === "online" ? "website" : "store",
      p_delivery: { address: input.address, region: input.region },
      p_assigned_manager_id: input.managerId || undefined,
    });
    if (created.error) throw new Error(created.error.message);
    const result = created.data as { order_id: string; order_number: number; total_tyiyn: number };
    const confirmed = await supabase.rpc("confirm_order_sale", {
      p_order_id: result.order_id,
      p_payment_method: input.paymentMethod,
      p_received_tyiyn: input.paymentMethod === "installment" ? 0 : result.total_tyiyn,
      p_installment_months: input.paymentMethod === "installment" ? 6 : undefined,
    });
    if (confirmed.error) throw new Error(confirmed.error.message);
    return { number: `ORD-${result.order_number}` };
  }

  subscribe(onChange: () => void) {
    let timer = 0;
    const refresh = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(onChange, 250);
    };
    const channel = supabase
      .channel("tehno-center-crm")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, refresh)
      .subscribe();
    return () => {
      window.clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }
}

export const supabaseGateway = new SupabaseGateway();
export { defaultSettings };
