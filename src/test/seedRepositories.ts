import { clearRepositories, repositories } from "@/repositories";
import {
  mockAIImportLogs,
  mockAnalytics,
  mockAuditLogs,
  mockCustomers,
  mockExpenses,
  mockFaqs,
  mockInventoryMovements,
  mockLeads,
  mockManagerCommissions,
  mockManagerPayouts,
  mockManagers,
  mockNotifications,
  mockOrders,
  mockPayments,
  mockReturns,
  mockSettings,
  mockSupplierDebts,
  mockSupplierPayments,
  mockSupplierProducts,
  mockSuppliers,
  mockUsers,
} from "@/mock-data/crm";
import { mockBrands, mockCategories, mockProducts } from "@/mock-data/products";

export function resetTestRepositories(): void {
  clearRepositories();
  repositories.users.replaceAll(mockUsers);
  repositories.managers.replaceAll(mockManagers);
  repositories.customers.replaceAll(mockCustomers);
  repositories.products.replaceAll(mockProducts);
  repositories.categories.replaceAll(mockCategories);
  repositories.brands.replaceAll(mockBrands);
  repositories.suppliers.replaceAll(mockSuppliers);
  repositories.supplierProducts.replaceAll(mockSupplierProducts);
  repositories.inventoryMovements.replaceAll(mockInventoryMovements);
  repositories.leads.replaceAll(mockLeads);
  repositories.orders.replaceAll(mockOrders);
  repositories.payments.replaceAll(mockPayments);
  repositories.commissions.replaceAll(mockManagerCommissions);
  repositories.managerPayouts.replaceAll(mockManagerPayouts);
  repositories.supplierDebts.replaceAll(mockSupplierDebts);
  repositories.supplierPayments.replaceAll(mockSupplierPayments);
  repositories.expenses.replaceAll(mockExpenses);
  repositories.returns.replaceAll(mockReturns);
  repositories.notifications.replaceAll(mockNotifications);
  repositories.faqs.replaceAll(mockFaqs);
  repositories.analytics.replaceAll(mockAnalytics);
  repositories.aiImports.replaceAll(mockAIImportLogs);
  repositories.settings.replaceAll([mockSettings]);
  repositories.auditLogs.replaceAll(mockAuditLogs);
}
