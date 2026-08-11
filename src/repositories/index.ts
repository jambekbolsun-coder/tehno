import { MemoryRepository } from "@/repositories/MemoryRepository";
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
  ManagerCommission,
  ManagerPayout,
  ManagerProfile,
  Order,
  Payment,
  Product,
  ReturnRecord,
  Supplier,
  SupplierDebt,
  SupplierPayment,
  SupplierProduct,
  User,
} from "@/types/domain";

const repo = <T extends { id: string; createdAt: string; updatedAt: string }>() =>
  new MemoryRepository<T>();

export const repositories = {
  users: repo<User>(),
  managers: repo<ManagerProfile>(),
  customers: repo<Customer>(),
  products: repo<Product>(),
  categories: repo<Category>(),
  brands: repo<Brand>(),
  suppliers: repo<Supplier>(),
  supplierProducts: repo<SupplierProduct>(),
  inventoryMovements: repo<InventoryMovement>(),
  leads: repo<Lead>(),
  orders: repo<Order>(),
  payments: repo<Payment>(),
  commissions: repo<ManagerCommission>(),
  managerPayouts: repo<ManagerPayout>(),
  supplierDebts: repo<SupplierDebt>(),
  supplierPayments: repo<SupplierPayment>(),
  expenses: repo<Expense>(),
  returns: repo<ReturnRecord>(),
  notifications: repo<AppNotification>(),
  faqs: repo<FAQ>(),
  analytics: repo<AnalyticsEvent>(),
  aiImports: repo<AIImportLog>(),
  settings: repo<AppSettings>(),
  auditLogs: repo<AuditLog>(),
};

export function clearRepositories(): void {
  for (const repository of Object.values(repositories)) repository.clear();
}
