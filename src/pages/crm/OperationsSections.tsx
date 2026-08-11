import {
  AlertCircle,
  ArrowRightLeft,
  Bot,
  CheckCircle2,
  ClipboardPaste,
  Eye,
  GripVertical,
  History,
  MessageSquareText,
  Phone,
  Save,
  Search,
  Sparkles,
  UserRound,
  WandSparkles,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  CrmEmpty,
  CrmPageHeader,
  CrmSearch,
  StatusBadge,
} from "@/components/crm/CrmUI";
import { LEAD_STATUSES } from "@/constants/routes";
import { aiParserService } from "@/services/AIParserService";
import { useAppStore } from "@/stores/useAppStore";
import type { AIParsedOrder, Lead, LeadStatus } from "@/types/domain";
import { formatDateTime, nowIso } from "@/utils/date";
import { createId } from "@/utils/id";
import { formatMoney } from "@/utils/money";
import { normalizeKgPhone } from "@/utils/phone";

const statusLabels: Record<LeadStatus, string> = {
  new: "Новая заявка",
  working: "Взято в работу",
  consulted: "Консультация",
  confirmed: "Продажа подтверждена",
  courier_ordered: "Курьер заказан",
  packed: "Товар собран",
  handed_to_courier: "Передан курьеру",
  received: "Клиент получил",
  paid: "Оплачено",
  installment: "Рассрочка",
  completed: "Завершено",
  refused: "Клиент отказался",
  cancelled: "Отменено",
};

const AI_SAMPLE = `№ 2
📦 Заказ: руч пыл
🚛 Адрес: г. Ош, Южный, Прибрежная 46/1
Хамракулова Диёрахон
🧑🏻‍🔧 Менеджер: Акберди
👤 ФИО: Диёрахон Хамракулова
📞 +996 507 276 770
💵 Оплата: 2790 сом`;

export function AISection({ role }: { role: "admin" | "manager" }) {
  const session = useAppStore((state) => state.session)!;
  const products = useAppStore((state) => state.products).filter(
    (product) => product.stock - product.reserved > 0 && !product.isArchived,
  );
  const managers = useAppStore((state) => state.managers);
  const createSale = useAppStore((state) => state.createSale);
  const addAILog = useAppStore((state) => state.addAILog);
  const showToast = useAppStore((state) => state.showToast);
  const aiLogs = useAppStore((state) => state.aiLogs);
  const [raw, setRaw] = useState(AI_SAMPLE);
  const [parsed, setParsed] = useState<AIParsedOrder | null>(null);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [managerId, setManagerId] = useState(
    role === "manager" ? (session.managerProfileId ?? "") : (managers[0]?.id ?? ""),
  );
  const parse = () => setParsed(aiParserService.parse(raw));
  const save = async () => {
    if (!parsed) return;
    try {
      const order = await createSale({
          productId,
          quantity: 1,
          fullName: parsed.fullName ?? "Не указан",
          phone: parsed.phone ?? "+996 000 000 000",
          address: parsed.address ?? "Не указан",
          region: parsed.address?.match(/г\.\s*([^,]+)/i)?.[1] ?? "Уточнить",
          managerId,
          source: "offline",
          paymentMethod: parsed.paymentType?.toLowerCase().includes("расср")
            ? "installment"
            : "cash",
        });
      const now = nowIso();
      addAILog({
        id: createId("ai-log"),
        rawText: raw,
        parsedData: {
          ...parsed,
          missingFields: parsed.missingFields.join(", "),
        },
        status: "confirmed",
        authorUserId: session.id,
        createdAt: now,
        updatedAt: now,
      });
      showToast(`Продажа ${order.number} создана, склад и финансы обновлены`);
      setParsed(null);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Не удалось сохранить",
        "error",
      );
    }
  };
  return (
    <div className="crm-page ai-section">
      <CrmPageHeader
        title="ИИ-помощник"
        text="Превращает неструктурированный текст заказа в проверяемую операцию CRM."
        actions={
          <span className="ai-local-badge">
            <Sparkles size={16} />
            Локальный парсер
          </span>
        }
      />
      <div className="ai-workspace">
        <section className="crm-panel ai-input-panel">
          <header>
            <div>
              <span className="ai-icon">
                <ClipboardPaste size={19} />
              </span>
              <div>
                <h3>Вставьте текст заказа</h3>
                <p>
                  Поддерживаются эмодзи, переносы строк и произвольный порядок.
                </p>
              </div>
            </div>
            <button onClick={() => setRaw(AI_SAMPLE)}>Вставить пример</button>
          </header>
          <textarea
            value={raw}
            onChange={(event) => setRaw(event.target.value)}
            rows={13}
            placeholder="Вставьте сообщение от менеджера…"
          />
          <footer>
            <span>
              <AlertCircle size={15} />
              Данные не сохраняются без подтверждения
            </span>
            <Button onClick={parse} icon={<WandSparkles size={18} />}>
              Распознать
            </Button>
          </footer>
        </section>
        <section className="crm-panel ai-preview-panel">
          <header>
            <div>
              <span className="ai-icon">
                <Bot size={19} />
              </span>
              <div>
                <h3>Предварительный просмотр</h3>
                <p>Проверьте все поля перед записью.</p>
              </div>
            </div>
            {parsed && (
              <span
                className={`confidence confidence--${parsed.confidence >= 80 ? "good" : "warn"}`}
              >
                {parsed.confidence}%
              </span>
            )}
          </header>
          {!parsed ? (
            <div className="ai-empty">
              <Sparkles size={38} />
              <h4>Пока нечего проверять</h4>
              <p>Нажмите «Распознать», и поля заказа появятся здесь.</p>
            </div>
          ) : (
            <div className="ai-fields">
              <div>
                <span>№ заказа</span>
                <strong>{parsed.orderNumber ?? <em>Не найден</em>}</strong>
              </div>
              <div>
                <span>Товар из текста</span>
                <strong>{parsed.productName ?? <em>Не найден</em>}</strong>
              </div>
              <div>
                <span>ФИО</span>
                <strong>{parsed.fullName ?? <em>Не найдено</em>}</strong>
              </div>
              <div>
                <span>Телефон</span>
                <strong>{parsed.phone ?? <em>Не найден</em>}</strong>
              </div>
              <div className="wide">
                <span>Адрес</span>
                <strong>{parsed.address ?? <em>Не найден</em>}</strong>
              </div>
              <div>
                <span>Менеджер из текста</span>
                <strong>{parsed.managerName ?? <em>Не найден</em>}</strong>
              </div>
              <div>
                <span>Сумма</span>
                <strong>
                  {parsed.amount ? (
                    formatMoney(parsed.amount)
                  ) : (
                    <em>Не найдена</em>
                  )}
                </strong>
              </div>
              <label className="wide">
                <span>Сопоставить с товаром *</span>
                <select
                  value={productId}
                  onChange={(event) => setProductId(event.target.value)}
                >
                  {products.map((product) => (
                    <option value={product.id} key={product.id}>
                      {product.name.ru} · {product.stock - product.reserved} шт.
                    </option>
                  ))}
                </select>
              </label>
              <label className="wide">
                <span>Ответственный менеджер *</span>
                <select
                  value={managerId}
                  onChange={(event) => setManagerId(event.target.value)}
                  disabled={role === "manager"}
                >
                  {managers
                    .filter(
                      (manager) =>
                        role === "admin" ||
                        manager.id === session.managerProfileId,
                    )
                    .map((manager) => (
                      <option value={manager.id} key={manager.id}>
                        {manager.name}
                      </option>
                    ))}
                </select>
              </label>
              {parsed.missingFields.length > 0 && (
                <div className="ai-missing wide">
                  <AlertCircle size={17} />
                  <span>
                    Проверьте недостающие поля:{" "}
                    {parsed.missingFields.join(", ")}
                  </span>
                </div>
              )}
              <Button
                className="wide"
                block
                onClick={save}
                icon={<Save size={18} />}
                disabled={!productId || !managerId}
              >
                Подтвердить и провести продажу
              </Button>
            </div>
          )}
        </section>
      </div>
      <section className="crm-panel ai-history">
        <header>
          <div>
            <span>История</span>
            <h3>Последние импорты</h3>
          </div>
        </header>
        {aiLogs.length ? (
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Заказ</th>
                  <th>Статус</th>
                  <th>Автор</th>
                </tr>
              </thead>
              <tbody>
                {aiLogs
                  .slice(-8)
                  .reverse()
                  .map((log) => (
                    <tr key={log.id}>
                      <td>{formatDateTime(log.createdAt)}</td>
                      <td>{log.relatedOrderId ?? "—"}</td>
                      <td>
                        <StatusBadge status={log.status} />
                      </td>
                      <td>{log.authorUserId}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <CrmEmpty
            title="Импортов пока нет"
            text="После подтверждения первая операция появится здесь."
          />
        )}
      </section>
    </div>
  );
}

function ManualLeadEditor({ open, onClose, role }: { open: boolean; onClose: () => void; role: "admin" | "manager" }) {
  const session = useAppStore((state) => state.session)!;
  const products = useAppStore((state) => state.products).filter((product) => product.isVisible && !product.isArchived);
  const createLead = useAppStore((state) => state.createLead);
  const reassignLead = useAppStore((state) => state.reassignLead);
  const showToast = useAppStore((state) => state.showToast);
  const [draft, setDraft] = useState({ fullName: "", phone: "+996 ", address: "", region: "Бишкек", productId: products[0]?.id ?? "", quantity: 1, comment: "" });
  const setField = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const product = products.find((item) => item.id === draft.productId);
    if (!product) return showToast("Выберите товар", "error");
    try {
      const lead = await createLead({
        fullName: draft.fullName.trim(),
        phone: normalizeKgPhone(draft.phone),
        address: draft.address.trim(),
        region: draft.region.trim(),
        items: [{ productId: product.id, productName: product.name.ru, quantity: draft.quantity, unitPrice: product.salePrice }],
        purchaseMethod: "full",
        comment: draft.comment,
        source: "store",
      });
      if (role === "manager" && session.managerProfileId && lead.managerId !== session.managerProfileId) await reassignLead(lead.id, session.managerProfileId);
      showToast(`Заявка ${lead.number} создана`);
      onClose();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Не удалось создать заявку", "error");
    }
  };
  return <Modal open={open} onClose={onClose} title="Новая заявка" size="md"><form className="crm-form" onSubmit={submit}><div className="field"><label htmlFor="lead-name">ФИО</label><input id="lead-name" value={draft.fullName} onChange={(event) => setField("fullName", event.target.value)} required autoFocus/></div><div className="field"><label htmlFor="lead-phone">Телефон</label><input id="lead-phone" value={draft.phone} onChange={(event) => setField("phone", event.target.value)} required/></div><div className="field"><label htmlFor="lead-address">Адрес</label><input id="lead-address" value={draft.address} onChange={(event) => setField("address", event.target.value)} required/></div><div className="field"><label htmlFor="lead-region">Регион</label><input id="lead-region" value={draft.region} onChange={(event) => setField("region", event.target.value)} required/></div><div className="field"><label htmlFor="lead-product">Товар</label><select id="lead-product" value={draft.productId} onChange={(event) => setField("productId", event.target.value)}>{products.map((product) => <option value={product.id} key={product.id}>{product.name.ru} · {formatMoney(product.salePrice)}</option>)}</select></div><div className="field"><label htmlFor="lead-quantity">Количество</label><input id="lead-quantity" type="number" min="1" value={draft.quantity} onChange={(event) => setField("quantity", Number(event.target.value))} required/></div><div className="field"><label htmlFor="lead-comment">Комментарий</label><textarea id="lead-comment" rows={3} value={draft.comment} onChange={(event) => setField("comment", event.target.value)}/></div><footer className="modal-form-actions"><Button type="button" variant="ghost" onClick={onClose}>Отмена</Button><Button type="submit">Создать заявку</Button></footer></form></Modal>;
}

export function LeadsSection({ role }: { role: "admin" | "manager" }) {
  const session = useAppStore((state) => state.session)!;
  const allLeads = useAppStore((state) => state.leads);
  const managers = useAppStore((state) => state.managers);
  const products = useAppStore((state) => state.products);
  const changeStatus = useAppStore((state) => state.changeLeadStatus);
  const reassign = useAppStore((state) => state.reassignLead);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const leads = useMemo(() => {
    const scoped =
      role === "admin"
        ? allLeads
        : allLeads.filter(
            (lead) => lead.managerId === session.managerProfileId,
          );
    const q = query.toLowerCase();
    return scoped
      .filter(
        (lead) =>
          (status === "all" || lead.status === status) &&
          [
            lead.number,
            lead.fullName,
            lead.phone,
            lead.source,
            lead.items.map((item) => item.productName).join(" "),
            managers.find((manager) => manager.id === lead.managerId)?.name ??
              "",
          ].some((value) => value.toLowerCase().includes(q)),
      )
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [allLeads, role, session.managerProfileId, query, status, managers]);
  return (
    <div className="crm-page leads-section">
      <CrmPageHeader
        title={role === "admin" ? "Заявки и клиенты" : "Мои заявки"}
        text={
          role === "admin"
            ? "Все обращения с сайта, WhatsApp, Instagram и магазина."
            : "Только заявки, назначенные на ваш профиль."
        }
        actions={
          <Button variant="secondary" icon={<MessageSquareText size={17} />} onClick={() => setEditorOpen(true)}>
            Новая заявка
          </Button>
        }
      />
      <ManualLeadEditor open={editorOpen} onClose={() => setEditorOpen(false)} role={role} />
      <section className="crm-panel leads-toolbar">
        <CrmSearch
          value={query}
          onChange={setQuery}
          placeholder="ФИО, телефон, № заказа, товар, менеджер…"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="all">Все статусы</option>
          {LEAD_STATUSES.map((item) => (
            <option value={item} key={item}>
              {statusLabels[item]}
            </option>
          ))}
        </select>
        <span>
          Найдено: <strong>{leads.length}</strong>
        </span>
      </section>
      <section className="crm-panel table-panel leads-table">
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Заявка</th>
                <th>Клиент</th>
                <th>Товары</th>
                <th>Сумма</th>
                <th>Источник</th>
                <th>Менеджер</th>
                <th>Статус</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <strong>{lead.number}</strong>
                    <small>{formatDateTime(lead.createdAt)}</small>
                  </td>
                  <td>
                    <span>{lead.fullName}</span>
                    <small>{lead.phone}</small>
                  </td>
                  <td>
                    <span>{lead.items[0]?.productName}</span>
                    <small>
                      {lead.items.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                      шт.
                    </small>
                  </td>
                  <td>
                    <strong>{formatMoney(lead.total)}</strong>
                  </td>
                  <td>
                    <span
                      className={`source-badge source-badge--${lead.source}`}
                    >
                      {lead.source}
                    </span>
                  </td>
                  <td>
                    {role === "admin" ? (
                      <select
                        value={lead.managerId}
                        onChange={(event) =>
                          reassign(lead.id, event.target.value)
                        }
                      >
                        {managers
                          .filter((manager) => manager.status !== "archived")
                          .map((manager) => (
                            <option key={manager.id} value={manager.id}>
                              {manager.name}
                            </option>
                          ))}
                      </select>
                    ) : (
                      managers.find((manager) => manager.id === lead.managerId)
                        ?.name
                    )}
                  </td>
                  <td>
                    <select
                      className={`status-select status-select--${lead.status}`}
                      value={lead.status}
                      onChange={(event) =>
                        changeStatus(lead.id, event.target.value as LeadStatus)
                      }
                    >
                      {LEAD_STATUSES.map((item) => (
                        <option value={item} key={item}>
                          {statusLabels[item]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      className="table-action"
                      onClick={() => setSelected(lead)}
                      aria-label="Открыть заявку"
                    >
                      <Eye size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!leads.length && (
          <CrmEmpty
            title="Заявки не найдены"
            text="Измените поиск или фильтр статуса."
          />
        )}
      </section>
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Заявка ${selected.number}` : "Заявка"}
        size="lg"
      >
        {selected && (
          <div className="lead-detail">
            <div className="lead-detail__hero">
              <span className="avatar-large">
                {selected.fullName
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <div>
                <h3>{selected.fullName}</h3>
                <a href={`tel:${selected.phone}`}>
                  <Phone size={15} />
                  {selected.phone}
                </a>
                <p>
                  {selected.address}, {selected.region}
                </p>
              </div>
              <StatusBadge status={selected.status} />
            </div>
            <div className="lead-detail-grid">
              <section>
                <h4>Товары</h4>
                {selected.items.map((item) => {
                  const product = products.find(
                    (entry) => entry.id === item.productId,
                  );
                  return (
                    <div className="lead-product" key={item.productId}>
                      {product && <img src={product.images[0].url} alt="" />}
                      <span>
                        <strong>{item.productName}</strong>
                        <small>
                          {item.quantity} × {formatMoney(item.unitPrice)}
                        </small>
                      </span>
                      <b>{formatMoney(item.unitPrice * item.quantity)}</b>
                    </div>
                  );
                })}
                <footer>
                  <span>Итого</span>
                  <strong>{formatMoney(selected.total)}</strong>
                </footer>
              </section>
              <section>
                <h4>Данные заявки</h4>
                <dl>
                  <div>
                    <dt>Источник</dt>
                    <dd>{selected.source}</dd>
                  </div>
                  <div>
                    <dt>Оплата</dt>
                    <dd>
                      {selected.purchaseMethod === "installment"
                        ? "Рассрочка"
                        : "Обычная"}
                    </dd>
                  </div>
                  <div>
                    <dt>Менеджер</dt>
                    <dd>
                      {
                        managers.find(
                          (manager) => manager.id === selected.managerId,
                        )?.name
                      }
                    </dd>
                  </div>
                  <div>
                    <dt>Комментарий</dt>
                    <dd>{selected.comment || "—"}</dd>
                  </div>
                </dl>
              </section>
            </div>
            <section className="lead-history">
              <h4>
                <History size={17} />
                История изменений
              </h4>
              {selected.statusHistory
                .slice()
                .reverse()
                .map((item) => (
                  <div key={item.id}>
                    <span />
                    <div>
                      <strong>
                        {item.fromStatus
                          ? `${statusLabels[item.fromStatus]} → `
                          : ""}
                        {statusLabels[item.toStatus]}
                      </strong>
                      <small>
                        {formatDateTime(item.changedAt)} · {item.comment}
                      </small>
                    </div>
                  </div>
                ))}
            </section>
          </div>
        )}
      </Modal>
    </div>
  );
}

export function FunnelSection({ role }: { role: "admin" | "manager" }) {
  const session = useAppStore((state) => state.session)!;
  const allLeads = useAppStore((state) => state.leads);
  const changeStatus = useAppStore((state) => state.changeLeadStatus);
  const managers = useAppStore((state) => state.managers);
  const [dragged, setDragged] = useState<string | null>(null);
  const leads =
    role === "admin"
      ? allLeads
      : allLeads.filter((lead) => lead.managerId === session.managerProfileId);
  const drop = (status: LeadStatus) => {
    if (dragged) changeStatus(dragged, status, "Перемещено на Kanban-доске");
    setDragged(null);
  };
  return (
    <div className="crm-page funnel-section">
      <CrmPageHeader
        title={role === "admin" ? "Воронка продаж и доставки" : "Моя воронка"}
        text="Перетаскивайте карточки между этапами. Каждое изменение сохраняется в истории."
        actions={
          <span className="kanban-hint">
            <GripVertical size={16} />
            Drag & drop
          </span>
        }
      />
      <div className="kanban-board">
        {LEAD_STATUSES.map((status, index) => {
          const cards = leads.filter((lead) => lead.status === status);
          return (
            <section
              className={`kanban-column kanban-column--${status}`}
              key={status}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => drop(status)}
            >
              <header>
                <span>{index + 1}</span>
                <strong>{statusLabels[status]}</strong>
                <b>{cards.length}</b>
              </header>
              <div className="kanban-column__body">
                {cards.map((lead) => (
                  <article
                    key={lead.id}
                    draggable
                    onDragStart={() => setDragged(lead.id)}
                    onDragEnd={() => setDragged(null)}
                    className={dragged === lead.id ? "is-dragging" : ""}
                  >
                    <div className="kanban-card__top">
                      <span>{lead.number}</span>
                      <GripVertical size={16} />
                    </div>
                    <h4>{lead.fullName}</h4>
                    <p>{lead.items[0]?.productName}</p>
                    <strong>{formatMoney(lead.total)}</strong>
                    <footer>
                      <span className="avatar-mini">
                        {managers
                          .find((manager) => manager.id === lead.managerId)
                          ?.name.split(" ")
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join("")}
                      </span>
                      <small>{formatDateTime(lead.updatedAt)}</small>
                    </footer>
                  </article>
                ))}
                {!cards.length && (
                  <div className="kanban-empty">Перетащите сюда</div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
