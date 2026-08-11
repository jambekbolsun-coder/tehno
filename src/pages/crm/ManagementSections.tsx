import {
  AlertTriangle,
  BarChart3,
  Bell,
  BellOff,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Edit3,
  Eye,
  EyeOff,
  FileQuestion,
  Filter,
  HandCoins,
  Landmark,
  Megaphone,
  PackageMinus,
  Plus,
  ReceiptText,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  UserRound,
  WalletCards,
} from "lucide-react";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { BarChart, DonutChart } from "@/components/crm/Charts";
import {
  CrmEmpty,
  CrmPageHeader,
  CrmSearch,
  StatusBadge,
} from "@/components/crm/CrmUI";
import { financeService } from "@/services/FinanceService";
import { useAppStore } from "@/stores/useAppStore";
import type { Expense, FAQ, Language, ReturnRecord } from "@/types/domain";
import { formatDateTime, nowIso } from "@/utils/date";
import { createId } from "@/utils/id";
import { formatMoney, formatPercent, toMinor } from "@/utils/money";

const expenseLabels: Record<Expense["category"], string> = {
  rent: "Аренда",
  target: "Таргет",
  advertising: "Реклама",
  delivery: "Доставка",
  salary: "Зарплаты",
  household: "Хозяйственные",
  small: "Мелкие",
  equipment: "Техника",
  repair: "Ремонт",
  tax: "Налоги",
  other: "Другое",
};

function ReturnEditor({ open, onClose }: { open: boolean; onClose: () => void }) {
  const returns = useAppStore((state) => state.returns);
  const orders = useAppStore((state) => state.orders);
  const products = useAppStore((state) => state.products);
  const customers = useAppStore((state) => state.customers);
  const suppliers = useAppStore((state) => state.suppliers);
  const managers = useAppStore((state) => state.managers);
  const addReturn = useAppStore((state) => state.addReturn);
  const showToast = useAppStore((state) => state.showToast);
  const firstProduct = products[0];
  const [draft, setDraft] = useState({
    orderId: orders[0]?.id ?? "",
    productId: firstProduct?.id ?? "",
    customerId: orders[0]?.customerId ?? customers[0]?.id ?? "",
    supplierId: firstProduct?.supplierId ?? suppliers[0]?.id ?? "",
    managerId: orders[0]?.managerId ?? managers[0]?.id ?? "",
    type: "return" as ReturnRecord["type"],
    quantity: 1,
    amount: 0,
    reason: "",
    condition: "Товар принят на проверку",
    comment: "",
    photoUrl: "",
  });
  const setField = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const now = nowIso();
    const product = products.find((item) => item.id === draft.productId);
    try {
      await addReturn({
        id: createId("return"),
        number: `RET-${String(returns.length + 1).padStart(4, "0")}`,
        orderId: draft.orderId,
        productId: draft.productId,
        customerId: draft.customerId,
        supplierId: product?.supplierId ?? draft.supplierId,
        managerId: draft.managerId,
        reason: draft.reason,
        type: draft.type,
        quantity: draft.quantity,
        condition: draft.condition,
        amount: toMinor(draft.amount),
        photos: draft.photoUrl ? [draft.photoUrl] : [],
        comment: draft.comment,
        decision: draft.type === "defect" ? "defect" : "pending",
        createdAt: now,
        updatedAt: now,
      });
      onClose();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Не удалось сохранить операцию", "error");
    }
  };
  return <Modal open={open} onClose={onClose} title="Новая операция" size="lg"><form className="crm-form" onSubmit={submit}><div className="form-grid"><div className="field"><label htmlFor="return-order">Заказ</label><select id="return-order" value={draft.orderId} onChange={(event) => { const order = orders.find((item) => item.id === event.target.value); setDraft((current) => ({ ...current, orderId: event.target.value, customerId: order?.customerId ?? current.customerId, managerId: order?.managerId ?? current.managerId })); }} required>{orders.map((order) => <option value={order.id} key={order.id}>{order.number}</option>)}</select></div><div className="field"><label htmlFor="return-product">Товар</label><select id="return-product" value={draft.productId} onChange={(event) => setField("productId", event.target.value)} required>{products.map((product) => <option value={product.id} key={product.id}>{product.name.ru} · остаток {product.stock}</option>)}</select></div><div className="field"><label htmlFor="return-type">Тип</label><select id="return-type" value={draft.type} onChange={(event) => setField("type", event.target.value as ReturnRecord["type"])}><option value="return">Возврат</option><option value="defect">Брак</option></select></div><div className="field"><label htmlFor="return-quantity">Количество</label><input id="return-quantity" type="number" min="1" value={draft.quantity} onChange={(event) => setField("quantity", Number(event.target.value))} required/></div><div className="field"><label htmlFor="return-amount">Сумма, сом</label><input id="return-amount" type="number" min="0" value={draft.amount} onChange={(event) => setField("amount", Number(event.target.value))}/></div><div className="field"><label htmlFor="return-condition">Состояние</label><input id="return-condition" value={draft.condition} onChange={(event) => setField("condition", event.target.value)} required/></div><div className="field field--wide"><label htmlFor="return-reason">Причина</label><input id="return-reason" value={draft.reason} onChange={(event) => setField("reason", event.target.value)} required/></div><div className="field field--wide"><label htmlFor="return-photo">Фотография</label><input id="return-photo" type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 4_000_000) return showToast("Файл должен быть меньше 4 МБ", "error"); const reader = new FileReader(); reader.onload = () => setField("photoUrl", String(reader.result)); reader.readAsDataURL(file); }}/><small>Файл будет загружен в закрытый Supabase Storage.</small></div><div className="field field--wide"><label htmlFor="return-comment">Комментарий</label><textarea id="return-comment" rows={3} value={draft.comment} onChange={(event) => setField("comment", event.target.value)}/></div></div><footer className="modal-form-actions"><Button type="button" variant="ghost" onClick={onClose}>Отмена</Button><Button type="submit">Сохранить операцию</Button></footer></form></Modal>;
}

export function ReturnsSection() {
  const returns = useAppStore((state) => state.returns);
  const products = useAppStore((state) => state.products);
  const customers = useAppStore((state) => state.customers);
  const suppliers = useAppStore((state) => state.suppliers);
  const managers = useAppStore((state) => state.managers);
  const resolve = useAppStore((state) => state.resolveReturn);
  const showToast = useAppStore((state) => state.showToast);
  const [type, setType] = useState("all");
  const [selected, setSelected] = useState<ReturnRecord | null>(null);
  const [editor, setEditor] = useState(false);
  const filtered = returns.filter(
    (item) => type === "all" || item.type === type,
  );
  const decide = (record: ReturnRecord, decision: ReturnRecord["decision"]) => {
    if (
      !window.confirm(`Подтвердить решение «${decision}» для ${record.number}?`)
    )
      return;
    try {
      resolve(record.id, decision);
      setSelected(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Ошибка", "error");
    }
  };
  return (
    <div className="crm-page returns-section">
      <CrmPageHeader
        title="Возвраты и брак"
        text="Каждое решение корректирует связанные данные и остаётся в истории."
        actions={
          <Button
            icon={<Plus size={17} />}
            onClick={() => setEditor(true)}
          >
            Новая операция
          </Button>
        }
      />
      <ReturnEditor open={editor} onClose={() => setEditor(false)} />
      <div className="metrics-grid compact">
        <div className="mini-metric">
          <span>
            <RotateCcw size={19} />
          </span>
          <div>
            <small>Возвраты</small>
            <strong>
              {returns.filter((item) => item.type === "return").length}
            </strong>
          </div>
        </div>
        <div className="mini-metric danger">
          <span>
            <PackageMinus size={19} />
          </span>
          <div>
            <small>Брак</small>
            <strong>
              {returns.filter((item) => item.type === "defect").length}
            </strong>
          </div>
        </div>
        <div className="mini-metric warning">
          <span>
            <AlertTriangle size={19} />
          </span>
          <div>
            <small>Ожидают решения</small>
            <strong>
              {returns.filter((item) => item.decision === "pending").length}
            </strong>
          </div>
        </div>
        <div className="mini-metric">
          <span>
            <CircleDollarSign size={19} />
          </span>
          <div>
            <small>Сумма корректировок</small>
            <strong>
              {formatMoney(returns.reduce((sum, item) => sum + item.amount, 0))}
            </strong>
          </div>
        </div>
      </div>
      <section className="crm-panel returns-toolbar">
        <div className="segmented-control">
          <button
            className={type === "all" ? "active" : ""}
            onClick={() => setType("all")}
          >
            Все
          </button>
          <button
            className={type === "return" ? "active" : ""}
            onClick={() => setType("return")}
          >
            Возвраты
          </button>
          <button
            className={type === "defect" ? "active" : ""}
            onClick={() => setType("defect")}
          >
            Брак
          </button>
        </div>
      </section>
      <section className="crm-panel table-panel">
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Операция</th>
                <th>Дата</th>
                <th>Товар</th>
                <th>Клиент</th>
                <th>Тип</th>
                <th>Количество</th>
                <th>Сумма</th>
                <th>Решение</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record.id}>
                  <td>
                    <strong>{record.number}</strong>
                  </td>
                  <td>{formatDateTime(record.createdAt)}</td>
                  <td>
                    {
                      products.find((item) => item.id === record.productId)
                        ?.name.ru
                    }
                  </td>
                  <td>
                    {
                      customers.find((item) => item.id === record.customerId)
                        ?.fullName
                    }
                  </td>
                  <td>
                    <span className={`return-type return-type--${record.type}`}>
                      {record.type === "return" ? "Возврат" : "Брак"}
                    </span>
                  </td>
                  <td>{record.quantity}</td>
                  <td>{formatMoney(record.amount)}</td>
                  <td>
                    <span
                      className={`decision-badge decision-badge--${record.decision}`}
                    >
                      {record.decision}
                    </span>
                  </td>
                  <td>
                    <button
                      className="table-action"
                      onClick={() => setSelected(record)}
                    >
                      <Eye size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && (
          <CrmEmpty
            title="Операций нет"
            text="Измените фильтр или добавьте возврат."
          />
        )}
      </section>
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.number ?? "Операция"}
        size="md"
      >
        {selected && (
          <div className="return-detail">
            <dl>
              <div>
                <dt>Товар</dt>
                <dd>
                  {
                    products.find((item) => item.id === selected.productId)
                      ?.name.ru
                  }
                </dd>
              </div>
              <div>
                <dt>Клиент</dt>
                <dd>
                  {
                    customers.find((item) => item.id === selected.customerId)
                      ?.fullName
                  }
                </dd>
              </div>
              <div>
                <dt>Поставщик</dt>
                <dd>
                  {
                    suppliers.find((item) => item.id === selected.supplierId)
                      ?.name
                  }
                </dd>
              </div>
              <div>
                <dt>Менеджер</dt>
                <dd>
                  {
                    managers.find((item) => item.id === selected.managerId)
                      ?.name
                  }
                </dd>
              </div>
              <div>
                <dt>Причина</dt>
                <dd>{selected.reason}</dd>
              </div>
              <div>
                <dt>Состояние</dt>
                <dd>{selected.condition}</dd>
              </div>
              <div>
                <dt>Комментарий</dt>
                <dd>{selected.comment}</dd>
              </div>
            </dl>
            {selected.decision === "pending" ? (
              <div className="return-actions">
                <Button
                  variant="secondary"
                  onClick={() => decide(selected, "restock")}
                >
                  Вернуть в продажу
                </Button>
                <Button
                  variant="danger"
                  onClick={() => decide(selected, "defect")}
                >
                  Отправить в брак
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => decide(selected, "supplier_return")}
                >
                  Вернуть поставщику
                </Button>
              </div>
            ) : (
              <div className="resolved-note">
                <CheckCircle2 size={19} />
                Решение сохранено: {selected.decision}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function ExpenseEditor({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const session = useAppStore((state) => state.session)!;
  const add = useAppStore((state) => state.addExpense);
  const [category, setCategory] = useState<Expense["category"]>("other");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [recipient, setRecipient] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [receiptImage, setReceiptImage] = useState<string>();
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const now = nowIso();
    await add({
      id: createId("expense"),
      category,
      amount: toMinor(Number(amount)),
      date: now.slice(0, 10),
      description,
      recipient,
      paymentMethod,
      receiptImage,
      authorUserId: session.id,
      createdAt: now,
      updatedAt: now,
    });
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Новый расход" size="md">
      <form className="crm-form" onSubmit={submit}>
        <div className="field">
          <label>Категория</label>
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as Expense["category"])
            }
          >
            {Object.entries(expenseLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Сумма, сом</label>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>Описание</label>
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>Получатель</label>
          <input
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>Способ оплаты</label>
          <select
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
          >
            <option value="cash">Наличные</option>
            <option value="card">Карта</option>
            <option value="transfer">Перевод</option>
          </select>
        </div>
        <div className="field">
          <label>
            <Upload size={15} />
            Чек или изображение
          </label>
          <input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setReceiptImage(String(reader.result)); reader.readAsDataURL(file); }}/>
          <small>Файл будет загружен в закрытый Supabase Storage.</small>
        </div>
        <footer className="modal-form-actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit">Сохранить расход</Button>
        </footer>
      </form>
    </Modal>
  );
}

export function ExpensesSection() {
  const expenses = useAppStore((state) => state.expenses);
  const remove = useAppStore((state) => state.deleteExpense);
  const [editor, setEditor] = useState(false);
  const [category, setCategory] = useState("all");
  const filtered = expenses.filter(
    (item) => category === "all" || item.category === category,
  );
  const byCategory = Object.entries(expenseLabels)
    .map(([key, label]) => ({
      label: label.slice(0, 4),
      value: Math.round(
        expenses
          .filter((item) => item.category === key)
          .reduce((sum, item) => sum + item.amount, 0) / 100,
      ),
    }))
    .filter((item) => item.value > 0);
  return (
    <div className="crm-page expenses-section">
      <CrmPageHeader
        title="Расходы"
        text="Категории, чеки, получатели и автор каждой операции."
        actions={
          <Button icon={<Plus size={17} />} onClick={() => setEditor(true)}>
            Добавить расход
          </Button>
        }
      />
      <div className="expenses-overview">
        <div className="mini-metric">
          <span>
            <ReceiptText size={19} />
          </span>
          <div>
            <small>Всего расходов</small>
            <strong>
              {formatMoney(
                filtered.reduce((sum, item) => sum + item.amount, 0),
              )}
            </strong>
          </div>
        </div>
        <section className="crm-panel expenses-chart">
          <BarChart
            data={byCategory.length ? byCategory : [{ label: "Нет", value: 0 }]}
            color="#f59e0b"
          />
        </section>
      </div>
      <section className="crm-panel table-panel">
        <header>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="all">Все категории</option>
            {Object.entries(expenseLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
          <span>Записей: {filtered.length}</span>
        </header>
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Категория</th>
                <th>Описание</th>
                <th>Получатель</th>
                <th>Оплата</th>
                <th>Сумма</th>
                <th>Автор</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered
                .slice()
                .reverse()
                .map((expense) => (
                  <tr key={expense.id}>
                    <td>{expense.date}</td>
                    <td>
                      <span
                        className={`expense-category expense-category--${expense.category}`}
                      >
                        {expenseLabels[expense.category]}
                      </span>
                    </td>
                    <td>{expense.description}</td>
                    <td>{expense.recipient}</td>
                    <td>{expense.paymentMethod}</td>
                    <td>
                      <strong>{formatMoney(expense.amount)}</strong>
                    </td>
                    <td>{expense.authorUserId}</td>
                    <td>
                      <button
                        className="table-action danger"
                        onClick={() =>
                          window.confirm(
                            "Удалить этот расход? Это действие нельзя отменить.",
                          ) && remove(expense.id)
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
      {editor && <ExpenseEditor open onClose={() => setEditor(false)} />}
    </div>
  );
}

export function FinanceSection() {
  const summary = financeService.summary();
  const suppliers = useAppStore((state) => state.suppliers);
  const managers = useAppStore((state) => state.managers);
  const expenses = useAppStore((state) => state.expenses);
  return (
    <div className="crm-page finance-section">
      <CrmPageHeader
        title="Финансы"
        text="Выручка, прибыль, долги и денежный поток разделены, чтобы цифры не смешивались."
        actions={
          <select className="crm-period-select">
            <option>Этот месяц</option>
            <option>Прошлый месяц</option>
            <option>Квартал</option>
          </select>
        }
      />
      <section className="finance-hero">
        <div>
          <span>Чистая прибыль по начислению</span>
          <strong>{formatMoney(summary.accrualProfit)}</strong>
          <small>
            <TrendingUp size={15} />
            Формула учитывает себестоимость, комиссии, расходы и возвраты
          </small>
        </div>
        <div>
          <span>Реальный денежный поток</span>
          <strong>{formatMoney(summary.cashFlow)}</strong>
          <small>Фактически полученные и выплаченные деньги</small>
        </div>
      </section>
      <div className="finance-shelves">
        <section className="finance-shelf finance-shelf--green">
          <header>
            <span>
              <CircleDollarSign size={20} />
            </span>
            <div>
              <small>ПОЛКА 1</small>
              <h3>Продажи и доход</h3>
            </div>
          </header>
          <dl>
            <div>
              <dt>Общая выручка</dt>
              <dd>{formatMoney(summary.revenue)}</dd>
            </div>
            <div>
              <dt>Получено денег</dt>
              <dd>{formatMoney(summary.cashReceived)}</dd>
            </div>
            <div>
              <dt>Онлайн-продажи</dt>
              <dd>{formatMoney(summary.onlineRevenue)}</dd>
            </div>
            <div>
              <dt>Офлайн-продажи</dt>
              <dd>{formatMoney(summary.offlineRevenue)}</dd>
            </div>
          </dl>
        </section>
        <section className="finance-shelf finance-shelf--cyan">
          <header>
            <span>
              <Landmark size={20} />
            </span>
            <div>
              <small>ПОЛКА 2</small>
              <h3>Поставщики</h3>
            </div>
          </header>
          <dl>
            <div>
              <dt>Себестоимость проданного</dt>
              <dd>{formatMoney(summary.costOfGoods)}</dd>
            </div>
            <div>
              <dt>Общая задолженность</dt>
              <dd>{formatMoney(summary.supplierDebt)}</dd>
            </div>
            {suppliers.map((supplier) => (
              <div key={supplier.id}>
                <dt>{supplier.name}</dt>
                <dd>{formatMoney(financeService.supplierDebt(supplier.id))}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="finance-shelf finance-shelf--indigo">
          <header>
            <span>
              <HandCoins size={20} />
            </span>
            <div>
              <small>ПОЛКА 3</small>
              <h3>Менеджеры</h3>
            </div>
          </header>
          <dl>
            <div>
              <dt>Начислено комиссий</dt>
              <dd>{formatMoney(summary.managerCommissions)}</dd>
            </div>
            <div>
              <dt>Остаток к выплате</dt>
              <dd>{formatMoney(summary.managerDebt)}</dd>
            </div>
            {managers.map((manager) => (
              <div key={manager.id}>
                <dt>{manager.name}</dt>
                <dd>{formatMoney(financeService.managerDebt(manager.id))}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="finance-shelf finance-shelf--orange">
          <header>
            <span>
              <ReceiptText size={20} />
            </span>
            <div>
              <small>ПОЛКА 4</small>
              <h3>Расходы</h3>
            </div>
          </header>
          <dl>
            {Object.entries(expenseLabels).map(([key, label]) => {
              const amount = expenses
                .filter((item) => item.category === key)
                .reduce((sum, item) => sum + item.amount, 0);
              return (
                amount > 0 && (
                  <div key={key}>
                    <dt>{label}</dt>
                    <dd>{formatMoney(amount)}</dd>
                  </div>
                )
              );
            })}
            <div>
              <dt>Всего расходов</dt>
              <dd>{formatMoney(summary.expenses)}</dd>
            </div>
          </dl>
        </section>
        <section className="finance-shelf finance-shelf--violet finance-shelf--total">
          <header>
            <span>
              <TrendingUp size={20} />
            </span>
            <div>
              <small>ПОЛКА 5</small>
              <h3>Итоговая прибыль</h3>
            </div>
          </header>
          <div className="profit-formula">
            <span>Полученная выручка</span>
            <strong>{formatMoney(summary.cashReceived)}</strong>
            <i>−</i>
            <span>Себестоимость</span>
            <strong>{formatMoney(summary.costOfGoods)}</strong>
            <i>−</i>
            <span>Комиссии</span>
            <strong>{formatMoney(summary.managerCommissions)}</strong>
            <i>−</i>
            <span>Расходы и возвраты</span>
            <strong>{formatMoney(summary.expenses + summary.returns)}</strong>
            <b>= {formatMoney(summary.accrualProfit)}</b>
          </div>
        </section>
      </div>
      <div className="finance-note">
        <ShieldCheck size={19} />
        <p>
          <strong>Контроль двойного учёта включён.</strong> Каждый расход входит
          в формулу один раз через единый реестр операций.
        </p>
      </div>
    </div>
  );
}

export function AnalyticsSection() {
  const allAnalytics = useAppStore((state) => state.analytics);
  const products = useAppStore((state) => state.products);
  const allOrders = useAppStore((state) => state.orders);
  const managers = useAppStore((state) => state.managers);
  const [period, setPeriod] = useState<"30" | "7" | "today">("30");
  const cutoff = useMemo(() => {
    const date = new Date();
    if (period === "today") date.setHours(0, 0, 0, 0);
    else date.setDate(date.getDate() - Number(period));
    return date.getTime();
  }, [period]);
  const analytics = useMemo(
    () => allAnalytics.filter((event) => new Date(event.createdAt).getTime() >= cutoff),
    [allAnalytics, cutoff],
  );
  const orders = useMemo(
    () => allOrders.filter((order) => new Date(order.createdAt).getTime() >= cutoff),
    [allOrders, cutoff],
  );
  const visitors = new Set(analytics.map((event) => event.sessionId)).size;
  const productViews = analytics.filter(
    (event) => event.type === "product_view",
  ).length;
  const leads = analytics.filter(
    (event) => event.type === "lead_submit",
  ).length;
  const conversion = visitors ? Math.round((leads / visitors) * 100) : 0;
  const eventsData = [
    "site_visit",
    "product_view",
    "search",
    "cart_add",
    "lead_submit",
  ].map((type) => ({
    label: type
      .replace("product_view", "товар")
      .replace("site_visit", "визит")
      .replace("cart_add", "корзина")
      .replace("lead_submit", "заявка"),
    value: analytics.filter((event) => event.type === type).length,
  }));
  const searches = analytics
    .filter((event) => event.type === "search")
    .reduce<Record<string, number>>((acc, event) => {
      const query = String(event.data.query ?? "Без запроса");
      acc[query] = (acc[query] ?? 0) + 1;
      return acc;
    }, {});
  const maxProductViews = Math.max(
    ...products.map((product) => product.views),
    1,
  );
  return (
    <div className="crm-page analytics-section">
      <CrmPageHeader
        title="Аналитика"
        text="Путь покупателя от посещения сайта до заявки и продажи."
        actions={
          <select className="crm-period-select" value={period} onChange={(event) => setPeriod(event.target.value as "30" | "7" | "today")}>
            <option value="30">30 дней</option>
            <option value="7">7 дней</option>
            <option value="today">Сегодня</option>
          </select>
        }
      />
      <div className="metrics-grid compact">
        <div className="mini-metric">
          <span>
            <UserRound size={19} />
          </span>
          <div>
            <small>Посетители</small>
            <strong>{visitors}</strong>
          </div>
        </div>
        <div className="mini-metric">
          <span>
            <Eye size={19} />
          </span>
          <div>
            <small>Просмотры товаров</small>
            <strong>{productViews}</strong>
          </div>
        </div>
        <div className="mini-metric">
          <span>
            <CircleDollarSign size={19} />
          </span>
          <div>
            <small>Средний чек</small>
            <strong>
              {formatMoney(
                orders.length
                  ? Math.round(
                      orders.reduce((sum, order) => sum + order.total, 0) /
                        orders.length,
                    )
                  : 0,
              )}
            </strong>
          </div>
        </div>
        <div className="mini-metric">
          <span>
            <TrendingUp size={19} />
          </span>
          <div>
            <small>Конверсия сайта</small>
            <strong>{conversion}%</strong>
          </div>
        </div>
      </div>
      <div className="dashboard-main-grid">
        <section className="crm-panel">
          <header>
            <div>
              <span>События</span>
              <h3>Воронка сайта</h3>
            </div>
          </header>
          <BarChart data={eventsData} color="#7c5cff" />
        </section>
        <section className="crm-panel">
          <header>
            <div>
              <span>Каналы</span>
              <h3>Источники трафика</h3>
            </div>
          </header>
          <div className="analytics-donuts">
            <DonutChart
              value={
                analytics.filter((event) => event.source === "instagram").length
              }
              total={analytics.length}
              color="#ec4899"
              label="Instagram"
            />
            <DonutChart
              value={
                analytics.filter((event) => event.source === "google").length
              }
              total={analytics.length}
              color="#4f7cff"
              label="Google"
            />
          </div>
        </section>
      </div>
      <div className="dashboard-secondary-grid">
        <section className="crm-panel top-products">
          <header>
            <div>
              <span>Каталог</span>
              <h3>Просмотры и потенциал</h3>
            </div>
          </header>
          {[...products]
            .sort((a, b) => b.views - a.views)
            .slice(0, 6)
            .map((product, index) => (
              <div key={product.id}>
                <b>{index + 1}</b>
                <img src={product.images[0]?.url || "/logo.jpg"} alt="" />
                <span>
                  <strong>{product.name.ru}</strong>
                  <small>
                    {product.views} просмотров ·{" "}
                    {
                      orders.filter((order) =>
                        order.items.some(
                          (item) => item.productId === product.id,
                        ),
                      ).length
                    }{" "}
                    продаж
                  </small>
                  <i>
                    <em
                      style={{
                        width: `${(product.views / maxProductViews) * 100}%`,
                      }}
                    />
                  </i>
                </span>
                <mark
                  className={
                    product.views > 800 &&
                    !orders.some((order) =>
                      order.items.some((item) => item.productId === product.id),
                    )
                      ? "risk"
                      : ""
                  }
                >
                  {product.views > 800 &&
                  !orders.some((order) =>
                    order.items.some((item) => item.productId === product.id),
                  )
                    ? "Слабая конверсия"
                    : "Норма"}
                </mark>
              </div>
            ))}
        </section>
        <section className="crm-panel search-queries">
          <header>
            <div>
              <span>Интерес</span>
              <h3>Поисковые запросы</h3>
            </div>
          </header>
          {Object.entries(searches).length ? (
            Object.entries(searches)
              .sort((a, b) => b[1] - a[1])
              .map(([query, count], index) => (
                <div key={query}>
                  <b>{index + 1}</b>
                  <span>{query}</span>
                  <strong>{count}</strong>
                </div>
              ))
          ) : (
            <CrmEmpty
              title="Запросов пока нет"
              text="Поиск на сайте начнёт собирать события."
            />
          )}
          <header className="secondary">
            <div>
              <span>Команда</span>
              <h3>Продажи менеджеров</h3>
            </div>
          </header>
          {managers.map((manager) => (
            <div key={manager.id}>
              <span>{manager.name}</span>
              <strong>{manager.salesCount}</strong>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

export function NotificationsSection({ role }: { role: "admin" | "manager" }) {
  const session = useAppStore((state) => state.session)!;
  const all = useAppStore((state) => state.notifications);
  const mark = useAppStore((state) => state.markNotificationRead);
  const clear = useAppStore((state) => state.clearNotifications);
  const [filter, setFilter] = useState("all");
  const scoped = all
    .filter((item) => !item.userId || item.userId === session.id)
    .filter(
      (item) =>
        filter === "all" ||
        (filter === "unread" ? !item.isRead : item.type === filter),
    );
  const clearAll = () => {
    if (window.confirm("Вы уверены, что хотите очистить историю уведомлений?"))
      void clear(session.id);
  };
  return (
    <div className="crm-page notifications-section">
      <CrmPageHeader
        title="Уведомления"
        text="События по заявкам, складу, продажам, выплатам и возвратам."
        actions={
          <Button
            variant="ghost"
            icon={<Trash2 size={17} />}
            onClick={clearAll}
          >
            Очистить историю
          </Button>
        }
      />
      <section className="crm-panel notification-filters">
        <button
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          Все
        </button>
        <button
          className={filter === "unread" ? "active" : ""}
          onClick={() => setFilter("unread")}
        >
          Непрочитанные
        </button>
        <button
          className={filter === "lead" ? "active" : ""}
          onClick={() => setFilter("lead")}
        >
          Заявки
        </button>
        <button
          className={filter === "stock" ? "active" : ""}
          onClick={() => setFilter("stock")}
        >
          Склад
        </button>
        <button
          className={filter === "sale" ? "active" : ""}
          onClick={() => setFilter("sale")}
        >
          Продажи
        </button>
      </section>
      <section className="notification-list">
        {scoped
          .slice()
          .reverse()
          .map((notification) => (
            <article
              className={notification.isRead ? "is-read" : ""}
              key={notification.id}
            >
              <span
                className={`notification-icon notification-icon--${notification.type}`}
              >
                {notification.type === "stock" ? (
                  <AlertTriangle size={19} />
                ) : notification.type === "sale" ? (
                  <CircleDollarSign size={19} />
                ) : (
                  <Bell size={19} />
                )}
              </span>
              <div>
                <div>
                  <h3>{notification.title}</h3>
                  {!notification.isRead && <b>Новое</b>}
                </div>
                <p>{notification.message}</p>
                <small>{formatDateTime(notification.createdAt)}</small>
              </div>
              <div className="notification-actions">
                {notification.link && (
                  <Link
                    to={notification.link}
                    onClick={() => mark(notification.id)}
                  >
                    Открыть
                  </Link>
                )}
                <button
                  onClick={() => mark(notification.id)}
                  disabled={notification.isRead}
                >
                  {notification.isRead ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                  <span>
                    {notification.isRead
                      ? "Прочитано"
                      : "Отметить прочитанным"}
                  </span>
                </button>
              </div>
            </article>
          ))}
        {!scoped.length && (
          <CrmEmpty
            title="Уведомлений нет"
            text="Новые события появятся здесь автоматически."
          />
        )}
      </section>
    </div>
  );
}

function FAQEditor({
  faq,
  open,
  onClose,
}: {
  faq: FAQ | null;
  open: boolean;
  onClose: () => void;
}) {
  const faqs = useAppStore((state) => state.faqs);
  const add = useAppStore((state) => state.addFaq);
  const update = useAppStore((state) => state.updateFaq);
  const [draft, setDraft] = useState<FAQ>(
    faq ?? {
      id: createId("faq"),
      question: { ru: "", kg: "", en: "" },
      answer: { ru: "", kg: "", en: "" },
      position: faqs.length,
      status: "published",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  );
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (faq) update(faq.id, draft);
    else add(draft);
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={faq ? "Редактировать вопрос" : "Новый вопрос"}
      size="lg"
    >
      <form className="crm-form faq-editor" onSubmit={submit}>
        {(["ru", "kg", "en"] as Language[]).map((lang) => (
          <div className="faq-language-block" key={lang}>
            <strong>{lang.toUpperCase()}</strong>
            <div className="field">
              <label>Вопрос</label>
              <input
                value={draft.question[lang]}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    question: {
                      ...current.question,
                      [lang]: event.target.value,
                    },
                  }))
                }
                required
              />
            </div>
            <div className="field">
              <label>Ответ</label>
              <textarea
                rows={3}
                value={draft.answer[lang]}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    answer: { ...current.answer, [lang]: event.target.value },
                  }))
                }
                required
              />
            </div>
          </div>
        ))}
        <div className="field">
          <label>Статус</label>
          <select
            value={draft.status}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                status: event.target.value as FAQ["status"],
              }))
            }
          >
            <option value="published">Опубликован</option>
            <option value="hidden">Скрыт</option>
            <option value="draft">Черновик</option>
          </select>
        </div>
        <footer className="modal-form-actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit">Сохранить FAQ</Button>
        </footer>
      </form>
    </Modal>
  );
}

export function FAQManagementSection() {
  const faqs = useAppStore((state) => state.faqs)
    .slice()
    .sort((a, b) => a.position - b.position);
  const update = useAppStore((state) => state.updateFaq);
  const remove = useAppStore((state) => state.deleteFaq);
  const [editing, setEditing] = useState<FAQ | null | "new">(null);
  const move = (faq: FAQ, delta: number) =>
    update(faq.id, { position: Math.max(0, faq.position + delta) });
  return (
    <div className="crm-page faq-management">
      <CrmPageHeader
        title="FAQ"
        text="Вопросы для публичного сайта на русском, кыргызском и английском."
        actions={
          <Button icon={<Plus size={17} />} onClick={() => setEditing("new")}>
            Добавить вопрос
          </Button>
        }
      />
      <section className="crm-panel faq-admin-list">
        {faqs.map((faq, index) => (
          <article key={faq.id}>
            <span className="drag-order">{index + 1}</span>
            <div>
              <h3>{faq.question.ru}</h3>
              <p>{faq.answer.ru}</p>
              <div>
                <span>KG: {faq.question.kg}</span>
                <span>EN: {faq.question.en}</span>
              </div>
            </div>
            <StatusBadge status={faq.status} />
            <div className="faq-admin-actions">
              <button
                onClick={() => move(faq, -1)}
                disabled={index === 0}
                title="Выше"
              >
                ↑
              </button>
              <button
                onClick={() => move(faq, 1)}
                disabled={index === faqs.length - 1}
                title="Ниже"
              >
                ↓
              </button>
              <button
                onClick={() =>
                  update(faq.id, {
                    status: faq.status === "published" ? "hidden" : "published",
                  })
                }
              >
                {faq.status === "published" ? (
                  <EyeOff size={16} />
                ) : (
                  <Eye size={16} />
                )}
              </button>
              <button onClick={() => setEditing(faq)}>
                <Edit3 size={16} />
              </button>
              <button
                className="danger"
                onClick={() =>
                  window.confirm("Удалить вопрос FAQ?") && remove(faq.id)
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          </article>
        ))}
      </section>
      {editing && (
        <FAQEditor
          key={editing === "new" ? "new" : editing.id}
          faq={editing === "new" ? null : editing}
          open
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

export function SettingsSection() {
  const settings = useAppStore((state) => state.settings);
  const save = useAppStore((state) => state.saveSettings);
  const [plans, setPlans] = useState(settings.installmentPlans);
  const [minimum, setMinimum] = useState(settings.installmentMinimum / 100);
  const [explanation, setExplanation] = useState(
    settings.installmentExplanation.ru,
  );
  const submit = (event: FormEvent) => {
    event.preventDefault();
    save({
      installmentPlans: plans,
      installmentMinimum: toMinor(minimum),
      installmentExplanation: {
        ...settings.installmentExplanation,
        ru: explanation,
      },
    });
  };
  return (
    <div className="crm-page settings-section">
      <CrmPageHeader
        title="Настройки"
        text="Параметры магазина, рассрочки, распределения и рабочих процессов."
      />
      <div className="settings-grid">
        <form className="crm-panel settings-card" onSubmit={submit}>
          <header>
            <span>
              <Settings2 size={19} />
            </span>
            <div>
              <h3>Рассрочка</h3>
              <p>Сроки и процент каждого плана</p>
            </div>
          </header>
          <div className="installment-settings-table">
            {plans.map((plan) => (
              <div key={plan.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={plan.enabled}
                    onChange={(event) =>
                      setPlans((items) =>
                        items.map((item) =>
                          item.id === plan.id
                            ? { ...item, enabled: event.target.checked }
                            : item,
                        ),
                      )
                    }
                  />
                  <span>{plan.months} мес.</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={plan.rateBasisPoints / 100}
                  onChange={(event) =>
                    setPlans((items) =>
                      items.map((item) =>
                        item.id === plan.id
                          ? {
                              ...item,
                              rateBasisPoints: Math.round(
                                Number(event.target.value) * 100,
                              ),
                            }
                          : item,
                      ),
                    )
                  }
                />
                <span>%</span>
              </div>
            ))}
          </div>
          <div className="field">
            <label>Минимальная сумма, сом</label>
            <input
              type="number"
              min="0"
              value={minimum}
              onChange={(event) => setMinimum(Number(event.target.value))}
            />
          </div>
          <div className="field">
            <label>Пояснение клиенту</label>
            <textarea
              rows={3}
              value={explanation}
              onChange={(event) => setExplanation(event.target.value)}
            />
          </div>
          <Button type="submit">Сохранить настройки</Button>
        </form>
        <section className="crm-panel settings-card">
          <header>
            <span>
              <Bell size={19} />
            </span>
            <div>
              <h3>Уведомления</h3>
              <p>Какие события показывать команде</p>
            </div>
          </header>
          {[
            "Новая заявка",
            "Низкий остаток",
            "Новая продажа",
            "Возврат или брак",
            "Задолженность",
            "Завершение акции",
          ].map((label) => (
            <label className="settings-toggle" key={label}>
              <span>{label}</span>
              <input type="checkbox" defaultChecked />
            </label>
          ))}
        </section>
        <section className="crm-panel settings-card">
          <header>
            <span>
              <ShieldCheck size={19} />
            </span>
            <div>
              <h3>ИИ и подтверждения</h3>
              <p>Контроль финансовых операций</p>
            </div>
          </header>
          <label className="settings-toggle">
            <span>
              <strong>Автосохранение ИИ</strong>
              <small>Только при полном распознавании</small>
            </span>
            <input
              type="checkbox"
              checked={settings.aiAutoSave}
              onChange={(event) => save({ aiAutoSave: event.target.checked })}
            />
          </label>
          <p className="settings-alert">
            <AlertTriangle size={17} />
            Даже в автоматическом режиме склад и финансы проходят
            бизнес-валидацию.
          </p>
        </section>
      </div>
    </div>
  );
}

export function ProfileSection() {
  const session = useAppStore((state) => state.session)!;
  const updateProfile = useAppStore((state) => state.updateProfile);
  const updateProfileAvatar = useAppStore((state) => state.updateProfileAvatar);
  const showToast = useAppStore((state) => state.showToast);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(session.name);
  const [phone, setPhone] = useState(session.phone);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    updateProfile(name, phone);
    showToast("Профиль обновлён");
  };
  const uploadAvatar = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return showToast("Выберите изображение", "error");
    if (file.size > 1_500_000) return showToast("Файл должен быть меньше 1,5 МБ", "error");
    void updateProfileAvatar(file);
  };
  return (
    <div className="crm-page profile-section">
      <CrmPageHeader
        title="Профиль"
        text="Личные данные и будущие настройки безопасности."
      />
      <div className="profile-layout">
        <section className="crm-panel profile-card">
          <div className="profile-avatar-large">
            {session.avatar ? <img src={session.avatar} alt={`Фото ${session.name}`} /> : session.name
              .split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("")}
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={(event) => uploadAvatar(event.target.files?.[0])} />
            <button
              type="button"
              title="Загрузить фото"
              aria-label="Загрузить фотографию профиля"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} />
            </button>
          </div>
          <h2>{session.name}</h2>
          <p>{session.role === "admin" ? "Управляющий" : "Менеджер"}</p>
          <span className="status-badge status-badge--active">Активен</span>
          <dl>
            <div>
              <dt>Email</dt>
              <dd>{session.email}</dd>
            </div>
            <div>
              <dt>Роль</dt>
              <dd>{session.role}</dd>
            </div>
            <div>
              <dt>ID</dt>
              <dd>{session.id}</dd>
            </div>
          </dl>
        </section>
        <form className="crm-panel crm-form profile-form" onSubmit={submit}>
          <header>
            <h3>Основная информация</h3>
            <p>Изменения сохраняются в защищённом профиле Supabase.</p>
          </header>
          <div className="field">
            <label>Имя и фамилия</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Телефон</label>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Email</label>
            <input value={session.email} disabled />
          </div>
          <Button type="submit">Сохранить профиль</Button>
          <hr />
          <header>
            <h3>Пароль</h3>
            <p>
              После подключения Supabase пароль будет меняться через защищённую
              сессию.
            </p>
          </header>
          <Button
            type="button"
            variant="ghost"
            disabled
          >
            Смена пароля недоступна в mock-режиме
          </Button>
        </form>
      </div>
    </div>
  );
}
