import {
  BadgeDollarSign,
  ChevronRight,
  CircleDollarSign,
  ContactRound,
  Eye,
  HandCoins,
  Phone,
  Power,
  Search,
  ShoppingCart,
  Truck,
  Trash2,
  UserPlus,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  CrmEmpty,
  CrmPageHeader,
  CrmSearch,
  StatusBadge,
} from "@/components/crm/CrmUI";
import { financeService } from "@/services/FinanceService";
import { useAppStore } from "@/stores/useAppStore";
import type { Customer, ManagerProfile, Supplier } from "@/types/domain";
import { formatDateTime } from "@/utils/date";
import { formatMoney, toMinor } from "@/utils/money";

function ManagerEditor({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const addManager = useAppStore((state) => state.addManager);
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+996 ");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await addManager({
      userId: userId.trim(),
      name: name.trim(),
      phone: phone.trim(),
    });
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Новый менеджер" size="md">
      <form className="crm-form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="manager-user-id">ID пользователя Supabase</label>
          <input
            id="manager-user-id"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            pattern="[0-9a-fA-F-]{36}"
            required
            autoFocus
          />
        </div>
        <div className="field">
          <label htmlFor="manager-name">Имя и фамилия</label>
          <input
            id="manager-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="manager-phone">Телефон</label>
          <input
            id="manager-phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
          />
        </div>
        <p className="form-hint">
          Сначала создайте пользователя в Supabase Authentication, затем вставьте сюда его UUID. Пароль остаётся только у вас и сотрудника.
        </p>
        <footer className="modal-form-actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit">Добавить</Button>
        </footer>
      </form>
    </Modal>
  );
}

function SupplierEditor({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const addSupplier = useAppStore((state) => state.addSupplier);
  const [draft, setDraft] = useState({
    name: "",
    contactPerson: "",
    phone: "+996 ",
    address: "",
    notes: "",
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    addSupplier(draft);
    onClose();
  };
  const setField = (key: keyof typeof draft, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));
  return (
    <Modal open={open} onClose={onClose} title="Новый поставщик" size="md">
      <form className="crm-form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="supplier-name">Название</label>
          <input
            id="supplier-name"
            value={draft.name}
            onChange={(event) => setField("name", event.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="field">
          <label htmlFor="supplier-contact">Контактное лицо</label>
          <input
            id="supplier-contact"
            value={draft.contactPerson}
            onChange={(event) => setField("contactPerson", event.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="supplier-phone">Телефон</label>
          <input
            id="supplier-phone"
            value={draft.phone}
            onChange={(event) => setField("phone", event.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="supplier-address">Адрес</label>
          <input
            id="supplier-address"
            value={draft.address}
            onChange={(event) => setField("address", event.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="supplier-notes">Заметки</label>
          <textarea
            id="supplier-notes"
            value={draft.notes}
            onChange={(event) => setField("notes", event.target.value)}
            rows={3}
          />
        </div>
        <footer className="modal-form-actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit">Добавить</Button>
        </footer>
      </form>
    </Modal>
  );
}

export function ManagersSection() {
  const managers = useAppStore((state) => state.managers);
  const leads = useAppStore((state) => state.leads);
  const orders = useAppStore((state) => state.orders);
  const commissions = useAppStore((state) => state.managerCommissions);
  const payouts = useAppStore((state) => state.managerPayouts);
  const toggleDistribution = useAppStore(
    (state) => state.toggleManagerDistribution,
  );
  const deleteManager = useAppStore((state) => state.deleteManager);
  const payout = useAppStore((state) => state.payoutManager);
  const showToast = useAppStore((state) => state.showToast);
  const [selected, setSelected] = useState<ManagerProfile | null>(null);
  const [editor, setEditor] = useState(false);
  const pay = (manager: ManagerProfile) => {
    const due = financeService.managerDebt(manager.id);
    const raw = window.prompt(
      `Задолженность перед ${manager.name}: ${formatMoney(due)}\nВведите сумму выплаты в сомах:`,
      String(Math.round(due / 100)),
    );
    if (raw === null) return;
    try {
      payout(
        manager.id,
        toMinor(Number(raw)),
        window.prompt("Комментарий к выплате:", "Выплата менеджеру") ??
          "Выплата менеджеру",
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Ошибка", "error");
    }
  };
  return (
    <div className="crm-page managers-section">
      <CrmPageHeader
        title="Менеджеры"
        text="Распределение заявок, конверсия, комиссии и история выплат."
        actions={
          <Button
            icon={<UserPlus size={17} />}
            onClick={() => setEditor(true)}
          >
            Добавить менеджера
          </Button>
        }
      />
      <ManagerEditor open={editor} onClose={() => setEditor(false)} />
      <div className="manager-cards">
        {managers.map((manager) => {
          const due = financeService.managerDebt(manager.id);
          const conversion = manager.leadCount
            ? Math.round((manager.salesCount / manager.leadCount) * 100)
            : 0;
          return (
            <article className="manager-card" key={manager.id}>
              <header>
                <span className="manager-avatar">
                  {manager.name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div>
                  <h3>{manager.name}</h3>
                  <a href={`tel:${manager.phone}`}>
                    <Phone size={14} />
                    {manager.phone}
                  </a>
                </div>
                <StatusBadge status={manager.status} />
              </header>
              <div className="manager-card__stats">
                <div>
                  <span>Заявки</span>
                  <strong>{manager.leadCount}</strong>
                </div>
                <div>
                  <span>Продажи</span>
                  <strong>{manager.salesCount}</strong>
                </div>
                <div>
                  <span>Конверсия</span>
                  <strong>{conversion}%</strong>
                </div>
              </div>
              <div className="manager-progress">
                <div>
                  <span>Обработано</span>
                  <b>
                    {manager.processedLeadCount}/{manager.leadCount}
                  </b>
                </div>
                <i>
                  <span
                    style={{
                      width: `${manager.leadCount ? (manager.processedLeadCount / manager.leadCount) * 100 : 0}%`,
                    }}
                  />
                </i>
              </div>
              <div className="manager-card__money">
                <div>
                  <span>К выплате</span>
                  <strong>{formatMoney(due)}</strong>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<HandCoins size={16} />}
                  onClick={() => pay(manager)}
                >
                  Выплатить
                </Button>
              </div>
              <footer>
                <label className="toggle-row">
                  <input
                    type="checkbox"
                    checked={manager.acceptsLeads}
                    onChange={() => toggleDistribution(manager.id)}
                  />
                  <span>Принимать заявки</span>
                </label>
                <button onClick={() => setSelected(manager)}>
                  Подробнее <ChevronRight size={15} />
                </button>
                <button className="danger" onClick={() => window.confirm(`Отключить менеджера ${manager.name}?`) && void deleteManager(manager.id)} title="Отключить менеджера">
                  <Trash2 size={15}/>
                </button>
              </footer>
            </article>
          );
        })}
      </div>
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? "Менеджер"}
        size="lg"
      >
        {selected && (
          <div className="manager-detail">
            <div className="manager-detail__metrics">
              <div>
                <span>Активные заявки</span>
                <strong>
                  {
                    leads.filter(
                      (lead) =>
                        lead.managerId === selected.id &&
                        !["completed", "cancelled", "refused"].includes(
                          lead.status,
                        ),
                    ).length
                  }
                </strong>
              </div>
              <div>
                <span>Продажи</span>
                <strong>
                  {
                    orders.filter((order) => order.managerId === selected.id)
                      .length
                  }
                </strong>
              </div>
              <div>
                <span>Начислено</span>
                <strong>
                  {formatMoney(
                    commissions
                      .filter((item) => item.managerId === selected.id)
                      .reduce((sum, item) => sum + item.amount, 0),
                  )}
                </strong>
              </div>
              <div>
                <span>Выплачено</span>
                <strong>
                  {formatMoney(
                    payouts
                      .filter((item) => item.managerId === selected.id)
                      .reduce((sum, item) => sum + item.amount, 0),
                  )}
                </strong>
              </div>
            </div>
            <h4>Последние продажи</h4>
            <div className="responsive-table">
              <table>
                <thead>
                  <tr>
                    <th>№</th>
                    <th>Дата</th>
                    <th>Сумма</th>
                    <th>Источник</th>
                  </tr>
                </thead>
                <tbody>
                  {orders
                    .filter((order) => order.managerId === selected.id)
                    .slice(-8)
                    .reverse()
                    .map((order) => (
                      <tr key={order.id}>
                        <td>{order.number}</td>
                        <td>{formatDateTime(order.createdAt)}</td>
                        <td>{formatMoney(order.total)}</td>
                        <td>{order.source}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <h4>История выплат</h4>
            {payouts
              .filter((item) => item.managerId === selected.id)
              .map((item) => (
                <div className="payout-row" key={item.id}>
                  <span>
                    <strong>{formatMoney(item.amount)}</strong>
                    <small>{item.comment}</small>
                  </span>
                  <time>{formatDateTime(item.paidAt)}</time>
                </div>
              ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

export function CustomersSection({ role }: { role: "admin" | "manager" }) {
  const session = useAppStore((state) => state.session)!;
  const allCustomers = useAppStore((state) => state.customers);
  const orders = useAppStore((state) => state.orders);
  const leads = useAppStore((state) => state.leads);
  const managers = useAppStore((state) => state.managers);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const customers = useMemo(
    () =>
      allCustomers.filter(
        (customer) =>
          (role === "admin" ||
            customer.managerId === session.managerProfileId) &&
          [
            customer.fullName,
            customer.phone,
            customer.region,
            managers.find((manager) => manager.id === customer.managerId)
              ?.name ?? "",
          ].some((value) => value.toLowerCase().includes(query.toLowerCase())),
      ),
    [allCustomers, role, session.managerProfileId, query, managers],
  );
  return (
    <div className="crm-page customers-section">
      <CrmPageHeader
        title={role === "admin" ? "Клиенты" : "Мои клиенты"}
        text="Покупки, источники, ответственный менеджер и история общения."
      />
      <section className="crm-panel customers-toolbar">
        <CrmSearch
          value={query}
          onChange={setQuery}
          placeholder="ФИО, телефон, регион или менеджер…"
        />
        <span>
          Всего клиентов: <strong>{customers.length}</strong>
        </span>
      </section>
      <section className="customer-card-grid">
        {customers.map((customer) => (
          <article className="customer-card" key={customer.id}>
            <header>
              <span>
                {customer.fullName
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <div>
                <h3>{customer.fullName}</h3>
                <a href={`tel:${customer.phone}`}>
                  <Phone size={14} />
                  {customer.phone}
                </a>
              </div>
            </header>
            <dl>
              <div>
                <dt>Регион</dt>
                <dd>{customer.region}</dd>
              </div>
              <div>
                <dt>Покупок</dt>
                <dd>{customer.purchaseCount}</dd>
              </div>
              <div>
                <dt>Потрачено</dt>
                <dd>{formatMoney(customer.totalSpent)}</dd>
              </div>
              <div>
                <dt>Менеджер</dt>
                <dd>
                  {managers.find((manager) => manager.id === customer.managerId)
                    ?.name ?? "—"}
                </dd>
              </div>
            </dl>
            <button onClick={() => setSelected(customer)}>
              Открыть клиента <ChevronRight size={15} />
            </button>
          </article>
        ))}
      </section>
      {!customers.length && (
        <CrmEmpty title="Клиенты не найдены" text="Измените строку поиска." />
      )}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.fullName ?? "Клиент"}
        size="lg"
      >
        {selected && (
          <div className="customer-detail">
            <div className="customer-contact">
              <span className="avatar-large">
                {selected.fullName
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <div>
                <h3>{selected.fullName}</h3>
                <p>
                  {selected.address}, {selected.region}
                </p>
                <a href={`tel:${selected.phone}`}>
                  <Phone size={15} />
                  {selected.phone}
                </a>
              </div>
            </div>
            <div className="manager-detail__metrics">
              <div>
                <span>Покупок</span>
                <strong>{selected.purchaseCount}</strong>
              </div>
              <div>
                <span>Общая сумма</span>
                <strong>{formatMoney(selected.totalSpent)}</strong>
              </div>
              <div>
                <span>Заявок</span>
                <strong>
                  {
                    leads.filter(
                      (lead) =>
                        lead.phone.replace(/\D/g, "") ===
                        selected.phone.replace(/\D/g, ""),
                    ).length
                  }
                </strong>
              </div>
            </div>
            <h4>История покупок</h4>
            <div className="responsive-table">
              <table>
                <thead>
                  <tr>
                    <th>Продажа</th>
                    <th>Дата</th>
                    <th>Товар</th>
                    <th>Сумма</th>
                    <th>Оплата</th>
                  </tr>
                </thead>
                <tbody>
                  {orders
                    .filter((order) => order.customerId === selected.id)
                    .map((order) => (
                      <tr key={order.id}>
                        <td>{order.number}</td>
                        <td>{formatDateTime(order.createdAt)}</td>
                        <td>
                          {order.items.map((item) => item.name).join(", ")}
                        </td>
                        <td>{formatMoney(order.total)}</td>
                        <td>{order.purchaseMethod}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export function SuppliersSection() {
  const suppliers = useAppStore((state) => state.suppliers);
  const supplierProducts = useAppStore((state) => state.products);
  const debts = useAppStore((state) => state.supplierDebts);
  const payments = useAppStore((state) => state.supplierPayments);
  const payout = useAppStore((state) => state.payoutSupplier);
  const deleteSupplier = useAppStore((state) => state.deleteSupplier);
  const showToast = useAppStore((state) => state.showToast);
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [editor, setEditor] = useState(false);
  const pay = (supplier: Supplier) => {
    const due = financeService.supplierDebt(supplier.id);
    const raw = window.prompt(
      `Задолженность ${supplier.name}: ${formatMoney(due)}\nВведите сумму выплаты в сомах:`,
      String(Math.round(due / 100)),
    );
    if (raw === null) return;
    try {
      payout(
        supplier.id,
        toMinor(Number(raw)),
        window.prompt("Комментарий:", "Выплата поставщику") ??
          "Выплата поставщику",
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Ошибка", "error");
    }
  };
  return (
    <div className="crm-page suppliers-section">
      <CrmPageHeader
        title="Поставщики"
        text="Комиссионная модель: оплачиваются только фактически проданные товары."
        actions={
          <Button
            icon={<UserPlus size={17} />}
            onClick={() => setEditor(true)}
          >
            Добавить поставщика
          </Button>
        }
      />
      <SupplierEditor open={editor} onClose={() => setEditor(false)} />
      <div className="supplier-grid">
        {suppliers.map((supplier) => {
          const products = supplierProducts.filter(
            (product) => product.supplierId === supplier.id,
          );
          const debt = financeService.supplierDebt(supplier.id);
          return (
            <article className="supplier-card" key={supplier.id}>
              <header>
                <span>
                  <Truck size={22} />
                </span>
                <div>
                  <h3>{supplier.name}</h3>
                  <p>
                    {supplier.contactPerson} · {supplier.phone}
                  </p>
                </div>
              </header>
              <div className="supplier-card__numbers">
                <div>
                  <small>Товаров</small>
                  <strong>{products.length}</strong>
                </div>
                <div>
                  <small>Остаток</small>
                  <strong>
                    {products.reduce((sum, product) => sum + product.stock, 0)}{" "}
                    шт.
                  </strong>
                </div>
                <div>
                  <small>Долг</small>
                  <strong>{formatMoney(debt)}</strong>
                </div>
              </div>
              <div className="supplier-card__progress">
                <span>Выплачено</span>
                <strong>
                  {formatMoney(
                    payments
                      .filter((item) => item.supplierId === supplier.id)
                      .reduce((sum, item) => sum + item.amount, 0),
                  )}
                </strong>
              </div>
              <footer>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<HandCoins size={16} />}
                  onClick={() => pay(supplier)}
                >
                  Выплатить
                </Button>
                <button onClick={() => setSelected(supplier)}>
                  Подробнее <ChevronRight size={15} />
                </button>
                <button className="danger" onClick={() => window.confirm(`Архивировать поставщика ${supplier.name}?`) && void deleteSupplier(supplier.id)} title="Архивировать поставщика">
                  <Trash2 size={15}/>
                </button>
              </footer>
            </article>
          );
        })}
      </div>
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? "Поставщик"}
        size="lg"
      >
        {selected && (
          <div className="supplier-detail">
            <div className="supplier-detail__contact">
              <Truck size={24} />
              <div>
                <h3>{selected.contactPerson}</h3>
                <p>{selected.phone}</p>
                <span>{selected.address}</span>
              </div>
            </div>
            <div className="manager-detail__metrics">
              <div>
                <span>Передано товаров</span>
                <strong>
                  {supplierProducts
                    .filter((product) => product.supplierId === selected.id)
                    .reduce((sum, product) => sum + product.stock, 0)}
                </strong>
              </div>
              <div>
                <span>Задолженность</span>
                <strong>
                  {formatMoney(financeService.supplierDebt(selected.id))}
                </strong>
              </div>
              <div>
                <span>Выплачено</span>
                <strong>
                  {formatMoney(
                    payments
                      .filter((item) => item.supplierId === selected.id)
                      .reduce((sum, item) => sum + item.amount, 0),
                  )}
                </strong>
              </div>
            </div>
            <h4>Товары поставщика</h4>
            <div className="responsive-table">
              <table>
                <thead>
                  <tr>
                    <th>Товар</th>
                    <th>Остаток</th>
                    <th>Закупка</th>
                    <th>Продажа</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierProducts
                    .filter((product) => product.supplierId === selected.id)
                    .map((product) => (
                      <tr key={product.id}>
                        <td>{product.name.ru}</td>
                        <td>{product.stock}</td>
                        <td>{formatMoney(product.purchasePrice)}</td>
                        <td>{formatMoney(product.salePrice)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <h4>История выплат</h4>
            {payments
              .filter((item) => item.supplierId === selected.id)
              .map((item) => (
                <div className="payout-row" key={item.id}>
                  <span>
                    <strong>{formatMoney(item.amount)}</strong>
                    <small>{item.comment}</small>
                  </span>
                  <time>{formatDateTime(item.paidAt)}</time>
                </div>
              ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

export function EarningsSection() {
  const session = useAppStore((state) => state.session)!;
  const commissions = useAppStore((state) => state.managerCommissions).filter(
    (item) => item.managerId === session.managerProfileId,
  );
  const payouts = useAppStore((state) => state.managerPayouts).filter(
    (item) => item.managerId === session.managerProfileId,
  );
  const orders = useAppStore((state) => state.orders);
  const accrued = commissions
    .filter((item) => item.status !== "cancelled")
    .reduce((sum, item) => sum + item.amount, 0);
  const paid = payouts.reduce((sum, item) => sum + item.amount, 0);
  return (
    <div className="crm-page earnings-section">
      <CrmPageHeader
        title="Мои начисления"
        text="Комиссии по каждой продаже и сохранённая история выплат."
      />
      <div className="metrics-grid compact">
        <div className="mini-metric">
          <span>
            <BadgeDollarSign size={19} />
          </span>
          <div>
            <small>Начислено</small>
            <strong>{formatMoney(accrued)}</strong>
          </div>
        </div>
        <div className="mini-metric">
          <span>
            <WalletCards size={19} />
          </span>
          <div>
            <small>Выплачено</small>
            <strong>{formatMoney(paid)}</strong>
          </div>
        </div>
        <div className="mini-metric warning">
          <span>
            <HandCoins size={19} />
          </span>
          <div>
            <small>К выплате</small>
            <strong>{formatMoney(Math.max(0, accrued - paid))}</strong>
          </div>
        </div>
      </div>
      <div className="dashboard-secondary-grid">
        <section className="crm-panel table-panel">
          <header>
            <div>
              <span>Детализация</span>
              <h3>Комиссии по продажам</h3>
            </div>
          </header>
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Продажа</th>
                  <th>Дата</th>
                  <th>Сумма продажи</th>
                  <th>Комиссия</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((item) => {
                  const order = orders.find(
                    (entry) => entry.id === item.orderId,
                  );
                  return (
                    <tr key={item.id}>
                      <td>{order?.number ?? item.orderId}</td>
                      <td>{formatDateTime(item.createdAt)}</td>
                      <td>{order ? formatMoney(order.total) : "—"}</td>
                      <td>
                        <strong>{formatMoney(item.amount)}</strong>
                      </td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
        <section className="crm-panel">
          <header>
            <div>
              <span>История</span>
              <h3>Выплаты</h3>
            </div>
          </header>
          {payouts.length ? (
            payouts.map((item) => (
              <div className="payout-row" key={item.id}>
                <span>
                  <strong>{formatMoney(item.amount)}</strong>
                  <small>{item.comment}</small>
                </span>
                <time>{formatDateTime(item.paidAt)}</time>
              </div>
            ))
          ) : (
            <CrmEmpty
              title="Выплат пока нет"
              text="После выплаты запись появится здесь."
            />
          )}
        </section>
      </div>
    </div>
  );
}
