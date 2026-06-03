insert into mini_apps (slug, name, description, category, status)
values (
  'ai-overview-tracker',
  'AI Overview Tracker',
  'Track Google AI Overview citations for your keywords — trigger rate, citation rate, and per-keyword breakdown.',
  'visibility',
  'active'
)
on conflict (slug) do nothing;
