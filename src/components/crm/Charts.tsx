export function BarChart({ data, color = "#4f7cff", labels = true }: { data: Array<{ label: string; value: number }>; color?: string; labels?: boolean }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  return <div className="bar-chart" role="img" aria-label="Столбчатый график">{data.map((item) => <div key={item.label} className="bar-chart__item"><div className="bar-chart__track"><i style={{ height: `${Math.max(6, (item.value / max) * 100)}%`, background: color }}><span>{item.value}</span></i></div>{labels && <small>{item.label}</small>}</div>)}</div>;
}

export function DonutChart({ value, total, color = "#5b6df8", label }: { value: number; total: number; color?: string; label: string }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  return <div className="donut-chart" style={{ background: `conic-gradient(${color} ${percentage}%, var(--crm-border) 0)` }} role="img" aria-label={`${label}: ${percentage}%`}><div><strong>{percentage}%</strong><span>{label}</span></div></div>;
}
