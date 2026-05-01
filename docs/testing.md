# Testing Strategy

## Tools
- Vitest for unit tests
- React Testing Library for component tests
- Playwright for E2E tests
- MSW for mocking external APIs

## What to test
- ALL business logic functions (utils, validators, transformers)
- Server Actions (mock supabase, test happy + error paths)
- Critical user flows via E2E (landing page navigation, route clicks)

## What NOT to test
- Trivial getters/setters
- Third-party library internals
- Tailwind class application

## Coverage target
- Business logic: 80%+
- Components: smoke tests at minimum
- E2E: every critical flow

## Conventions
- Unit tests next to source: `format-date.ts` + `format-date.test.ts`
- E2E tests in `/tests/e2e/`
- Mocks in `/tests/mocks/`
- Use `describe` blocks per function/component
- Test names start with "should": "should format date in ISO 8601"
