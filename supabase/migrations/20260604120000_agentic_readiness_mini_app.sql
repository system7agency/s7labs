insert into mini_apps (slug, name, description, category, status)
values (
  'agentic-readiness',
  'Agentic Readiness Checker',
  'Score how ready your site is for AI agents — blockers free, full checklist and fix plan by email.',
  'visibility',
  'active'
)
on conflict (slug) do nothing;
