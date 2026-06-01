-- AI Share of Voice Scorer — persisted scan payloads for email unlock
create table if not exists public.sov_scans (
  id uuid primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists sov_scans_created_at_idx on public.sov_scans (created_at desc);

alter table public.sov_scans enable row level security;

-- No public policies: only service role (server) may read/write.
