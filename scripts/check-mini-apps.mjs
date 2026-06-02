#!/usr/bin/env node
/**
 * check-mini-apps.mjs
 *
 * Enforces the s7labs.ai mini-app convention. Run on every PR that touches
 * `src/app/mini-apps/**`. See `docs/mini-apps.md`.
 *
 * For each mini-app page (src/app/mini-apps/<folder>/page.tsx) we check:
 *   1. The page wraps its result in <EmailGate miniAppSlug="...">.
 *   2. The slug from that wrap exists in Supabase `mini_apps` with status='active'.
 *   3. The page renders a `How it works` section (className="how-it-works").
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
  // Matches <EmailGate ... miniAppSlug="<slug>" ... >  (order-agnostic, single or double quoted)
  const m = source.match(/<EmailGate[\s\S]*?miniAppSlug=["']([^"']+)["']/)
  return m ? m[1] : null
}

function hasHowItWorks(source) {
  return /className=["']how-it-works["']/.test(source) && /<h2[\s>]/.test(source)
}

function hasEmailGateImport(source) {
  return /from\s+['"]@\/components\/mini-apps\/EmailGate['"]/.test(source)
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

  if (!hasEmailGateImport(pageSource) || !pageSource.includes('<EmailGate')) {
    problems.push(
      `must wrap its result section in <EmailGate miniAppSlug="..."> ` +
        `(import from @/components/mini-apps/EmailGate). See ${DOC_LINK}.`
    )
  }

  const slug = extractSlug(pageSource)
  if (!slug) {
    problems.push(
      `<EmailGate miniAppSlug="..."> not found or slug not extractable. See ${DOC_LINK}.`
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
