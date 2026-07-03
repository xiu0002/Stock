create extension if not exists "pgcrypto";

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  trade_date date not null,
  ticker text not null,
  action text not null check (action in ('買進', '賣出')),
  shares numeric not null check (shares > 0),
  price numeric not null check (price >= 0),
  fee numeric not null default 0 check (fee >= 0),
  tax numeric not null default 0 check (tax >= 0),
  created_at timestamptz not null default now()
);

create index if not exists trades_trade_date_idx on public.trades (trade_date desc);
create index if not exists trades_ticker_idx on public.trades (ticker);

alter table public.trades enable row level security;

create policy "Allow anonymous read trades"
on public.trades
for select
to anon
using (true);

create policy "Allow anonymous insert trades"
on public.trades
for insert
to anon
with check (true);

create policy "Allow anonymous update trades"
on public.trades
for update
to anon
using (true)
with check (true);

create policy "Allow anonymous delete trades"
on public.trades
for delete
to anon
using (true);
