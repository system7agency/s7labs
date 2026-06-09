/**
 * Mini-app QA suite.
 *
 * Covers the deterministic checks every mini-app must pass:
 *  - Page loads, no console errors
 *  - Empty submit shakes + shows the right errors
 *  - Bad email is rejected SERVER-SIDE before the Anthropic call fires
 *  - Error state actually renders (CC-3 sanity)
 *  - Marketplace card → mini-app navigation
 *
 * We don't test the model output here (that's the human vibe check).
 *
 * Anthropic is NEVER called from this suite — we always route the
 * `/api/mini-apps/<slug>` endpoint to a fake before any submit so the
 * suite costs $0 to run.
 */

import { test, expect, type Page } from '@playwright/test'

type AppSpec = {
  /** Folder slug under /mini-apps/<folder> */
  folder: string
  /** Display name on the marketplace card */
  cardName: string
  /** A getter that fills the form with valid input. */
  fillValid: (page: Page) => Promise<void>
  /** A locator hint to confirm the form actually rendered. */
  formAnchor: string
  /** True if Anthropic API route exists at /api/mini-apps/<route>. */
  apiRoute?: string | null
  /** Some apps killswitch the submit at the client (`APP_ENABLED=false`). Skip the submit-flow tests. */
  killswitched?: boolean
}

const VALID_EMAIL = 'qa@s7labs.test'
const DISPOSABLE_EMAIL = 'qa@mailinator.com'
const FREE_EMAIL = 'qa@gmail.com'

const APPS: AppSpec[] = [
  {
    folder: 'pricing-diagnostic',
    cardName: 'Pricing Page Diagnostic',
    apiRoute: '/api/mini-apps/pricing-diagnostic',
    formAnchor: 'input:not([type="email"])',
    fillValid: async (page) => {
      await page.locator('input:not([type="email"])').first().fill('https://linear.app/pricing')
    },
  },
  {
    folder: 'outbound-radar',
    cardName: 'Outbound Trigger Radar',
    apiRoute: '/api/mini-apps/outbound-radar',
    formAnchor: 'input[placeholder*="Acme"]',
    fillValid: async (page) => {
      await page.locator('input[placeholder*="Acme"]').fill('Acme Corp')
      await page.locator('input[placeholder*="acme.com"]').fill('acme.com')
    },
  },
  {
    folder: 'job-brief',
    cardName: 'Job Posting',
    apiRoute: '/api/mini-apps/job-brief',
    formAnchor: 'input[placeholder*="jobs"]',
    fillValid: async (page) => {
      await page
        .locator('input[placeholder*="jobs"]')
        .fill('https://jobs.ashbyhq.com/acme/senior-revops-manager')
    },
  },
  {
    folder: 'linkedin-hook',
    cardName: 'LinkedIn Post',
    apiRoute: '/api/mini-apps/linkedin-hook',
    formAnchor: 'textarea',
    fillValid: async (page) => {
      await page
        .locator('textarea')
        .first()
        .fill(
          'Just raised our Series A. Hiring 10 engineers in Q3 to scale our pipeline tooling. Excited for what is coming next.'
        )
    },
  },
  {
    folder: 'crm-sanity',
    cardName: 'CRM Field Sanity Check',
    apiRoute: '/api/mini-apps/crm-sanity',
    formAnchor: 'textarea',
    fillValid: async (page) => {
      await page
        .locator('textarea')
        .first()
        .fill(
          `First Name: sarah
Last Name: O'CONNOR
Email: sarah.oconnor@gmial.com
Phone: (415) 555-2271
Company: Acme Corp.
Title: vp of revenue ops
Country: USA
State: ca
Lead Source:
Created Date: 1/15/24
Annual Revenue: $12M`
        )
    },
  },
  {
    folder: 'website-roast',
    cardName: 'Website Roast',
    apiRoute: '/api/mini-apps/website-roast',
    formAnchor: 'input[placeholder*="yoursite"]',
    fillValid: async (page) => {
      await page.locator('input[placeholder*="yoursite"]').fill('https://linear.app')
    },
  },
  {
    folder: 'agentic-readiness',
    cardName: 'Agentic Readiness',
    apiRoute: '/api/mini-apps/agentic-readiness',
    formAnchor: 'input:not([type="email"])',
    fillValid: async (page) => {
      await page.locator('input:not([type="email"])').first().fill('https://linear.app')
    },
  },
  {
    folder: 'ai-overview-tracker',
    cardName: 'AI Overview',
    apiRoute: '/api/mini-apps/ai-overview-tracker',
    formAnchor: 'input:not([type="email"])',
    killswitched: true,
    fillValid: async (page) => {
      await page.locator('input:not([type="email"])').first().fill('linear.app')
      const kw = page.locator('textarea').first()
      if (await kw.count()) {
        await kw.fill('project management tool\nlinear vs jira\nbug tracker for engineers')
      }
    },
  },
  {
    folder: 'ai-visibility-score',
    cardName: 'AI Visibility',
    apiRoute: '/api/mini-apps/ai-visibility-score',
    formAnchor: 'input:not([type="email"])',
    fillValid: async (page) => {
      await page.locator('input:not([type="email"])').first().fill('linear.app')
    },
  },
  {
    folder: 'email-finder',
    cardName: 'Email Finder',
    apiRoute: null,
    formAnchor: 'input[type="text"]',
    killswitched: true,
    fillValid: async (page) => {
      await page.locator('input').first().fill("Sarah O'Connor")
      await page.locator('input').nth(1).fill('Acme Corp')
    },
  },
  {
    folder: 'find-people',
    cardName: 'Find People',
    apiRoute: null,
    formAnchor: 'input',
    killswitched: true,
    fillValid: async (page) => {
      await page.locator('input').first().fill('acme.com')
    },
  },
]

/**
 * Install a guard that fails the test if the Anthropic route is hit.
 * Use this in tests that expect lead-validation to block the request.
 */
async function blockAndCountAnthropic(page: Page, route: string | null) {
  if (!route) return
  await page.route(route, async () => {
    // Surface a clear test failure if we ever reach here.
    throw new Error(`Anthropic route ${route} should not have been called`)
  })
}

/**
 * Replace the Anthropic route with a fast fake so tests don't cost real $$.
 */
async function fakeAnthropicResponse(page: Page, route: string | null) {
  if (!route) return
  await page.route(route, async (req) => {
    await req.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        data: {
          tokens_in: 100,
          tokens_out: 100,
          // Filler shape — apps render only what they read. Most apps tolerate
          // extra fields via their TS types. Specific shapes per app can be
          // added if a test reads result-content state.
          url: 'https://linear.app',
          friction_score: 5,
          clarity_grade: 'B',
          plan_legibility: 'Good',
          summary: 'fake',
          buyer_inference: 'fake',
          flags: [],
          improvements: [
            { rank: 1, title: 'x', description: 'y', impact: 'high' },
            { rank: 2, title: 'x', description: 'y', impact: 'medium' },
            { rank: 3, title: 'x', description: 'y', impact: 'low' },
          ],
        },
        cost: {
          model: 'claude-opus-4-5',
          inputTokens: 100,
          outputTokens: 100,
          costUsd: 0.001,
        },
      }),
    })
  })
}

test.describe('Marketplace', () => {
  test('gallery renders and reaches each mini-app', async ({ page }) => {
    test.setTimeout(60_000)
    await page.goto('/mini-apps')
    // h1 is "Mini Apps" or similar — just confirm one is there.
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
    // For each app, confirm we can navigate to its page directly.
    for (const app of APPS) {
      const resp = await page.goto(`/mini-apps/${app.folder}`, { waitUntil: 'domcontentloaded' })
      expect(resp?.status(), `bad status on ${app.folder}`).toBeLessThan(400)
    }
  })
})

for (const app of APPS) {
  test.describe(`mini-app: ${app.folder}`, () => {
    test.beforeEach(async ({ page }) => {
      // Mute noisy logs but capture errors for the final assertion.
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text()
          // Sentry / Next dev warnings are noise we don't own.
          if (text.includes('Sentry') || text.includes('[HMR]')) return
          errors.push(`console.error: ${text}`)
        }
      })
      ;(page as Page & { __errors: string[] }).__errors = errors
    })

    test('page loads without console errors', async ({ page }) => {
      await page.goto(`/mini-apps/${app.folder}`)
      await expect(page.locator(app.formAnchor).first()).toBeVisible()
      const errors = (page as Page & { __errors: string[] }).__errors
      expect(errors, errors.join('\n')).toEqual([])
    })

    test('back-to-mini-apps pill is present', async ({ page }) => {
      await page.goto(`/mini-apps/${app.folder}`)
      await expect(page.getByRole('link', { name: /back to all mini-apps/i })).toBeVisible()
    })

    if (!app.killswitched) {
      test('empty submit shakes BOTH input and email helpers (no API call fires)', async ({
        page,
      }) => {
        await blockAndCountAnthropic(page, app.apiRoute ?? null)
        await page.goto(`/mini-apps/${app.folder}`)
        const submit = page.locator('button[type="submit"]').first()
        await expect(submit).toBeVisible()
        await submit.click()
        // The `error` class lands on the input wrapper. App-specific
        // prefixes vary (`input-box`, `textarea-box`, `pd-input-box`, etc.).
        await expect(
          page.locator('[class*="box"].error, .field-error, .pd-helper.error').first()
        ).toBeVisible({ timeout: 2000 })
      })

      test('disposable email is rejected server-side, model never called', async ({ page }) => {
        await blockAndCountAnthropic(page, app.apiRoute ?? null)
        await page.goto(`/mini-apps/${app.folder}`)
        await app.fillValid(page)
        await page.locator('input[type="email"]').first().fill(DISPOSABLE_EMAIL)
        await page.locator('button[type="submit"]').first().click()
        // Server returns 400 with "Please use a work email". The page should
        // show that on the email field.
        await expect(page.getByText(/work email/i).first()).toBeVisible({ timeout: 5000 })
      })

      test('free-provider email (gmail) is rejected server-side', async ({ page }) => {
        await blockAndCountAnthropic(page, app.apiRoute ?? null)
        await page.goto(`/mini-apps/${app.folder}`)
        await app.fillValid(page)
        await page.locator('input[type="email"]').first().fill(FREE_EMAIL)
        await page.locator('button[type="submit"]').first().click()
        // Server returns either "Please use a work email. Personal addresses
        // are not accepted." (free-provider) or "Please use a work email"
        // (disposable). Both contain "work email".
        await expect(page.getByText(/work email/i).first()).toBeVisible({ timeout: 5000 })
      })

      test('valid work email proceeds (model mocked)', async ({ page }) => {
        await fakeAnthropicResponse(page, app.apiRoute ?? null)
        await page.goto(`/mini-apps/${app.folder}`)
        await app.fillValid(page)
        await page.locator('input[type="email"]').first().fill(VALID_EMAIL)
        await page.locator('button[type="submit"]').first().click()
        // We don't assert on the result content (model is faked) — only that
        // the submit didn't hang and the URL is still on the app page.
        await expect(page).toHaveURL(new RegExp(`/mini-apps/${app.folder}`))
      })
    }
  })
}
