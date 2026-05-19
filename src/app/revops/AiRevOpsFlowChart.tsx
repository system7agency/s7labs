import type { ReactNode } from 'react'

import styles from './CapabilitiesSection.module.css'

const COLUMN_X = [280, 820, 1360] as const

type Row = {
  cy: number
  h: number
  w: number | [number, number, number]
  labels: [ReactNode, ReactNode, ReactNode]
}

const tamLabel: ReactNode = (
  <>
    <tspan x={0} dy="-0.6em">
      TAM Sourcing —
    </tspan>
    <tspan x={0} dy="1.2em">
      30+ Data Sources Web Scraping
    </tspan>
  </>
)

const crmLabel: ReactNode = (
  <tspan x={0} dy="0.32em">
    CRM Records
  </tspan>
)

const inboundLabel: ReactNode = (
  <>
    <tspan x={0} dy="-0.6em">
      Inbound —
    </tspan>
    <tspan x={0} dy="1.2em">
      Phone, Forms, Visitors, Socials, Webinars
    </tspan>
  </>
)

const SOURCE_ROW: Row = {
  cy: 480,
  h: 120,
  w: [440, 140, 440],
  labels: [tamLabel, crmLabel, inboundLabel],
}

const aiResearchLabel: ReactNode = (
  <>
    <tspan x={0} dy="-0.6em">
      AI Account Research —
    </tspan>
    <tspan x={0} dy="1.2em">
      100+ Data Providers, AI Agents
    </tspan>
  </>
)

const AI_RESEARCH_ROW: Row = {
  cy: 680,
  h: 120,
  w: 440,
  labels: [aiResearchLabel, aiResearchLabel, aiResearchLabel],
}

const PROCESS_1_ROW: Row = {
  cy: 890,
  h: 140,
  w: 200,
  labels: ['Custom Signals', 'Dedupe & Associate', 'Lead Scoring'],
}

const PROCESS_2_ROW: Row = {
  cy: 1110,
  h: 140,
  w: 200,
  labels: ['Lead Scoring', 'Score & Segment', 'Lead Routing'],
}

const TERMINATOR_ROW = {
  cy: 1310,
  h: 100,
  w: 320,
  labels: ['Lead Allocation', 'Update Records', 'Personalized Outreach'] as const,
}

const BODY_ROWS: Row[] = [SOURCE_ROW, AI_RESEARCH_ROW, PROCESS_1_ROW, PROCESS_2_ROW]

const SYSTEM7_W = 160
const SYSTEM7_H = 80
const SYSTEM7_CY = 310
const SYSTEM7_SKEW = 12

const CONNECTORS: string[] = [
  'M 820 160 L 820 270',
  'M 360 310 L 740 310',
  'M 900 310 L 1280 310',
  ...COLUMN_X.flatMap((x) => [
    `M ${x} 350 L ${x} 420`,
    `M ${x} 540 L ${x} 620`,
    `M ${x} 740 L ${x} 820`,
    `M ${x} 960 L ${x} 1040`,
    `M ${x} 1180 L ${x} 1260`,
  ]),
]

function parallelogramPoints(cx: number, cy: number, w: number, h: number, skew: number) {
  const left = cx - w / 2
  const right = cx + w / 2
  const top = cy - h / 2
  const bottom = cy + h / 2
  return `${left + skew},${top} ${right + skew},${top} ${right - skew},${bottom} ${left - skew},${bottom}`
}

export function AiRevOpsFlowChart() {
  return (
    <svg
      className={styles.flow}
      viewBox="-30 -30 1700 1420"
      role="img"
      aria-label="AI RevOps flow: System7 feeds three parallel pipelines — outbound (TAM Sourcing), CRM records (dedupe and segment), and inbound (forms, visitors, webinars) — all running through AI Account Research, scoring, and routing to Lead Allocation, Update Records, and Personalized Outreach."
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <marker
          id="ai-revops-arrow"
          viewBox="0 0 10 10"
          markerWidth="6"
          markerHeight="6"
          refX="9"
          refY="5"
          orient="auto"
        >
          <path d="M0,0 L10,5 L0,10 Z" className={styles.flowArrowHead} />
        </marker>
        <marker
          id="ai-revops-arrow-start"
          viewBox="0 0 10 10"
          markerWidth="6"
          markerHeight="6"
          refX="1"
          refY="5"
          orient="auto"
        >
          <path d="M10,0 L0,5 L10,10 Z" className={styles.flowArrowHead} />
        </marker>
      </defs>

      <g className={styles.flowEdges}>
        {CONNECTORS.map((d, i) => {
          const bidirectional = i === 1 || i === 2
          return (
            <path
              key={i}
              d={d}
              markerEnd="url(#ai-revops-arrow)"
              markerStart={bidirectional ? 'url(#ai-revops-arrow-start)' : undefined}
            />
          )
        })}
      </g>

      <g data-flow-node data-flow-level="0">
        <rect
          x={370}
          y={0}
          width={900}
          height={160}
          rx={80}
          ry={80}
          className={styles.flowNodeHeader}
        />
        <text x={820} y={62} className={styles.flowHeaderTitle}>
          AI RevOps
        </text>
        <text x={820} y={100} className={styles.flowHeaderSub}>
          <tspan x={820} dy="0">
            AI workflows that help your sales, marketing, product and customer support
          </tspan>
          <tspan x={820} dy="1.3em">
            teams work efficiently.
          </tspan>
        </text>
      </g>

      {COLUMN_X.map((cx) => (
        <g key={`s7-${cx}`} data-flow-node data-flow-level="1">
          <polygon
            points={parallelogramPoints(cx, SYSTEM7_CY, SYSTEM7_W, SYSTEM7_H, SYSTEM7_SKEW)}
            className={styles.flowNodeHeader}
          />
          <text x={cx} y={SYSTEM7_CY} className={styles.flowSystem7Text}>
            System7
          </text>
        </g>
      ))}

      {BODY_ROWS.map((row, rowIdx) =>
        COLUMN_X.map((cx, colIdx) => {
          const w = typeof row.w === 'number' ? row.w : (row.w[colIdx] ?? row.w[0])
          return (
            <g
              key={`body-${rowIdx}-${colIdx}`}
              transform={`translate(${cx}, ${row.cy})`}
              data-flow-node
              data-flow-level={rowIdx + 2}
            >
              <rect
                x={-w / 2}
                y={-row.h / 2}
                width={w}
                height={row.h}
                rx={10}
                ry={10}
                className={styles.flowNodeBody}
              />
              <text x={0} y={0} className={styles.flowBodyMultiText}>
                {row.labels[colIdx]}
              </text>
            </g>
          )
        })
      )}

      {COLUMN_X.map((cx, colIdx) => (
        <g key={`term-${cx}`} data-flow-node data-flow-level="6">
          <rect
            x={cx - TERMINATOR_ROW.w / 2}
            y={TERMINATOR_ROW.cy - TERMINATOR_ROW.h / 2}
            width={TERMINATOR_ROW.w}
            height={TERMINATOR_ROW.h}
            rx={50}
            ry={50}
            className={styles.flowNodeYellowTerminator}
          />
          <text x={cx} y={TERMINATOR_ROW.cy} className={styles.flowYellowTerminatorText}>
            {TERMINATOR_ROW.labels[colIdx]}
          </text>
        </g>
      ))}
    </svg>
  )
}
