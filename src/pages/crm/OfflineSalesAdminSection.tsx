import { RotateCcw, ShieldAlert, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/crm/CrmUI";
import { SalesSection } from "@/pages/crm/CatalogSections";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/stores/useAppStore";
import { formatDateTime } from "@/utils/date";
import { formatMoney } from "@/utils/money";

export function OfflineSalesAdminSection() {
  const orders = useAppStore((state) => state.orders)
    .filter((order) => order.source === "offline")
    .slice()
    .reverse();
  const showToast = useAppStore((state) => state.showToast);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const remove = async (orderId: string, orderNumber: string | number) => {
    const reason = window.prompt(
      `Почему удалить офлайн-продажу №${orderNumber}?\nНапример: «случайно провёл два раза».`,
      "Ошибочно созданная продажа",
    );
    if (reason === null) return;
    if (!window.confirm(`Точно удалить продажу №${orderNumber}? Склад и финансовые начисления будут автоматически откатаны.`)) return;
    setDeletingId(orderId);
    try {
      const { data, error } = await supabase.functions.invoke("admin-operations", {
        body: { action: "delete_offline_sale", order_id: orderId, reason: reason.trim() || "Ошибочно созданная продажа" },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Не удалось удалить продажу");
      showToast(`Продажа №${orderNumber} удалена. Склад и финансы восстановлены.`);
      window.setTimeout(() => window.location.reload(), 500);
    } catch (cause) {
      showToast(cause instanceof Error ? cause.message : "Не удалось удалить продажу", "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <SalesSection role="admin" source="offline" />
      <section className="crm-panel offline-sale-delete-panel">
        <header className="offline-sale-delete-panel__header">
          <div>
            <span className="offline-sale-delete-panel__icon"><RotateCcw size={20} /></span>
            <div>
              <h3>Исправить ошибочную продажу</h3>
              <p>Удаление здесь безопасно откатывает склад, оплату, комиссию менеджера и долг поставщику.</p>
            </div>
          </div>
          <span className="offline-sale-delete-panel__warning"><ShieldAlert size={16} /> Только управляющий</span>
        </header>
        <div className="offline-sale-delete-list">
          {orders.slice(0, 20).map((order) => (
            <article key={order.id}>
              <div>
                <strong>№{order.number}</strong>
                <span>{formatDateTime(order.createdAt)}</span>
              </div>
              <StatusBadge status={order.status} />
              <strong>{formatMoney(order.total)}</strong>
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 size={15} />}
                disabled={deletingId === order.id}
                onClick={() => void remove(order.id, order.number)}
              >
                {deletingId === order.id ? "Удаляем…" : "Удалить"}
              </Button>
            </article>
          ))}
          {!orders.length && <p className="form-hint">Офлайн-продаж пока нет.</p>}
        </div>
      </section>
    </>
  );
}
