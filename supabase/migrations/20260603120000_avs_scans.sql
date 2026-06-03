create table if not exists public.avs_scans (
  id uuid primary key,
  domain text not null,
  avs int not null,
  sub_scores jsonb not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists avs_scans_domain_created_at_idx on public.avs_scans (domain, created_at desc);
create index if not exists avs_scans_created_at_idx on public.avs_scans (created_at desc);

alter table public.avs_scans enable row level security;
