import { create } from "zustand";
import { preferenceService } from "@/services/PreferenceService";
import {
  defaultSettings,
  supabaseGateway,
  type SupabaseSnapshot,
} from "@/repositories/SupabaseGateway";
import type { CreateLeadInput } from "@/services/LeadService";
import type {
  AIImportLog,
  AppSettings,
  CartItem,
  Expense,
  FAQ,
  Language,
  Lead,
  Product,
  ReturnRecord,
  SessionUser,
  Supplier,
  SupplierDeliveryLineInput,
  Theme,
} from "@/types/domain";
import { createId } from "@/utils/id";
import { translations } from "@/translations";

type ToastKind = "success" | "error" | "info";
export interface ToastState {
  id: string;
  kind: ToastKind;
  message: string;
}

interface ManagerActivationInput {
  email: string;
  name: string;
  phone: string;
}

interface StaffSaleInput {
  productId: string;
  managerId: string;
  fullName: string;
  phone: string;
  quantity: number;
  address: string;
  region: string;
  source: "online" | "offline";
  paymentMethod: "cash" | "card" | "transfer" | "installment";
  installmentMonths?: number;
}

interface AppState extends SupabaseSnapshot {
  language: Language;
  theme: Theme;
  session: SessionUser | null;
  cart: CartItem[];
  favorites: string[];
  recentProductIds: string[];
  ready: boolean;
  loading: boolean;
  backendError?: string;
  toast?: ToastState;
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  setLanguage: (language: Language) => void;
  toggleTheme: () => void;
  login: (email: string, password: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  toggleFavorite: (productId: string) => void;
  clearFavorites: () => void;
  addRecent: (productId: string) => void;
  createLead: (input: CreateLeadInput) => Promise<Lead>;
  reassignLead: (leadId: string, managerId: string) => Promise<void>;
  changeLeadStatus: (leadId: string, status: Lead["status"], comment?: string) => Promise<void>;
  saveProduct: (product: Product, deliveryItemId?: string) => Promise<void>;
  archiveProduct: (productId: string) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  adjustStock: (productId: string, delta: number, reason: string) => Promise<void>;
  addManager: (input: ManagerActivationInput) => Promise<void>;
  deleteManager: (managerId: string) => Promise<void>;
  addSupplier: (
    input: Pick<Supplier, "name" | "contactPerson" | "phone" | "address" | "notes">,
    items: SupplierDeliveryLineInput[],
  ) => Promise<void>;
  addSupplierDelivery: (
    supplierId: string,
    items: SupplierDeliveryLineInput[],
    notes: string,
  ) => Promise<void>;
  deleteSupplier: (supplierId: string) => Promise<void>;
  toggleManagerDistribution: (managerId: string) => Promise<void>;
  payoutManager: (managerId: string, amount: number, comment: string) => Promise<void>;
  payoutSupplier: (supplierId: string, amount: number, comment: string) => Promise<void>;
  addExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  addReturn: (record: ReturnRecord) => Promise<void>;
  resolveReturn: (returnId: string, decision: ReturnRecord["decision"]) => Promise<void>;
  addFaq: (faq: FAQ) => Promise<void>;
  updateFaq: (faqId: string, changes: Partial<FAQ>) => Promise<void>;
  deleteFaq: (faqId: string) => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  clearNotifications: (userId?: string) => Promise<void>;
  saveSettings: (changes: Partial<AppSettings>) => Promise<void>;
  addAILog: (log: AIImportLog) => Promise<void>;
  updateProfile: (name: string, phone: string) => Promise<void>;
  updateProfileAvatar: (file: File) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  completeInvite: (password: string, name: string, phone: string) => Promise<SessionUser>;
  createSale: (input: StaffSaleInput) => Promise<{ number: string }>;
  showToast: (message: string, kind?: ToastKind) => void;
  clearToast: () => void;
}

let stopRealtime: (() => void) | undefined;

const settings = defaultSettings();
const emptyData: SupabaseSnapshot = {
  products: [], categories: [], brands: [], leads: [], orders: [], managers: [],
  customers: [], suppliers: [], supplierDeliveries: [], supplierDebts: [], supplierPayments: [],
  managerCommissions: [], managerPayouts: [], expenses: [], returns: [],
  movements: [], notifications: [], faqs: [], analytics: [], aiLogs: [],
  auditLogs: [], settings,
};

export const useAppStore = create<AppState>((set, get) => {
  const toast = (message: string, kind: ToastKind = "success") =>
    set({ toast: { id: createId("toast"), kind, message } });

  const refresh = async () => {
    const data = await supabaseGateway.load(get().session);
    set({ ...data, backendError: undefined });
  };

  const mutate = async (
    action: () => Promise<unknown>,
    success?: string,
    rethrow = false,
  ) => {
    set({ loading: true });
    try {
      await action();
      await refresh();
      if (success) toast(success);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Не удалось выполнить операцию", "error");
      if (rethrow) throw error;
    } finally {
      set({ loading: false });
    }
  };

  return {
    ...emptyData,
    language: preferenceService.getLanguage(),
    theme: preferenceService.getTheme(),
    session: null,
    cart: preferenceService.getCart(),
    favorites: preferenceService.getFavorites(),
    recentProductIds: preferenceService.getRecent(),
    ready: false,
    loading: false,

    initialize: async () => {
      if (get().ready) return;
      set({ loading: true, backendError: undefined });
      let session: SessionUser | null = null;
      let sessionError: string | undefined;
      try {
        session = await supabaseGateway.getSessionUser();
      } catch (error) {
        sessionError = error instanceof Error ? error.message : "Не удалось проверить сессию";
      }
      try {
        const data = await supabaseGateway.load(session);
        set({ ...data, session, ready: true, loading: false, backendError: sessionError });
        stopRealtime?.();
        stopRealtime = session ? supabaseGateway.subscribe(() => void get().refresh()) : undefined;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Supabase недоступен";
        set({ ready: true, loading: false, backendError: message });
        toast(message, "error");
      }
    },

    refresh,

    setLanguage: (language) => {
      preferenceService.setLanguage(language);
      set({ language });
    },

    toggleTheme: () => {
      const theme: Theme = get().theme === "light" ? "dark" : "light";
      preferenceService.setTheme(theme);
      set({ theme });
    },

    login: async (email, password) => {
      set({ loading: true, backendError: undefined });
      try {
        const session = await supabaseGateway.login(email, password);
        const data = await supabaseGateway.load(session);
        set({ ...data, session });
        stopRealtime?.();
        stopRealtime = supabaseGateway.subscribe(() => void get().refresh());
        return session;
      } finally {
        set({ loading: false });
      }
    },

    logout: async () => {
      set({ loading: true });
      try {
        await supabaseGateway.logout();
        stopRealtime?.();
        stopRealtime = undefined;
        const data = await supabaseGateway.load(null);
        set({ ...data, session: null });
      } catch (error) {
        toast(error instanceof Error ? error.message : "Не удалось выйти", "error");
      } finally {
        set({ loading: false });
      }
    },

    addToCart: (productId, quantity = 1) => {
      const messages = translations[get().language];
      const product = get().products.find((item) => item.id === productId);
      if (!product) throw new Error(messages.productNotFound);
      const available = product.stock - product.reserved;
      const current = get().cart;
      const item = current.find((entry) => entry.productId === productId);
      const nextQuantity = (item?.quantity ?? 0) + quantity;
      if (available <= 0 || nextQuantity > available)
        throw new Error(`${messages.availableOnly}: ${Math.max(0, available)} ${messages.units}`);
      const cart = item
        ? current.map((entry) => entry.productId === productId ? { ...entry, quantity: nextQuantity } : entry)
        : [...current, { productId, quantity }];
      preferenceService.setCart(cart);
      set({ cart });
      toast(messages.cartAdded);
    },

    updateCartQuantity: (productId, quantity) => {
      if (quantity <= 0) return get().removeFromCart(productId);
      const product = get().products.find((item) => item.id === productId);
      if (!product) return;
      const available = product.stock - product.reserved;
      if (quantity > available) {
        const messages = translations[get().language];
        return toast(`${messages.availableOnly}: ${available} ${messages.units}`, "error");
      }
      const cart = get().cart.map((item) => item.productId === productId ? { ...item, quantity } : item);
      preferenceService.setCart(cart);
      set({ cart });
    },

    removeFromCart: (productId) => {
      const cart = get().cart.filter((item) => item.productId !== productId);
      preferenceService.setCart(cart);
      set({ cart });
    },
    clearCart: () => { preferenceService.setCart([]); set({ cart: [] }); },
    toggleFavorite: (productId) => {
      const messages = translations[get().language];
      const current = get().favorites;
      const removing = current.includes(productId);
      const favorites = removing ? current.filter((id) => id !== productId) : [...current, productId];
      preferenceService.setFavorites(favorites);
      set({ favorites });
      toast(removing ? messages.favoriteRemoved : messages.favoriteAdded);
    },
    clearFavorites: () => { preferenceService.setFavorites([]); set({ favorites: [] }); },
    addRecent: (productId) => {
      const recentProductIds = [productId, ...get().recentProductIds.filter((id) => id !== productId)].slice(0, 8);
      preferenceService.setRecent(recentProductIds);
      set({ recentProductIds });
    },

    createLead: async (input) => {
      return supabaseGateway.createPublicLead(input, get().language);
    },
    reassignLead: (leadId, managerId) => mutate(() => supabaseGateway.reassignLead(leadId, managerId), "Заявка переназначена"),
    changeLeadStatus: (leadId, status, comment) => mutate(() => supabaseGateway.changeLeadStatus(leadId, status, comment)),
    saveProduct: async (product, deliveryItemId) => {
      if (product.images.length > 5) return toast("Можно добавить максимум пять фотографий", "error");
      await mutate(
        () => supabaseGateway.saveProduct(product, deliveryItemId),
        "Товар сохранён",
        true,
      );
    },
    archiveProduct: (productId) => {
      const product = get().products.find((item) => item.id === productId);
      return mutate(() => supabaseGateway.archiveProduct(productId, !product?.isArchived));
    },
    deleteProduct: (productId) => mutate(() => supabaseGateway.deleteProduct(productId), "Товар удалён"),
    adjustStock: (productId, delta, reason) => mutate(() => supabaseGateway.adjustStock(productId, delta, reason), "Остаток обновлён"),
    addManager: (input) => mutate(
      () => supabaseGateway.inviteManager(input.email, input.name, input.phone),
      "Приглашение отправлено на email",
    ),
    deleteManager: (managerId) => mutate(() => supabaseGateway.archiveManager(managerId), "Менеджер отключён"),
    addSupplier: (input, items) => mutate(
      () => supabaseGateway.addSupplier(input, items),
      "Поставщик и первая поставка добавлены",
      true,
    ),
    addSupplierDelivery: (supplierId, items, notes) => mutate(
      () => supabaseGateway.addSupplierDelivery(supplierId, items, notes),
      "Поставка добавлена",
      true,
    ),
    deleteSupplier: (supplierId) => mutate(
      () => supabaseGateway.archiveSupplier(supplierId),
      "Поставщик удалён",
      true,
    ),
    toggleManagerDistribution: (managerId) => {
      const manager = get().managers.find((item) => item.id === managerId);
      return mutate(() => supabaseGateway.setManagerDistribution(managerId, !manager?.acceptsLeads));
    },
    payoutManager: (managerId, amount, comment) => mutate(() => supabaseGateway.payoutManager(managerId, amount, comment), "Выплата менеджеру сохранена"),
    payoutSupplier: (supplierId, amount, comment) => mutate(() => supabaseGateway.payoutSupplier(supplierId, amount, comment), "Выплата поставщику сохранена"),
    addExpense: (expense) => mutate(() => supabaseGateway.addExpense(expense), "Расход сохранён"),
    deleteExpense: (expenseId) => mutate(() => supabaseGateway.deleteExpense(expenseId), "Расход удалён"),
    addReturn: (record) => mutate(() => supabaseGateway.addReturn(record), "Операция сохранена"),
    resolveReturn: (returnId, decision) => mutate(() => supabaseGateway.resolveReturn(returnId, decision), "Решение сохранено"),
    addFaq: (faq) => mutate(() => supabaseGateway.saveFaq(faq), "FAQ сохранён"),
    updateFaq: async (faqId, changes) => {
      const faq = get().faqs.find((item) => item.id === faqId);
      if (!faq) return toast("FAQ не найден", "error");
      await mutate(() => supabaseGateway.saveFaq({ ...faq, ...changes }), "FAQ обновлён");
    },
    deleteFaq: (faqId) => mutate(() => supabaseGateway.deleteFaq(faqId), "FAQ удалён"),
    markNotificationRead: (notificationId) => mutate(() => supabaseGateway.markNotificationRead(notificationId)),
    clearNotifications: (userId) => mutate(() => supabaseGateway.clearNotifications(userId)),
    saveSettings: (changes) => {
      const nextSettings = { ...get().settings, ...changes };
      return mutate(() => supabaseGateway.saveSettings(nextSettings), "Настройки сохранены");
    },
    addAILog: (log) => mutate(() => supabaseGateway.addAILog(log)),
    updateProfile: async (name, phone) => {
      const session = get().session;
      if (!session) return;
      await mutate(async () => {
        await supabaseGateway.updateProfile(name, phone, session.avatar);
        set({ session: { ...session, name, phone } });
      }, "Профиль обновлён");
    },
    updateProfileAvatar: async (file) => {
      const session = get().session;
      if (!session) return;
      await mutate(async () => {
        const avatar = await supabaseGateway.uploadAvatar(session.id, file);
        await supabaseGateway.updateProfile(session.name, session.phone, avatar);
        set({ session: { ...session, avatar } });
      }, "Фотография профиля обновлена");
    },
    changePassword: async (currentPassword, newPassword) => {
      set({ loading: true });
      try {
        await supabaseGateway.changePassword(currentPassword, newPassword);
        toast("Пароль успешно изменён");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Не удалось изменить пароль";
        toast(message, "error");
        throw error;
      } finally {
        set({ loading: false });
      }
    },
    completeInvite: async (password, name, phone) => {
      set({ loading: true });
      try {
        const session = await supabaseGateway.completeInvite(password, name, phone);
        const data = await supabaseGateway.load(session);
        set({ ...data, session });
        stopRealtime?.();
        stopRealtime = supabaseGateway.subscribe(() => void get().refresh());
        return session;
      } finally {
        set({ loading: false });
      }
    },
    createSale: async (input) => {
      set({ loading: true });
      try {
        const order = await supabaseGateway.createStaffSale(input);
        await refresh();
        return order;
      } finally {
        set({ loading: false });
      }
    },
    showToast: toast,
    clearToast: () => set({ toast: undefined }),
  };
});
