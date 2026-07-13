'use client'

/*
 * RouteIndex — the landing page's route selector, as a typographic index.
 * Replaces the old spacious route cards (client: "a lot of space, maybe we
 * can try something else"): four full-width hairline rows, big route names,
 * mono metadata, an accent line that draws along the top edge on hover.
 * Copy is verbatim from the approved doc; handles stay monospace texture.
 */

import { MotionRoot, VIEWPORT, fadeUp, m, staggerParent } from '@/components/Motion'

const ROUTES = [
  {
    index: '01',
    name: 'RevOps',
    handle: 'revops_s7labs',
    href: '/revops',
    desc: 'AI-native pipeline, qualification and outbound, connected to the CRM your team already runs on.',
    tags: 'SALES · REVOPS · PIPELINE',
  },
  {
    index: '02',
    name: 'Agent',
    handle: 'agent_s7labs',
    href: '/agent',
    desc: 'AI agents that do the work: research, operations, reporting and multi-step tasks, with human approval built in.',
    tags: 'AGENTS · ORCHESTRATION · GOVERNED',
  },
  {
    index: '03',
    name: 'Build',
    handle: 'build_s7labs',
    href: '/build',
    desc: 'Custom software, internal tools and AI-enabled products, built around how your business actually runs.',
    tags: 'SOFTWARE · PRODUCTS · TOOLS',
  },
  {
    index: '04',
    name: 'Live Apps',
    handle: 'miniApps_s7labs',
    href: '/mini-apps',
    desc: 'Small, working tools you can open and test now - each one focused on a single job.',
    tags: 'GALLERY · DEMOS · UTILITIES',
  },
]

export function RouteIndex() {
  return (
    <MotionRoot>
      <m.div
        className="ridx"
        variants={staggerParent(0.09)}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        {ROUTES.map((route) => (
          <m.a key={route.href} href={route.href} className="ridx-row" variants={fadeUp}>
            <span className="ridx-meta">
              <span className="ridx-index">{`ROUTE_${route.index}`}</span>
              <span className="ridx-handle">{`$ ${route.handle}`}</span>
            </span>
            <span className="ridx-name">
              <span>{route.name}</span>
            </span>
            <span className="ridx-info">
              <span className="ridx-desc">{route.desc}</span>
              <span className="ridx-tags">{route.tags}</span>
            </span>
            <span className="ridx-arrow">
              <span>ENTER</span>
              <span className="a" aria-hidden="true">
                →
              </span>
            </span>
          </m.a>
        ))}
      </m.div>
    </MotionRoot>
  )
}
