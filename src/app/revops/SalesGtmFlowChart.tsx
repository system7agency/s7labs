import styles from './CapabilitiesSection.module.css'

type Node = { cx: number; cy: number; w: number; label: string }

const BODY_NODES: Node[] = [
  { cx: 715, cy: 510, w: 300, label: 'ICP Connection Requests' },
  { cx: 715, cy: 730, w: 220, label: 'Content Calendar' },
  { cx: 447, cy: 950, w: 200, label: 'Content Pillars' },
  { cx: 715, cy: 950, w: 200, label: 'Topics' },
  { cx: 983, cy: 950, w: 200, label: 'Post Formats' },
  { cx: 715, cy: 1170, w: 200, label: 'Interviews' },
  { cx: 715, cy: 1390, w: 220, label: 'Content Creation' },
  { cx: 179, cy: 1610, w: 230, label: 'Thought Leadership' },
  { cx: 447, cy: 1610, w: 200, label: 'Educational' },
  { cx: 715, cy: 1610, w: 230, label: 'Product Marketing' },
  { cx: 983, cy: 1610, w: 220, label: 'Sales Enablement' },
  { cx: 1251, cy: 1610, w: 200, label: 'Social Proof' },
]

const TERMINATORS: Node[] = [
  { cx: 565, cy: 2050, w: 240, label: 'Inbound Meetings' },
  { cx: 865, cy: 2050, w: 240, label: 'Free Trials' },
]

const CONNECTORS: string[] = [
  'M 715 120 L 715 240',
  'M 715 340 L 715 460',
  'M 715 560 L 715 680',
  'M 715 780 L 715 830 L 447 830 L 447 900',
  'M 715 780 L 715 900',
  'M 715 780 L 715 830 L 983 830 L 983 900',
  'M 447 1000 L 447 1060 L 715 1060 L 715 1120',
  'M 715 1000 L 715 1120',
  'M 983 1000 L 983 1060 L 715 1060 L 715 1120',
  'M 715 1220 L 715 1340',
  'M 715 1440 L 715 1500 L 179 1500 L 179 1560',
  'M 715 1440 L 715 1500 L 447 1500 L 447 1560',
  'M 715 1440 L 715 1560',
  'M 715 1440 L 715 1500 L 983 1500 L 983 1560',
  'M 715 1440 L 715 1500 L 1251 1500 L 1251 1560',
  'M 179 1660 L 179 1720 L 715 1720 L 715 1780',
  'M 447 1660 L 447 1720 L 715 1720 L 715 1780',
  'M 715 1660 L 715 1780',
  'M 983 1660 L 983 1720 L 715 1720 L 715 1780',
  'M 1251 1660 L 1251 1720 L 715 1720 L 715 1780',
  'M 715 1880 L 715 1940 L 565 1940 L 565 2000',
  'M 715 1880 L 715 1940 L 865 1940 L 865 2000',
]

function NodeBox({ cx, cy, w, label }: Node) {
  const h = 100
  return (
    <g>
      <rect
        x={cx - w / 2}
        y={cy - h / 2}
        width={w}
        height={h}
        rx={12}
        ry={12}
        className={styles.flowNodeBody}
      />
      <text x={cx} y={cy} className={styles.flowNodeText}>
        {label}
      </text>
    </g>
  )
}

function TerminatorPill({ cx, cy, w, label }: Node) {
  const h = 100
  return (
    <g>
      <rect
        x={cx - w / 2}
        y={cy - h / 2}
        width={w}
        height={h}
        rx={50}
        ry={50}
        className={styles.flowNodeTerminator}
      />
      <text x={cx} y={cy} className={styles.flowTerminatorText}>
        {label}
      </text>
    </g>
  )
}

export function SalesGtmFlowChart() {
  return (
    <svg
      className={styles.flow}
      viewBox="-30 -20 1490 2160"
      role="img"
      aria-label="Content Engine flow: System7.ai initiates ICP connection requests, leading to a content calendar of pillars, topics and post formats. Interviews feed content creation across five categories — Thought Leadership, Educational, Product Marketing, Sales Enablement, Social Proof — which fan into Distribution, producing Inbound Meetings and Free Trials."
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <marker
          id="sales-flow-arrow"
          viewBox="0 0 10 10"
          markerWidth="6"
          markerHeight="6"
          refX="9"
          refY="5"
          orient="auto"
        >
          <path d="M0,0 L10,5 L0,10 Z" className={styles.flowArrowHead} />
        </marker>
      </defs>

      <g className={styles.flowEdges}>
        {CONNECTORS.map((d, i) => (
          <path key={i} d={d} markerEnd="url(#sales-flow-arrow)" />
        ))}
      </g>

      <g>
        <rect
          x={355}
          y={0}
          width={720}
          height={120}
          rx={60}
          ry={60}
          className={styles.flowNodeHeader}
        />
        <text x={715} y={50} className={styles.flowHeaderTitle}>
          Content Engine
        </text>
        <text x={715} y={88} className={styles.flowHeaderSub}>
          LinkedIn thought leadership content engines that generate demand
        </text>
      </g>

      <g>
        <polygon points="633,240 833,240 797,340 597,340" className={styles.flowNodeBody} />
        <text x={715} y={290} className={styles.flowNodeText}>
          System7.ai
        </text>
      </g>

      {BODY_NODES.map((node) => (
        <NodeBox key={node.label} {...node} />
      ))}

      <g>
        <rect
          x={605}
          y={1780}
          width={220}
          height={100}
          rx={12}
          ry={12}
          className={styles.flowNodeAccent}
        />
        <text x={715} y={1830} className={styles.flowAccentText}>
          Distribution
        </text>
      </g>

      {TERMINATORS.map((node) => (
        <TerminatorPill key={node.label} {...node} />
      ))}
    </svg>
  )
}
