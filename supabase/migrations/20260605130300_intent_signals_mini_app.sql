insert into mini_apps (slug, name, description, category, status)
values (
  'intent-signals',
  'Intent Signals',
  'Detect hiring, news, and tech intent triggers from a domain and generate a ready-to-use outreach angle.',
  'diagnostic',
  'active'
)
on conflict (slug) do nothing;
