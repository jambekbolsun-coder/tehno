export type ID = string;
export type Money = number;
export type Language = "ru" | "kg" | "en";
export type Theme = "light" | "dark";
export type LocalizedText = Record<Language, string>;

export type Role = "admin" | "manager";

export interface Entity {
  id: ID;
  createdAt: string;
  updatedAt: string;
}

export interface User extends Entity {
  name: string;
  phone: string;
  email: string;
  password: string;
  role: Role;
  avatar?: string;
  isActive: boolean;
}

export interface ManagerProfile extends Entity {
  userId: ID;
  name: string;
  phone: string;
  avatar?: string;
  status: "active" | "paused" | "archived";
  acceptsLeads: boolean;
  leadCount: number;
  processedLeadCount: number;
  salesCount: number;
  earned: Money;
  paid: Money;
}

export interface Customer extends Entity {
  fullName: string;
  phone: string;
  address: string;
  region: string;
  managerId?: ID;
  notes: string;
  totalSpent: Money;
  purchaseCount: number;
}

export interface ProductImage {
  id: ID;
  url: string;
  alt: LocalizedText;
  position: number;
}

export interface Category extends Entity {
  slug: string;
  name: LocalizedText;
  icon: string;
  isVisible: boolean;
}

export interface Brand extends Entity {
  name: string;
  slug: string;
}

export type PromotionType =
  | "sale"
  | "discount"
  | "cashback"
  | "giveaway"
  | "hit"
  | "new";

export interface Promotion extends Entity {
  type: PromotionType;
  title: LocalizedText;
  startAt: string;
  endAt?: string;
  discountPercent?: number;
  cashbackPercent?: number;
  specialPrice?: Money;
  isActive: boolean;
}

export interface ProductSpecification {
  id: ID;
  label: LocalizedText;
  value: LocalizedText;
}

export interface Product extends Entity {
  sku: string;
  slug: string;
  name: LocalizedText;
  brand: string;
  model: string;
  categoryId: ID;
  supplierId: ID;
  description: LocalizedText;
  specifications: ProductSpecification[];
  purchasePrice: Money;
  salePrice: Money;
  oldPrice?: Money;
  stock: number;
  reserved: number;
  minimumStock: number;
  warrantyMonths: number;
  managerRewardType: "percent" | "fixed";
  managerRewardValue: number;
  images: ProductImage[];
  promotion?: Promotion;
  isFeatured: boolean;
  isPopular: boolean;
  isVisible: boolean;
  isArchived: boolean;
  installmentEligible: boolean;
  rating?: number;
  views: number;
  source: "supplier" | "store";
  arrivalDate: string;
}

export interface Supplier extends Entity {
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  notes: string;
  paid: Money;
}

export interface SupplierProduct extends Entity {
  supplierId: ID;
  productId: ID;
  receivedQuantity: number;
  soldQuantity: number;
  returnedQuantity: number;
  purchasePrice: Money;
}

export interface SupplierDeliveryItem extends Entity {
  deliveryId: ID;
  supplierId: ID;
  productId?: ID;
  productName: string;
  brand: string;
  model: string;
  supplierSku?: string;
  quantity: number;
  purchasePrice: Money;
}

export interface SupplierDelivery extends Entity {
  number: string;
  supplierId: ID;
  deliveredAt: string;
  totalQuantity: number;
  notes: string;
  status: "received" | "cancelled";
  items: SupplierDeliveryItem[];
}

export interface SupplierDeliveryLineInput {
  productName: string;
  brand: string;
  model: string;
  supplierSku?: string;
  quantity: number;
  purchasePrice: Money;
}

export type InventoryMovementType =
  | "receipt"
  | "sale"
  | "reserve"
  | "unreserve"
  | "return"
  | "defect"
  | "supplier_return"
  | "adjustment";

export interface InventoryMovement extends Entity {
  number: string;
  productId: ID;
  type: InventoryMovementType;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  reason: string;
  responsibleUserId: ID;
  relatedOrderId?: ID;
}

export type PurchaseMethod = "full" | "installment";
export type LeadStatus =
  | "new"
  | "working"
  | "consulted"
  | "confirmed"
  | "courier_ordered"
  | "packed"
  | "courier_picked_up"
  | "courier_in_transit"
  | "handed_to_courier"
  | "received"
  | "paid"
  | "installment"
  | "completed"
  | "refused"
  | "cancelled";

export interface LeadItem {
  productId: ID;
  productName: string;
  quantity: number;
  unitPrice: Money;
}

export interface InstallmentSelection {
  months: number;
  rateBasisPoints: number;
  overpayment: Money;
  total: Money;
  monthlyPayment: Money;
}

export interface Lead extends Entity {
  number: string;
  fullName: string;
  phone: string;
  address: string;
  region: string;
  items: LeadItem[];
  total: Money;
  purchaseMethod: PurchaseMethod;
  installment?: InstallmentSelection;
  source: "site" | "store" | "whatsapp" | "instagram" | "manual";
  managerId: ID;
  status: LeadStatus;
  comment: string;
  statusHistory: OrderStatusHistory[];
  reassignmentHistory: ReassignmentHistory[];
}

export interface ReassignmentHistory {
  id: ID;
  fromManagerId?: ID;
  toManagerId: ID;
  changedByUserId: ID;
  changedAt: string;
  comment: string;
}

export interface OrderItem {
  id: ID;
  productId: ID;
  name: string;
  quantity: number;
  unitPrice: Money;
  purchasePrice: Money;
  total: Money;
}

export interface Order extends Entity {
  number: string;
  leadId?: ID;
  customerId: ID;
  managerId: ID;
  items: OrderItem[];
  subtotal: Money;
  discount: Money;
  total: Money;
  paid: Money;
  purchaseMethod: PurchaseMethod;
  installment?: InstallmentSelection;
  source: "online" | "offline";
  status: LeadStatus;
  financialProcessed?: boolean;
  inventoryReserved?: boolean;
  inventoryProcessed?: boolean;
  inventoryReturned?: boolean;
  courierAdvance?: Money;
  courierAdvanceStatus?: "not_received" | "pending" | "settled" | "refunded";
}

export interface OrderStatusHistory {
  id: ID;
  fromStatus?: LeadStatus;
  toStatus: LeadStatus;
  changedAt: string;
  changedByUserId: ID;
  comment: string;
}

export interface Payment extends Entity {
  orderId: ID;
  amount: Money;
  method: "cash" | "card" | "transfer" | "installment";
  status: "pending" | "paid" | "refunded";
  paidAt?: string;
}

export interface InstallmentPlan extends Entity {
  months: number;
  rateBasisPoints: number;
  enabled: boolean;
}

export interface ManagerCommission extends Entity {
  managerId: ID;
  orderId: ID;
  amount: Money;
  status: "accrued" | "paid" | "cancelled";
}

export interface ManagerPayout extends Entity {
  managerId: ID;
  amount: Money;
  comment: string;
  paidByUserId: ID;
  paidAt: string;
}

export interface SupplierDebt extends Entity {
  supplierId: ID;
  orderId: ID;
  amount: Money;
  paid: Money;
}

export interface SupplierPayment extends Entity {
  supplierId: ID;
  amount: Money;
  comment: string;
  paidByUserId: ID;
  paidAt: string;
}

export type ExpenseCategory =
  | "rent"
  | "target"
  | "advertising"
  | "delivery"
  | "salary"
  | "household"
  | "small"
  | "equipment"
  | "repair"
  | "tax"
  | "other";

export interface Expense extends Entity {
  category: ExpenseCategory;
  amount: Money;
  date: string;
  description: string;
  recipient: string;
  paymentMethod: string;
  receiptImage?: string;
  authorUserId: ID;
}

export interface ReturnRecord extends Entity {
  number: string;
  orderId: ID;
  productId: ID;
  customerId: ID;
  supplierId: ID;
  managerId: ID;
  reason: string;
  type: "return" | "defect";
  quantity: number;
  condition: string;
  amount: Money;
  photos: string[];
  comment: string;
  decision: "restock" | "defect" | "supplier_return" | "pending";
}

export type Defect = ReturnRecord;

export interface AppNotification extends Entity {
  userId: ID;
  type:
    | "lead"
    | "assignment"
    | "status"
    | "stock"
    | "promotion"
    | "sale"
    | "return"
    | "defect"
    | "debt"
    | "payout";
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
}

export interface FAQ extends Entity {
  question: LocalizedText;
  answer: LocalizedText;
  position: number;
  status: "draft" | "published" | "hidden";
}

export type AnalyticsEventType =
  | "site_visit"
  | "page_view"
  | "product_view"
  | "search"
  | "filter"
  | "favorite_add"
  | "cart_add"
  | "checkout_start"
  | "lead_submit"
  | "whatsapp_click"
  | "sale";

export interface AnalyticsEvent extends Entity {
  type: AnalyticsEventType;
  sessionId: string;
  userId?: ID;
  productId?: ID;
  source?: string;
  data: Record<string, string | number | boolean>;
}

export interface AIImportLog extends Entity {
  rawText: string;
  parsedData: Record<string, string | number | undefined>;
  status: "preview" | "confirmed" | "rejected";
  authorUserId: ID;
  relatedOrderId?: ID;
}

export interface AppSettings extends Entity {
  storeName: string;
  address: string;
  whatsappPhone: string;
  language: Language;
  theme: Theme;
  installmentPlans: InstallmentPlan[];
  installmentExplanation: LocalizedText;
  installmentMinimum: Money;
  roundRobinCursor: number;
  aiAutoSave: boolean;
}

export interface AuditLog extends Entity {
  userId: ID;
  action: string;
  entityType: string;
  entityId: ID;
  before?: unknown;
  after?: unknown;
  comment?: string;
}

export interface CartItem {
  productId: ID;
  quantity: number;
}

export interface SessionUser {
  id: ID;
  name: string;
  phone: string;
  email: string;
  role: Role;
  avatar?: string;
  managerProfileId?: ID;
}

export interface AIParsedOrder {
  orderNumber?: string;
  productName?: string;
  address?: string;
  fullName?: string;
  phone?: string;
  managerName?: string;
  amount?: Money;
  paymentType?: string;
  source?: string;
  dateTime?: string;
  missingFields: string[];
  confidence: number;
}

export interface FinancialSummary {
  revenue: Money;
  cashReceived: Money;
  onlineRevenue: Money;
  offlineRevenue: Money;
  costOfGoods: Money;
  supplierDebt: Money;
  managerCommissions: Money;
  managerDebt: Money;
  expenses: Money;
  returns: Money;
  accrualProfit: Money;
  cashFlow: Money;
}
