insert into mini_apps (slug, name, description, category, status)
values (
  'campaign-ideation',
  'Campaign Ideation',
  'Generate campaign positioning and 7 channel-ready campaign ideas from your product context.',
  'strategy',
  'active'
)
on conflict (slug) do nothing;
