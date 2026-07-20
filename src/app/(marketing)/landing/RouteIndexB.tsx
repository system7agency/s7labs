'use client'

/*
 * RouteIndexB — comparison variant of the route selector: a display index.
 * Massive stacked route names with oversized ghost numerals, descriptions
 * tucked into the right margin, and a spotlight hover (the rows you're not
 * pointing at fall back). Louder counterpart to RouteIndex's quiet editorial
 * rows; same approved copy, same hairline vocabulary.
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
    handle: 'liveapps_s7labs',
    href: '/live-apps',
    desc: 'Small, working tools you can open and test now - each one focused on a single job.',
    tags: 'GALLERY · DEMOS · UTILITIES',
  },
]

export function RouteIndexB() {
  return (
    <MotionRoot>
      <m.div
        className="ridxb"
        variants={staggerParent(0.1)}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        {ROUTES.map((route) => (
          <m.a key={route.href} href={route.href} className="ridxb-row" variants={fadeUp}>
            <span className="ridxb-num" aria-hidden="true">
              {route.index}
            </span>
            <span className="ridxb-main">
              <span className="ridxb-name">{route.name}</span>
              <span className="ridxb-handle">{`$ ${route.handle}`}</span>
            </span>
            <span className="ridxb-info">
              <span className="ridxb-desc">{route.desc}</span>
              <span className="ridxb-foot">
                <span className="ridxb-tags">{route.tags}</span>
                <span className="ridxb-arrow" aria-hidden="true">
                  →
                </span>
              </span>
            </span>
          </m.a>
        ))}
      </m.div>
    </MotionRoot>
  )
}
