import { Archive, Boxes, CircleDollarSign, Edit3, Eye, EyeOff, Filter, ImagePlus, MinusCircle, PackageCheck, PackagePlus, Plus, RotateCcw, Search, ShoppingCart, Trash2, TriangleAlert } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { CrmEmpty, CrmPageHeader, CrmSearch, StatusBadge } from "@/components/crm/CrmUI";
import { useAppStore } from "@/stores/useAppStore";
import type { Product } from "@/types/domain";
import { formatDateTime, nowIso } from "@/utils/date";
import { createId } from "@/utils/id";
import { formatMoney, toMinor } from "@/utils/money";

const emptyProduct = (categoryId = "", supplierId = ""): Product => {
  const now = nowIso();
  return {
    id: crypto.randomUUID(), sku: `TC2-${Date.now().toString().slice(-5)}`, slug: `product-${Date.now()}`,
    name: { ru: "", kg: "", en: "" }, brand: "", model: "", categoryId, supplierId,
    description: { ru: "", kg: "", en: "" }, specifications: [], purchasePrice: 0, salePrice: 0, stock: 0, reserved: 0,
    minimumStock: 3, warrantyMonths: 12, managerRewardType: "percent", managerRewardValue: 500, images: [],
    isFeatured: false, isPopular: false, isVisible: true, isArchived: false, installmentEligible: true, views: 0,
    source: "supplier", arrivalDate: now, createdAt: now, updatedAt: now,
  };
};

function ProductEditor({ product, open, onClose }: { product: Product | null; open: boolean; onClose: () => void }) {
  const categories = useAppStore((state) => state.categories);
  const suppliers = useAppStore((state) => state.suppliers);
  const save = useAppStore((state) => state.saveProduct);
  const showToast = useAppStore((state) => state.showToast);
  const [draft, setDraft] = useState<Product>(product ? structuredClone(product) : emptyProduct(categories[0]?.id, suppliers[0]?.id));
  const [imageUrls, setImageUrls] = useState((product?.images ?? []).map((item) => item.url).join("\n"));

  const addImageFiles = (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files).slice(0, Math.max(0, 5 - imageUrls.split(/\r?\n/).filter(Boolean).length));
    selected.forEach((file) => {
      if (!file.type.startsWith("image/") || file.size > 4_000_000) {
        showToast("Каждое изображение должно быть меньше 4 МБ", "error");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => setImageUrls((current) => [current, String(reader.result)].filter(Boolean).join("\n"));
      reader.readAsDataURL(file);
    });
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const urls = imageUrls.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
    if (urls.length > 5) return showToast("Можно добавить максимум пять фотографий", "error");
    if (!draft.name.ru || !draft.brand || !draft.model || !draft.categoryId || draft.salePrice <= 0) return showToast("Заполните название, бренд, модель, категорию и цену", "error");
    const next = { ...draft, slug: draft.slug || `${draft.brand}-${draft.model}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name: { ru: draft.name.ru, kg: draft.name.kg || draft.name.ru, en: draft.name.en || draft.name.ru }, description: { ru: draft.description.ru, kg: draft.description.kg || draft.description.ru, en: draft.description.en || draft.description.ru }, images: urls.map((url, index) => ({ id: `${draft.id}-image-${index + 1}`, url, position: index, alt: { ru: draft.name.ru, kg: draft.name.kg || draft.name.ru, en: draft.name.en || draft.name.ru } })), updatedAt: nowIso() };
    await save(next); onClose();
  };
  const moneyChange = (field: "salePrice" | "purchasePrice" | "oldPrice", value: string) => setDraft((current) => ({ ...current, [field]: value ? toMinor(Number(value)) : undefined }));
  return <Modal open={open} onClose={onClose} title={product ? `Редактирование: ${product.name.ru}` : "Новый товар"} size="lg"><form className="crm-form product-editor" onSubmit={submit}><div className="form-grid"><div className="field field--wide"><label>Название *</label><input value={draft.name.ru} onChange={(event) => setDraft((current) => ({ ...current, name: { ...current.name, ru: event.target.value } }))}/></div><div className="field"><label>Бренд *</label><input value={draft.brand} onChange={(event) => setDraft((current) => ({ ...current, brand: event.target.value }))}/></div><div className="field"><label>Модель *</label><input value={draft.model} onChange={(event) => setDraft((current) => ({ ...current, model: event.target.value }))}/></div><div className="field"><label>Категория</label><select value={draft.categoryId} onChange={(event) => setDraft((current) => ({ ...current, categoryId: event.target.value }))}>{categories.map((item) => <option value={item.id} key={item.id}>{item.name.ru}</option>)}</select></div><div className="field"><label>Поставщик</label><select value={draft.supplierId} onChange={(event) => setDraft((current) => ({ ...current, supplierId: event.target.value }))}><option value="">Без поставщика</option>{suppliers.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></div><div className="field"><label>Закупочная цена, сом *</label><input type="number" min="0" value={draft.purchasePrice / 100 || ""} onChange={(event) => moneyChange("purchasePrice", event.target.value)}/></div><div className="field"><label>Цена продажи, сом *</label><input type="number" min="0" value={draft.salePrice / 100 || ""} onChange={(event) => moneyChange("salePrice", event.target.value)}/></div><div className="field"><label>Старая цена, сом</label><input type="number" min="0" value={(draft.oldPrice ?? 0) / 100 || ""} onChange={(event) => moneyChange("oldPrice", event.target.value)}/></div><div className="field"><label>Количество</label><input type="number" min="0" value={draft.stock} onChange={(event) => setDraft((current) => ({ ...current, stock: Number(event.target.value) }))}/></div><div className="field"><label>Минимальный остаток</label><input type="number" min="0" value={draft.minimumStock} onChange={(event) => setDraft((current) => ({ ...current, minimumStock: Number(event.target.value) }))}/></div><div className="field"><label>Гарантия, месяцев</label><input type="number" min="0" value={draft.warrantyMonths} onChange={(event) => setDraft((current) => ({ ...current, warrantyMonths: Number(event.target.value) }))}/></div><div className="field field--wide"><label>Описание</label><textarea rows={4} value={draft.description.ru} onChange={(event) => setDraft((current) => ({ ...current, description: { ...current.description, ru: event.target.value } }))}/></div><div className="field field--wide"><label><ImagePlus size={16}/>Фотографии (макс. 5)</label><input type="file" accept="image/*" multiple onChange={(event) => addImageFiles(event.target.files)}/><textarea rows={4} value={imageUrls} onChange={(event) => setImageUrls(event.target.value)} placeholder="Также можно вставить внешние URL, каждый с новой строки"/><small>{imageUrls.split(/\r?\n/).filter((value) => value.trim()).length}/5 изображений · файлы загружаются в Supabase Storage</small></div></div><div className="form-check-grid"><label><input type="checkbox" checked={draft.isVisible} onChange={(event) => setDraft((current) => ({ ...current, isVisible: event.target.checked }))}/>Показывать на сайте</label><label><input type="checkbox" checked={draft.isFeatured} onChange={(event) => setDraft((current) => ({ ...current, isFeatured: event.target.checked }))}/>Добавить в рекомендации</label><label><input type="checkbox" checked={draft.installmentEligible} onChange={(event) => setDraft((current) => ({ ...current, installmentEligible: event.target.checked }))}/>Доступна рассрочка</label></div><footer className="modal-form-actions"><Button type="button" variant="ghost" onClick={onClose}>Отмена</Button><Button type="submit">Сохранить товар</Button></footer></form></Modal>;
}

export function CatalogSection({ role }: { role: "admin" | "manager" }) {
  const products = useAppStore((state) => state.products);
  const suppliers = useAppStore((state) => state.suppliers);
  const archive = useAppStore((state) => state.archiveProduct);
  const remove = useAppStore((state) => state.deleteProduct);
  const [query, setQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [editing, setEditing] = useState<Product | null | "new">(null);
  const visible = useMemo(() => {
    const q = query.toLowerCase();
    return products.filter((product) => {
      const supplier = suppliers.find((item) => item.id === product.supplierId)?.name ?? "";
      const match = [product.name.ru, product.brand, product.model, product.sku, ...(role === "admin" ? [supplier] : [])].some((value) => value.toLowerCase().includes(q));
      return match && (stockFilter === "all" || (stockFilter === "low" ? product.stock - product.reserved <= product.minimumStock : stockFilter === "empty" ? product.stock - product.reserved <= 0 : product.stock - product.reserved > 0));
    });
  }, [products, suppliers, query, stockFilter, role]);
  return <div className="crm-page catalog-section"><CrmPageHeader title="Каталог товаров" text={role === "admin" ? "Управление ценами, остатками и отображением на сайте." : "Актуальные товары, цены продажи, остатки и ваша комиссия."} actions={role === "admin" ? <Button icon={<Plus size={17}/>} onClick={() => setEditing("new")}>Добавить товар</Button> : undefined}/><section className="crm-panel catalog-toolbar-crm"><CrmSearch value={query} onChange={setQuery} placeholder={role === "admin" ? "Название, бренд, модель, SKU или поставщик…" : "Название, бренд, модель или SKU…"}/><select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)}><option value="all">Все остатки</option><option value="in">В наличии</option><option value="low">Низкий остаток</option><option value="empty">Нет в наличии</option></select><span>{visible.length} позиций</span></section><section className="product-admin-grid">{visible.map((product) => { const available = product.stock - product.reserved; const supplier = suppliers.find((item) => item.id === product.supplierId); return <article className={`crm-panel product-admin-card${product.isArchived ? " is-archived" : ""}`} key={product.id}><div className="product-admin-card__image"><img src={product.images[0]?.url || "/logo.jpg"} alt={product.name.ru}/><span className={available <= product.minimumStock ? "low" : ""}>{available} шт.</span></div><div className="product-admin-card__body"><small>{product.brand} · {product.model}</small><h3>{product.name.ru}</h3><p>{product.sku}{role === "admin" && supplier ? ` · ${supplier.name}` : ""}</p><div className="product-admin-card__prices"><strong>{formatMoney(product.salePrice)}</strong>{product.oldPrice && <s>{formatMoney(product.oldPrice)}</s>}</div><div className="product-admin-card__meta"><span>Комиссия: {product.managerRewardType === "percent" ? `${product.managerRewardValue / 100}%` : formatMoney(product.managerRewardValue)}</span>{role === "admin" && <span className="private-money">Закупка: {formatMoney(product.purchasePrice)}</span>}</div><div className="product-admin-card__status">{product.isVisible && !product.isArchived ? <span className="visibility-on"><Eye size={15}/>На сайте</span> : <span className="visibility-off"><EyeOff size={15}/>Скрыт</span>}</div>{role === "admin" && <footer className="table-actions"><button onClick={() => setEditing(product)} title="Редактировать"><Edit3 size={16}/></button><button onClick={() => void archive(product.id)} title={product.isArchived ? "Восстановить" : "Архивировать"}>{product.isArchived ? <RotateCcw size={16}/> : <Archive size={16}/>}</button><button className="danger" onClick={() => window.confirm(`Удалить ${product.name.ru}?`) && void remove(product.id)} title="Удалить"><Trash2 size={16}/></button></footer>}</div></article>; })}{!visible.length && <div className="crm-panel"><CrmEmpty title="Товары не найдены" text="Измените поиск или фильтр остатка."/></div>}</section>{editing && <ProductEditor key={editing === "new" ? "new" : editing.id} product={editing === "new" ? null : editing} open onClose={() => setEditing(null)}/>}</div>;
}

export function InventorySection() {
  const products = useAppStore((state) => state.products);
  const movements = useAppStore((state) => state.movements);
  const adjustStock = useAppStore((state) => state.adjustStock);
  const showToast = useAppStore((state) => state.showToast);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"stock" | "history">("stock");
  const filtered = products.filter((product) => [product.name.ru, product.brand, product.model, product.sku].some((value) => value.toLowerCase().includes(query.toLowerCase())));
  const adjust = (product: Product) => {
    const raw = window.prompt(`Изменение остатка для ${product.name.ru}.\nПоложительное число — приход, отрицательное — списание:`, "1");
    if (raw === null) return;
    const delta = Number(raw);
    const reason = window.prompt("Причина корректировки:", "Ручная инвентаризация") ?? "Ручная корректировка";
    try { adjustStock(product.id, delta, reason); } catch (error) { showToast(error instanceof Error ? error.message : "Ошибка", "error"); }
  };
  return <div className="crm-page inventory-section"><CrmPageHeader title="Склад" text="Остатки меняются только через движения с причиной, датой и ответственным." actions={<Button icon={<PackagePlus size={17}/>} onClick={() => { const first = products[0]; if (first) adjust(first); }}>Новое движение</Button>}/><div className="metrics-grid compact"><div className="mini-metric"><span><Boxes size={19}/></span><div><small>Всего единиц</small><strong>{products.reduce((sum, item) => sum + item.stock, 0)}</strong></div></div><div className="mini-metric"><span><PackageCheck size={19}/></span><div><small>Доступно</small><strong>{products.reduce((sum, item) => sum + item.stock - item.reserved, 0)}</strong></div></div><div className="mini-metric warning"><span><TriangleAlert size={19}/></span><div><small>Низкий остаток</small><strong>{products.filter((item) => item.stock - item.reserved <= item.minimumStock).length}</strong></div></div><div className="mini-metric danger"><span><MinusCircle size={19}/></span><div><small>Нет в наличии</small><strong>{products.filter((item) => item.stock - item.reserved <= 0).length}</strong></div></div></div><section className="crm-panel inventory-tabs"><button className={tab === "stock" ? "active" : ""} onClick={() => setTab("stock")}>Текущие остатки</button><button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}>История движений</button></section>{tab === "stock" ? <section className="crm-panel table-panel"><header><CrmSearch value={query} onChange={setQuery} placeholder="Название, модель или SKU…"/></header><div className="responsive-table"><table><thead><tr><th>Товар</th><th>Всего</th><th>Резерв</th><th>Доступно</th><th>Минимум</th><th>Статус</th><th/></tr></thead><tbody>{filtered.map((product) => { const available = product.stock - product.reserved; return <tr key={product.id}><td><div className="table-product"><img src={product.images[0]?.url || "/logo.jpg"} alt=""/><span><strong>{product.name.ru}</strong><small>{product.sku} · {product.model}</small></span></div></td><td>{product.stock}</td><td>{product.reserved}</td><td><strong>{available}</strong></td><td>{product.minimumStock}</td><td>{available <= 0 ? <StatusBadge status="archived"/> : available <= product.minimumStock ? <span className="status-badge status-badge--warning">Мало</span> : <span className="status-badge status-badge--active">Норма</span>}</td><td><Button size="sm" variant="ghost" onClick={() => adjust(product)}>Движение</Button></td></tr>; })}</tbody></table></div></section> : <section className="crm-panel table-panel"><div className="responsive-table"><table><thead><tr><th>Операция</th><th>Дата</th><th>Товар</th><th>Тип</th><th>Изменение</th><th>До → После</th><th>Причина</th><th>Ответственный</th></tr></thead><tbody>{movements.slice().reverse().map((movement) => <tr key={movement.id}><td><strong>{movement.number}</strong></td><td>{formatDateTime(movement.createdAt)}</td><td>{products.find((item) => item.id === movement.productId)?.name.ru ?? movement.productId}</td><td><span className={`movement-type movement-type--${movement.type}`}>{movement.type}</span></td><td className={movement.quantity > 0 ? "positive-money" : "negative-money"}>{movement.quantity > 0 ? "+" : ""}{movement.quantity}</td><td>{movement.quantityBefore} → {movement.quantityAfter}</td><td>{movement.reason}</td><td>{movement.responsibleUserId}</td></tr>)}</tbody></table></div></section>}</div>;
}

function SaleEditor({ open, onClose, role, source }: { open: boolean; onClose: () => void; role: "admin" | "manager"; source: "online" | "offline" }) {
  const session = useAppStore((state) => state.session)!;
  const products = useAppStore((state) => state.products).filter((product) => product.stock - product.reserved > 0);
  const managers = useAppStore((state) => state.managers).filter((manager) => manager.status === "active");
  const createSale = useAppStore((state) => state.createSale);
  const showToast = useAppStore((state) => state.showToast);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [managerId, setManagerId] = useState(role === "manager" ? session.managerProfileId ?? "" : managers[0]?.id ?? "");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+996 ");
  const [quantity, setQuantity] = useState(1);
  const submit = async (event: FormEvent) => { event.preventDefault(); try { const order = await createSale({ productId, managerId, fullName, phone, quantity, address: "Уточнить", region: "Бишкек", source, paymentMethod: "cash" }); showToast(`Продажа ${order.number} проведена`); onClose(); } catch (error) { showToast(error instanceof Error ? error.message : "Ошибка", "error"); } };
  return <Modal open={open} onClose={onClose} title="Провести продажу" size="md"><form className="crm-form" onSubmit={submit}><div className="field"><label>Товар</label><select value={productId} onChange={(event) => setProductId(event.target.value)}>{products.map((product) => <option value={product.id} key={product.id}>{product.name.ru} · {product.stock - product.reserved} шт.</option>)}</select></div><div className="field"><label>Количество</label><input type="number" min="1" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}/></div><div className="field"><label>Клиент</label><input value={fullName} onChange={(event) => setFullName(event.target.value)} required/></div><div className="field"><label>Телефон</label><input value={phone} onChange={(event) => setPhone(event.target.value)} required/></div><div className="field"><label>Менеджер</label><select value={managerId} onChange={(event) => setManagerId(event.target.value)} disabled={role === "manager"}>{managers.filter((manager) => role === "admin" || manager.id === session.managerProfileId).map((manager) => <option value={manager.id} key={manager.id}>{manager.name}</option>)}</select></div><footer className="modal-form-actions"><Button type="button" variant="ghost" onClick={onClose}>Отмена</Button><Button type="submit">Провести продажу</Button></footer></form></Modal>;
}

export function SalesSection({ role, source }: { role: "admin" | "manager"; source?: "online" | "offline" }) {
  const session = useAppStore((state) => state.session)!;
  const allOrders = useAppStore((state) => state.orders);
  const customers = useAppStore((state) => state.customers);
  const managers = useAppStore((state) => state.managers);
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState(false);
  const scopedSource = source;
  const orders = allOrders.filter((order) => (!scopedSource || order.source === scopedSource) && (role === "admin" || order.managerId === session.managerProfileId) && [order.number, customers.find((customer) => customer.id === order.customerId)?.fullName ?? "", order.items.map((item) => item.name).join(" ")].some((value) => value.toLowerCase().includes(query.toLowerCase())));
  const total = orders.reduce((sum, order) => sum + order.total, 0);
  return <div className="crm-page sales-section"><CrmPageHeader title={role === "manager" ? "Мои продажи" : source === "online" ? "Онлайн-продажи" : "Офлайн-продажи"} text="Последовательная нумерация, клиент, товар, сумма, источник и комиссия сохраняются автоматически." actions={<Button icon={<Plus size={17}/>} onClick={() => setEditor(true)}>Провести продажу</Button>}/><div className="metrics-grid compact"><div className="mini-metric"><span><ShoppingCart size={19}/></span><div><small>Количество продаж</small><strong>{orders.length}</strong></div></div><div className="mini-metric"><span><CircleDollarSign size={19}/></span><div><small>Выручка</small><strong>{formatMoney(total)}</strong></div></div><div className="mini-metric"><span><Boxes size={19}/></span><div><small>Продано единиц</small><strong>{orders.reduce((sum, order) => sum + order.items.reduce((count, item) => count + item.quantity, 0), 0)}</strong></div></div></div><section className="crm-panel table-panel"><header><CrmSearch value={query} onChange={setQuery} placeholder="Продажа, клиент или товар…"/></header><div className="responsive-table"><table><thead><tr><th>№ продажи</th><th>Дата</th><th>Клиент</th><th>Товары</th><th>Менеджер</th><th>Источник</th><th>Оплата</th><th>Сумма</th></tr></thead><tbody>{orders.slice().reverse().map((order) => <tr key={order.id}><td><strong>{order.number}</strong></td><td>{formatDateTime(order.createdAt)}</td><td>{customers.find((customer) => customer.id === order.customerId)?.fullName}</td><td>{order.items.map((item) => item.name).join(", ")}</td><td>{managers.find((manager) => manager.id === order.managerId)?.name}</td><td><span className={`source-badge source-badge--${order.source}`}>{order.source}</span></td><td>{order.purchaseMethod === "installment" ? "Рассрочка" : "Полная"}</td><td><strong>{formatMoney(order.total)}</strong></td></tr>)}</tbody></table></div>{!orders.length && <CrmEmpty title="Продаж не найдено" text="Новая продажа появится после проведения операции."/>}</section>{editor && <SaleEditor open onClose={() => setEditor(false)} role={role} source={source ?? "offline"}/>}</div>;
}
