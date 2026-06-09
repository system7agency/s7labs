insert into mini_apps (slug, name, description, category, status)
values (
  'roi-calculator',
  'ROI Calculator',
  'Estimate pipeline value, expected revenue, and campaign ROI.',
  'strategy',
  'active'
)
on conflict (slug) do nothing;
