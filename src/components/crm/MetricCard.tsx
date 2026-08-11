import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function MetricCard({ label, value, helper, trend, icon: Icon, accent = "blue", footer }: { label: string; value: string; helper?: string; trend?: number; icon: LucideIcon; accent?: string; footer?: ReactNode }) {
  return <article className={`metric-card metric-card--${accent}`}><div className="metric-card__top"><span><Icon size={20}/></span>{typeof trend === "number" && <b className={trend >= 0 ? "positive" : "negative"}>{trend >= 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>} {Math.abs(trend)}%</b>}</div><small>{label}</small><strong>{value}</strong>{helper && <p>{helper}</p>}{footer && <footer>{footer}</footer>}</article>;
}
