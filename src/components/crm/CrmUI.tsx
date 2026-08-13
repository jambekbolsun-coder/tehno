import { CircleAlert, Search } from "lucide-react";
import type { ReactNode } from "react";

export function CrmPageHeader({ title, text, actions }: { title: string; text?: string; actions?: ReactNode }) {
  return <header className="crm-page-header"><div><h2>{title}</h2>{text && <p>{text}</p>}</div>{actions && <div>{actions}</div>}</header>;
}

export function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = { new: "Новый заказ", working: "В работе", consulted: "Консультация", confirmed: "Подтверждён", courier_ordered: "Курьер заказан", packed: "Собран", courier_picked_up: "Курьер забрал", courier_in_transit: "Курьер в пути", handed_to_courier: "В доставке", received: "Получен", paid: "Оплачено", installment: "Рассрочка", completed: "Завершён", refused: "Отказ", cancelled: "Отменён", active: "Активен", paused: "Пауза", archived: "Архив", published: "Опубликован", hidden: "Скрыт", draft: "Черновик", accrued: "Начислено" };
  return <span className={`status-badge status-badge--${status}`}>{labels[status] ?? status}</span>;
}

export function CrmEmpty({ title, text }: { title: string; text: string }) {
  return <div className="crm-empty"><CircleAlert size={28}/><h3>{title}</h3><p>{text}</p></div>;
}

export function CrmSearch({ value, onChange, placeholder = "Поиск…" }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="crm-search"><Search size={17}/><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder}/></label>;
}
