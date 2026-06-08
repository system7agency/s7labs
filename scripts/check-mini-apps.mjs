#!/usr/bin/env node
/* eslint-disable no-console -- CLI script, console output is the UI */
/**
 * check-mini-apps.mjs
 *
 * Enforces the s7labs.ai mini-app convention. Run on every PR that touches
 * `src/app/mini-apps/**`. See `docs/mini-apps.md`.
 *
 * For each mini-app page (src/app/mini-apps/<folder>/page.tsx) we check:
 *   1. The page uses the inline email gate pattern — imports EMAIL_REGEX
 *      from @/lib/leads/disposable AND POSTs to /api/leads/submit with a
 *      `miniAppSlug: '<slug>'` field in the body.
 *   2. The slug from that POST exists in Supabase `mini_apps` with
 *      status='active'.
 *   3. The page renders a "How it works" section — either the shared
 *      <HowItWorks> component or a direct <section className="how-it-works">.
 *
 * Env vars required:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY   (RLS allows anon select on mini_apps)
 *
 * Exits non-zero on any failure.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const MINI_APPS_DIR = join(ROOT, 'src/app/mini-apps')
const DOC_LINK = 'docs/mini-apps.md'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('✗ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(2)
}

// --- discover mini-app pages ----------------------------------------------

function listMiniAppFolders() {
  if (!existsSync(MINI_APPS_DIR)) return []
  return readdirSync(MINI_APPS_DIR)
    .filter((name) => !name.startsWith('_') && !name.startsWith('.'))
    .map((name) => join(MINI_APPS_DIR, name))
    .filter((path) => {
      try {
        return statSync(path).isDirectory() && existsSync(join(path, 'page.tsx'))
      } catch {
        return false
      }
    })
}

/**
 * In CI (GitHub Actions PR runs), only check mini-apps whose page.tsx was
 * modified in this PR. Returns null to mean "no scoping, check everything"
 * (local runs or when we can't determine the diff).
 */
function getChangedFolderNames() {
  const baseRef = process.env.GITHUB_BASE_REF
  if (!baseRef) return null
  try {
    const out = execSync(`git diff --name-only origin/${baseRef}...HEAD`, {
      encoding: 'utf8',
      cwd: ROOT,
    })
    const folders = new Set()
    for (const line of out.split('\n')) {
      const m = line.match(/^src\/app\/mini-apps\/([^/]+)\/page\.tsx$/)
      if (m) folders.add(m[1])
    }
    return folders
  } catch (err) {
    console.warn(`Could not compute changed files vs origin/${baseRef}: ${err.message}`)
    console.warn('Falling back to checking every mini-app.')
    return null
  }
}

// --- per-page static checks -----------------------------------------------

function extractSlug(source) {
  // Inline pattern: a POST body to /api/leads/submit with `miniAppSlug: '<slug>'`.
  // Matches both `miniAppSlug: 'slug'` and `miniAppSlug: "slug"`.
  const m = source.match(/miniAppSlug:\s*["']([a-z0-9-]+)["']/)
  return m ? m[1] : null
}

function hasHowItWorks(source) {
  // Either a direct <section className="how-it-works"> with an <h2>,
  // or use of the shared <HowItWorks> component.
  const directSection =
    /className=["']how-it-works["']/.test(source) && /<h2[\s>]/.test(source)
  const sharedComponent =
    /from\s+['"]@\/components\/mini-apps\/HowItWorks['"]/.test(source) &&
    /<HowItWorks[\s>]/.test(source)
  return directSection || sharedComponent
}

function hasInlineEmailGate(source) {
  // The inline email gate pattern uses EMAIL_REGEX for client-side validation
  // and POSTs to /api/leads/submit before any model call.
  return (
    /from\s+['"]@\/lib\/leads\/disposable['"]/.test(source) &&
    /['"]\/api\/leads\/submit['"]/.test(source)
  )
}

// --- supabase query --------------------------------------------------------

async function fetchActiveSlugs() {
  const url = `${SUPABASE_URL}/rest/v1/mini_apps?select=slug,status&status=eq.active`
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Supabase query failed (${res.status}): ${body}`)
  }
  const rows = await res.json()
  return new Set(rows.map((r) => r.slug))
}

// --- main ------------------------------------------------------------------

const allFolders = listMiniAppFolders()
if (allFolders.length === 0) {
  console.log('No mini-app pages found. Nothing to check.')
  process.exit(0)
}

const changed = getChangedFolderNames()
const folders =
  changed === null
    ? allFolders
    : allFolders.filter((f) => changed.has(f.split('/').pop()))

if (folders.length === 0) {
  console.log('This PR does not modify any mini-app page.tsx. Nothing to check.')
  process.exit(0)
}

if (changed === null) {
  console.log(`Checking all ${folders.length} mini-app page(s)…\n`)
} else {
  console.log(
    `PR modifies ${folders.length} mini-app page(s): ${folders.map((f) => f.split('/').pop()).join(', ')}\n`
  )
}

const activeSlugs = await fetchActiveSlugs()

let failures = 0

for (const folder of folders) {
  const folderName = folder.split('/').pop()
  const pageSource = readFileSync(join(folder, 'page.tsx'), 'utf8')
  const problems = []

  if (!hasInlineEmailGate(pageSource)) {
    problems.push(
      `must use the inline email gate pattern: import EMAIL_REGEX from ` +
        `@/lib/leads/disposable AND POST to /api/leads/submit BEFORE the ` +
        `model call. See ${DOC_LINK}.`
    )
  }

  const slug = extractSlug(pageSource)
  if (!slug) {
    problems.push(
      `miniAppSlug: '<slug>' not found in the /api/leads/submit body. See ${DOC_LINK}.`
    )
  } else if (!activeSlugs.has(slug)) {
    problems.push(
      `slug "${slug}" is not registered as active in the mini_apps Supabase table.\n` +
        `      Register it with:\n` +
        `      insert into mini_apps (slug, name, category, status)\n` +
        `      values ('${slug}', '<Display Name>', '<category>', 'active');`
    )
  }

  if (!hasHowItWorks(pageSource)) {
    problems.push(
      `must include a "How it works" section ` +
        `(<section className="how-it-works"> with an <h2>). ` +
        `See pricing-diagnostic/page.tsx for the reference pattern.`
    )
  }

  if (problems.length === 0) {
    console.log(`  ✓ ${folderName}  (slug: ${slug})`)
  } else {
    failures += 1
    console.log(`  ✗ ${folderName}`)
    for (const p of problems) console.log(`      - ${p}`)
  }
}

console.log()
if (failures > 0) {
  console.error(`✗ ${failures} mini-app(s) failed the convention check.`)
  console.error(`  See ${DOC_LINK} for the full rules.`)
  process.exit(1)
}

console.log('✓ All mini-apps pass.')
