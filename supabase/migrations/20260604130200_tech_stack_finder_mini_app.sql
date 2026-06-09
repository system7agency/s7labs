insert into mini_apps (slug, name, description, category, status)
values (
  'tech-stack-finder',
  'Tech Stack Finder',
  'Detect the technologies a domain uses across normalized categories with confidence hints.',
  'finder',
  'active'
)
on conflict (slug) do nothing;
