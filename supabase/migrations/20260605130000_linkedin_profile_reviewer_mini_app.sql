insert into mini_apps (slug, name, description, category, status)
values (
  'linkedin-profile-reviewer',
  'LinkedIn Profile Reviewer',
  'Review LinkedIn profiles with section scores and ranked actions.',
  'linkedin',
  'active'
)
on conflict (slug) do nothing;
