insert into mini_apps (slug, name, description, category, status)
values (
  'ai-visibility-score',
  'AI Visibility Score',
  'A single 0-100 score for how visible your brand is to AI: presence, citations, entity clarity, and drift.',
  'visibility',
  'active'
)
on conflict (slug) do nothing;
