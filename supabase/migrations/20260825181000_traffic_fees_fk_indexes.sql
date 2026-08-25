-- Cover nullable traffic-fee foreign keys used by settlement history lookups.
create index if not exists traffic_fees_settled_by_idx
on public.traffic_fees(settled_by)
where settled_by is not null;

create index if not exists traffic_fees_settlement_expense_idx
on public.traffic_fees(settlement_expense_id)
where settlement_expense_id is not null;
