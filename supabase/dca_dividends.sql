create extension if not exists "pgcrypto";

create table if not exists public.dca_records (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  ticker text not null,
  amount numeric not null check (amount >= 0),
  shares numeric not null check (shares > 0),
  created_at timestamptz not null default now()
);

create index if not exists dca_records_date_idx on public.dca_records (date desc);
create index if not exists dca_records_ticker_idx on public.dca_records (ticker);

alter table public.dca_records enable row level security;

create policy "Allow anonymous read dca records"
on public.dca_records
for select
to anon
using (true);

create policy "Allow anonymous insert dca records"
on public.dca_records
for insert
to anon
with check (true);

create policy "Allow anonymous update dca records"
on public.dca_records
for update
to anon
using (true)
with check (true);

create policy "Allow anonymous delete dca records"
on public.dca_records
for delete
to anon
using (true);

create table if not exists public.dividends (
  id uuid primary key default gen_random_uuid(),
  ex_dividend_date date not null,
  ticker text not null,
  shares_owned numeric not null check (shares_owned > 0),
  dividend_per_share numeric not null check (dividend_per_share >= 0),
  tax_withheld numeric not null default 0 check (tax_withheld >= 0),
  net_amount numeric not null check (net_amount >= 0),
  created_at timestamptz not null default now()
);

create index if not exists dividends_ex_dividend_date_idx on public.dividends (ex_dividend_date desc);
create index if not exists dividends_ticker_idx on public.dividends (ticker);

alter table public.dividends enable row level security;

create policy "Allow anonymous read dividends"
on public.dividends
for select
to anon
using (true);

create policy "Allow anonymous insert dividends"
on public.dividends
for insert
to anon
with check (true);

create policy "Allow anonymous update dividends"
on public.dividends
for update
to anon
using (true)
with check (true);

create policy "Allow anonymous delete dividends"
on public.dividends
for delete
to anon
using (true);
