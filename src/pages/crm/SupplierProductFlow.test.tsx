import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CatalogSection } from "@/pages/crm/CatalogSections";
import { SuppliersSection } from "@/pages/crm/PeopleSections";
import { defaultSettings } from "@/repositories/SupabaseGateway";
import { useAppStore } from "@/stores/useAppStore";
import type { Category, Product, Supplier, SupplierDelivery } from "@/types/domain";

const now = "2026-08-13T00:00:00.000Z";
const supplier: Supplier = {
  id: "supplier-test",
  name: "Test Supply",
  contactPerson: "Бакыт",
  phone: "+996 700 000 000",
  address: "Бишкек",
  notes: "",
  paid: 0,
  isActive: true,
  createdAt: now,
  updatedAt: now,
};
const category: Category = {
  id: "category-test",
  slug: "home",
  name: { ru: "Бытовая техника", kg: "Техника", en: "Appliances" },
  icon: "package",
  isVisible: true,
  createdAt: now,
  updatedAt: now,
};
const delivery: SupplierDelivery = {
  id: "delivery-test",
  number: "SUP-1",
  supplierId: supplier.id,
  deliveredAt: "2026-08-13",
  totalQuantity: 7,
  notes: "",
  status: "received",
  items: [{
    id: "delivery-item-test",
    deliveryId: "delivery-test",
    supplierId: supplier.id,
    productName: "Робот-пылесос",
    brand: "Xiaomi",
    model: "S10",
    quantity: 7,
    purchasePrice: 2_000_000,
    createdAt: now,
    updatedAt: now,
  }],
  createdAt: now,
  updatedAt: now,
};
const secondSupplier: Supplier = {
  ...supplier,
  id: "supplier-mega",
  name: "Mega Import",
  contactPerson: "Айбек",
  phone: "+996 555 111 222",
};
const secondDelivery: SupplierDelivery = {
  ...delivery,
  id: "delivery-mega",
  number: "SUP-2",
  supplierId: secondSupplier.id,
  totalQuantity: 3,
  items: [{
    ...delivery.items[0],
    id: "delivery-item-mega",
    deliveryId: "delivery-mega",
    supplierId: secondSupplier.id,
    productName: "Стиральная машина",
    brand: "LG",
    model: "F2J3",
    quantity: 3,
    purchasePrice: 3_400_000,
  }],
};
const product: Product = {
  id: "product-test",
  sku: "TC2-TEST",
  slug: "xiaomi-s10",
  name: { ru: "Робот-пылесос", kg: "Робот-пылесос", en: "Robot vacuum" },
  brand: "Xiaomi",
  model: "S10",
  categoryId: category.id,
  supplierId: supplier.id,
  description: { ru: "", kg: "", en: "" },
  specifications: [],
  purchasePrice: 2_000_000,
  salePrice: 3_000_000,
  stock: 7,
  reserved: 0,
  minimumStock: 1,
  warrantyMonths: 12,
  managerRewardType: "percent",
  managerRewardValue: 500,
  images: [],
  isFeatured: false,
  isPopular: false,
  isVisible: true,
  isArchived: false,
  installmentEligible: true,
  views: 0,
  source: "supplier",
  arrivalDate: now,
  createdAt: now,
  updatedAt: now,
};

describe("supplier → delivery → product UI flow", () => {
  beforeEach(() => {
    useAppStore.setState({
      suppliers: [],
      supplierDeliveries: [],
      products: [],
      categories: [category],
      supplierDebts: [],
      supplierPayments: [],
      settings: defaultSettings(),
    });
  });

  it("создаёт поставщика сразу с несколькими моделями", async () => {
    const user = userEvent.setup();
    const addSupplier = vi.fn().mockResolvedValue(undefined);
    useAppStore.setState({ addSupplier });
    render(<SuppliersSection />);

    await user.click(screen.getByRole("button", { name: "Добавить поставщика" }));
    await user.type(screen.getByLabelText("Название *"), "Asia Test");
    await user.type(screen.getByLabelText("Контактное лицо *"), "Азамат");
    await user.clear(screen.getByLabelText("Телефон *"));
    await user.type(screen.getByLabelText("Телефон *"), "+996700123123");
    await user.type(screen.getByLabelText("Адрес *"), "Бишкек");
    await user.click(screen.getByRole("button", { name: "Добавить модель" }));

    const names = screen.getAllByLabelText("Какой товар *");
    const brands = screen.getAllByLabelText("Бренд *");
    const models = screen.getAllByLabelText("Модель *");
    const quantities = screen.getAllByLabelText("Количество *");
    const prices = screen.getAllByLabelText("Закупка за 1 шт., сом *");
    await user.type(names[0], "Холодильник");
    await user.type(brands[0], "Samsung");
    await user.type(models[0], "RB-1");
    await user.clear(quantities[0]);
    await user.type(quantities[0], "4");
    await user.type(prices[0], "50000");
    await user.type(names[1], "Микроволновка");
    await user.type(brands[1], "Samsung");
    await user.type(models[1], "MW-2");
    await user.clear(quantities[1]);
    await user.type(quantities[1], "3");
    await user.type(prices[1], "12000");
    await user.click(screen.getByRole("button", { name: "Сохранить поставщика и поставку" }));

    await waitFor(() => expect(addSupplier).toHaveBeenCalledTimes(1));
    expect(addSupplier.mock.calls[0][1]).toEqual(expect.arrayContaining([
      expect.objectContaining({ productName: "Холодильник", model: "RB-1", quantity: 4, purchasePrice: 5_000_000 }),
      expect.objectContaining({ productName: "Микроволновка", model: "MW-2", quantity: 3, purchasePrice: 1_200_000 }),
    ]));
  });

  it("создаёт карточку из поставки и сохраняет комиссию с одной характеристикой", async () => {
    const user = userEvent.setup();
    const saveProduct = vi.fn().mockResolvedValue(undefined);
    useAppStore.setState({
      suppliers: [supplier],
      supplierDeliveries: [delivery],
      saveProduct,
    });
    render(<CatalogSection role="admin" />);

    await user.click(screen.getByRole("button", { name: "Добавить товар" }));
    expect(screen.getByLabelText("Поставщик *")).toHaveValue(supplier.id);
    expect(screen.getByLabelText("Модель из поставки *")).toHaveValue("delivery-item-test");
    expect(screen.getByLabelText("Количество по поставке")).toHaveValue("7");
    expect(screen.getByLabelText("Закупочная цена, сом")).toHaveValue("20000");
    await user.type(screen.getByLabelText("Цена продажи, сом *"), "35000");
    await user.clear(screen.getByLabelText("Процент менеджера, % *"));
    await user.type(screen.getByLabelText("Процент менеджера, % *"), "7.5");
    await user.type(screen.getByLabelText("Характеристика"), "Мощность: 2000 Вт\nОбъём: 4 л");
    await user.click(screen.getByRole("button", { name: "Сохранить товар" }));

    await waitFor(() => expect(saveProduct).toHaveBeenCalledTimes(1));
    expect(saveProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        supplierId: supplier.id,
        model: "S10",
        stock: 7,
        purchasePrice: 2_000_000,
        salePrice: 3_500_000,
        managerRewardType: "percent",
        managerRewardValue: 750,
        description: {
          ru: "Мощность: 2000 Вт\nОбъём: 4 л",
          kg: "Мощность: 2000 Вт\nОбъём: 4 л",
          en: "Мощность: 2000 Вт\nОбъём: 4 л",
        },
        specifications: [],
      }),
      "delivery-item-test",
    );
  });

  it("ищет поставщика и модель по части названия", async () => {
    const user = userEvent.setup();
    useAppStore.setState({
      suppliers: [supplier, secondSupplier],
      supplierDeliveries: [delivery, secondDelivery],
    });
    render(<CatalogSection role="admin" />);

    await user.click(screen.getByRole("button", { name: "Добавить товар" }));
    await user.type(screen.getByLabelText("Поиск поставщика"), "mega");
    const supplierSelect = screen.getByLabelText("Поставщик *");
    expect(within(supplierSelect).getByRole("option", { name: "Mega Import" })).toBeInTheDocument();
    await user.selectOptions(supplierSelect, secondSupplier.id);

    await user.type(screen.getByLabelText("Поиск товара или модели"), "f2j");
    const modelSelect = screen.getByLabelText("Модель из поставки *");
    expect(within(modelSelect).getByRole("option", { name: /Стиральная машина · LG F2J3/ })).toBeInTheDocument();
    expect(screen.getByLabelText("Модель *")).toHaveValue("F2J3");
    expect(screen.getByLabelText("Количество по поставке")).toHaveValue("3");
  });

  it("удаляет поставщика из рабочего списка, сохраняя архив вне интерфейса", async () => {
    const user = userEvent.setup();
    const deleteSupplier = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    useAppStore.setState({
      suppliers: [supplier, { ...supplier, id: "supplier-archived", name: "Archived Supply", isActive: false }],
      deleteSupplier,
    });
    render(<SuppliersSection />);

    expect(screen.queryByText("Archived Supply")).not.toBeInTheDocument();
    const deliveryButton = screen.getByRole("button", { name: "Новая поставка" });
    expect(deliveryButton).toHaveClass("supplier-card__delivery-button");
    await user.click(screen.getByRole("button", { name: `Удалить поставщика ${supplier.name}` }));

    expect(deleteSupplier).toHaveBeenCalledWith(supplier.id);
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining("финансовая история сохранятся"));
  });

  it("не разрешает создать новый товар из поставки удалённого поставщика", () => {
    useAppStore.setState({
      suppliers: [{ ...supplier, isActive: false }],
      supplierDeliveries: [delivery],
    });
    render(<CatalogSection role="admin" />);

    expect(screen.getByRole("button", { name: "Добавить товар" })).toBeDisabled();
    expect(screen.getByText(/Ожидают добавления: 0 моделей/)).toBeInTheDocument();
  });

  it("удаляет карточку через безопасное удаление", async () => {
    const user = userEvent.setup();
    const deleteProduct = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    useAppStore.setState({
      suppliers: [supplier],
      supplierDeliveries: [],
      products: [product],
      deleteProduct,
    });
    render(<CatalogSection role="admin" />);

    await user.click(screen.getByTitle("Удалить с сайта"));
    expect(deleteProduct).toHaveBeenCalledWith(product.id);
  });
});
