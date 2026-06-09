insert into mini_apps (slug, name, description, category, status)
values (
  'gtm-flywheel',
  'GTM Flywheel',
  'Map and share your go-to-market compounding loop.',
  'strategy',
  'active'
)
on conflict (slug) do nothing;
