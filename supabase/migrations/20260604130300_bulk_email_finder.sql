insert into mini_apps (slug, name, description, category, status)
values (
  'bulk-email-finder',
  'Bulk Email Finder',
  'Upload a CSV and enrich business emails in bulk.',
  'email',
  'active'
)
on conflict (slug) do nothing;

create table if not exists public.bulk_email_jobs (
  id uuid primary key,
  status text not null check (status in ('processing', 'completed', 'failed')),
  total int not null check (total >= 0),
  completed int not null default 0 check (completed >= 0),
  results jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists bulk_email_jobs_status_created_at_idx
  on public.bulk_email_jobs (status, created_at desc);

create index if not exists bulk_email_jobs_created_at_idx
  on public.bulk_email_jobs (created_at desc);

alter table public.bulk_email_jobs enable row level security;
