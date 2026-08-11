import { AlertTriangle, ArrowRight, BadgeDollarSign, Bell, Boxes, ClipboardList, CircleDollarSign, PackageCheck, ReceiptText, ShoppingCart, TrendingUp, UsersRound, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart, DonutChart } from "@/components/crm/Charts";
import { CrmPageHeader, StatusBadge } from "@/components/crm/CrmUI";
import { MetricCard } from "@/components/crm/MetricCard";
import { financeService } from "@/services/FinanceService";
import { useAppStore } from "@/stores/useAppStore";
import { formatDateTime } from "@/utils/date";
import { formatMoney } from "@/utils/money";

export function DashboardSection({ role }: { role: "admin" | "manager" }) {
  const [period, setPeriod] = useState("month");
  const session = useAppStore((state) => state.session)!;
  const allLeads = useAppStore((state) => state.leads);
  const allOrders = useAppStore((state) => state.orders);
  const products = useAppStore((state) => state.products);
  const managers = useAppStore((state) => state.managers);
  const notifications = useAppStore((state) => state.notifications);
  const managerId = session.managerProfileId;
  const leads = role === "admin" ? allLeads : allLeads.filter((lead) => lead.managerId === managerId);
  const orders = role === "admin" ? allOrders : allOrders.filter((order) => order.managerId === managerId);
  const summary = financeService.summary();
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const commission = role === "manager" ? useAppStore.getState().managerCommissions.filter((item) => item.managerId === managerId).reduce((sum, item) => sum + item.amount, 0) : 0;
  const newLeads = leads.filter((lead) => lead.status === "new").length;
  const completed = leads.filter((lead) => lead.status === "completed").length;
  const conversion = leads.length ? Math.round((completed / leads.length) * 100) : 0;
  const lowStock = products.filter((product) => product.stock - product.reserved <= product.minimumStock);
  const salesData = [{ label: "Пн", value: 4 }, { label: "Вт", value: 7 }, { label: "Ср", value: 5 }, { label: "Чт", value: 11 }, { label: "Пт", value: 9 }, { label: "Сб", value: 13 }, { label: "Вс", value: 8 }];
  const topProducts = [...products].sort((a, b) => b.views - a.views).slice(0, 5);
  const managerStats = useMemo(() => managers.map((manager) => ({ ...manager, conversion: manager.leadCount ? Math.round((manager.salesCount / manager.leadCount) * 100) : 0 })).sort((a, b) => b.salesCount - a.salesCount), [managers]);
  const rolePath = role === "admin" ? "admin" : "manager";
  return (
    <div className="crm-page dashboard-section">
      <CrmPageHeader title={role === "admin" ? `Добрый день, ${session.name.split(" ")[0]}!` : `Ваш рабочий день, ${session.name.split(" ")[0]}`} text={role === "admin" ? "Ключевые показатели магазина и задачи, требующие внимания." : "Заявки, продажи и начисления только по вашему профилю."} actions={<select className="crm-period-select" value={period} onChange={(event) => setPeriod(event.target.value)}><option value="today">Сегодня</option><option value="week">7 дней</option><option value="month">30 дней</option><option value="quarter">Квартал</option></select>}/>
      {role === "admin" ? <div className="metrics-grid"><MetricCard label="Новые заявки" value={String(newLeads)} helper={`${leads.filter((lead) => lead.status === "working").length} уже в работе`} trend={12} icon={ClipboardList} accent="blue"/><MetricCard label="Продажи за месяц" value={formatMoney(summary.revenue)} helper={`${orders.length} оформленных продаж`} trend={8} icon={ShoppingCart} accent="green"/><MetricCard label="Чистая прибыль" value={formatMoney(summary.accrualProfit)} helper="По начислению" trend={5} icon={TrendingUp} accent="violet"/><MetricCard label="Расходы" value={formatMoney(summary.expenses)} helper="Без двойного учёта" trend={-3} icon={ReceiptText} accent="orange"/><MetricCard label="На складе" value={`${products.reduce((sum, product) => sum + product.stock, 0)} шт.`} helper={`${lowStock.length} позиций требуют внимания`} icon={Boxes} accent="cyan"/><MetricCard label="Долги поставщикам" value={formatMoney(summary.supplierDebt)} helper="За проданные товары" icon={Wallet} accent="red"/></div> : <div className="metrics-grid metrics-grid--manager"><MetricCard label="Мои новые заявки" value={String(newLeads)} helper={`${leads.length} всего назначено`} icon={ClipboardList} accent="blue"/><MetricCard label="Мои продажи" value={formatMoney(revenue)} helper={`${orders.length} продаж`} trend={9} icon={ShoppingCart} accent="green"/><MetricCard label="Конверсия" value={`${conversion}%`} helper={`${completed} завершённых заявок`} icon={TrendingUp} accent="violet"/><MetricCard label="Мои начисления" value={formatMoney(commission)} helper="До учёта выплат" icon={BadgeDollarSign} accent="orange"/></div>}

      <div className="dashboard-main-grid">
        <section className="crm-panel sales-chart-panel"><header><div><span>Продажи</span><h3>Динамика за неделю</h3></div><b>+8,4%</b></header><BarChart data={salesData} color="#4f7cff"/><footer><div><span className="legend-dot legend-dot--blue"/>Продажи</div><strong>{orders.length} заказов</strong></footer></section>
        <section className="crm-panel conversion-panel"><header><div><span>Воронка</span><h3>Конверсия заявок</h3></div></header><div className="conversion-body"><DonutChart value={completed} total={Math.max(leads.length, 1)} label="в продажу"/><dl><div><dt>Всего заявок</dt><dd>{leads.length}</dd></div><div><dt>В работе</dt><dd>{leads.filter((lead) => ["working", "consulted", "confirmed"].includes(lead.status)).length}</dd></div><div><dt>Завершено</dt><dd>{completed}</dd></div><div><dt>Отказ</dt><dd>{leads.filter((lead) => lead.status === "refused").length}</dd></div></dl></div><Link to={`/crm/${rolePath}/funnel`}>Открыть воронку <ArrowRight size={16}/></Link></section>
      </div>

      <div className="dashboard-secondary-grid">
        <section className="crm-panel table-panel"><header><div><span>Последние</span><h3>Новые заявки</h3></div><Link to={`/crm/${rolePath}/leads`}>Все заявки <ArrowRight size={15}/></Link></header><div className="responsive-table"><table><thead><tr><th>Заявка</th><th>Клиент</th><th>Сумма</th><th>Статус</th><th>Дата</th></tr></thead><tbody>{leads.slice(-5).reverse().map((lead) => <tr key={lead.id}><td><strong>{lead.number}</strong></td><td><span>{lead.fullName}</span><small>{lead.phone}</small></td><td>{formatMoney(lead.total)}</td><td><StatusBadge status={lead.status}/></td><td>{formatDateTime(lead.createdAt)}</td></tr>)}</tbody></table></div></section>
        <section className="crm-panel attention-panel"><header><div><span>Контроль</span><h3>Требует внимания</h3></div></header><div className="attention-list"><Link to={`/crm/${rolePath}/${role === "admin" ? "inventory" : "catalog"}`}><span className="attention-icon attention-icon--orange"><AlertTriangle size={18}/></span><div><strong>Низкий остаток</strong><small>{lowStock.length} товаров достигли минимума</small></div><ArrowRight size={16}/></Link><Link to={`/crm/${rolePath}/leads`}><span className="attention-icon attention-icon--blue"><ClipboardList size={18}/></span><div><strong>Необработанные заявки</strong><small>{newLeads} клиентов ждут ответа</small></div><ArrowRight size={16}/></Link>{role === "admin" && <Link to="/crm/admin/finance"><span className="attention-icon attention-icon--violet"><CircleDollarSign size={18}/></span><div><strong>Задолженности</strong><small>{formatMoney(summary.supplierDebt + summary.managerDebt)}</small></div><ArrowRight size={16}/></Link>}<Link to={`/crm/${rolePath}/notifications`}><span className="attention-icon attention-icon--red"><Bell size={18}/></span><div><strong>Непрочитанные</strong><small>{notifications.filter((item) => !item.isRead).length} уведомлений</small></div><ArrowRight size={16}/></Link></div></section>
      </div>

      {role === "admin" && <div className="dashboard-secondary-grid"><section className="crm-panel table-panel"><header><div><span>Команда</span><h3>Эффективность менеджеров</h3></div><Link to="/crm/admin/managers">Подробнее <ArrowRight size={15}/></Link></header><div className="manager-ranking">{managerStats.slice(0, 5).map((manager, index) => <div key={manager.id}><b>{index + 1}</b><span className="avatar-mini">{manager.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><div><strong>{manager.name}</strong><small>{manager.salesCount} продаж</small></div><span className="manager-bar"><i style={{ width: `${Math.min(100, manager.conversion * 2)}%` }}/></span><em>{manager.conversion}%</em></div>)}</div></section><section className="crm-panel top-products"><header><div><span>Каталог</span><h3>Самые просматриваемые</h3></div><Link to="/crm/admin/analytics">Аналитика <ArrowRight size={15}/></Link></header>{topProducts.map((product, index) => <div key={product.id}><b>{index + 1}</b><img src={product.images[0].url} alt=""/><span><strong>{product.name.ru}</strong><small>{product.views.toLocaleString()} просмотров</small></span><em>{product.stock} шт.</em></div>)}</section></div>}
    </div>
  );
}
