create table if not exists public.aio_scans (
  id uuid primary key,
  domain text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists aio_scans_created_at_idx on public.aio_scans (created_at desc);
create index if not exists aio_scans_domain_created_at_idx on public.aio_scans (domain, created_at desc);

alter table public.aio_scans enable row level security;
