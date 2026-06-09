insert into mini_apps (slug, name, description, category, status)
values (
  'email-copy-optimizer',
  'Email Copy Optimizer',
  'Diagnose weak outbound emails and generate three improved variations in seconds.',
  'email',
  'active'
)
on conflict (slug) do nothing;
