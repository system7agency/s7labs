-- Agentic Readiness Checker — persisted scan payloads for email unlock
create table if not exists public.agentic_scans (
  id uuid primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists agentic_scans_created_at_idx on public.agentic_scans (created_at desc);

alter table public.agentic_scans enable row level security;
