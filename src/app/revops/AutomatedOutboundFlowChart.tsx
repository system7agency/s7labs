import styles from './CapabilitiesSection.module.css'

const CENTER_X = 600

type Node = { cx: number; cy: number; w: number; h: number; label: string }

const SELECTION_NODES: Node[] = [
  { cx: 300, cy: 540, w: 240, h: 100, label: 'ICP Model' },
  { cx: 900, cy: 540, w: 240, h: 100, label: 'TAM Map' },
  { cx: 300, cy: 1020, w: 240, h: 100, label: 'Play Selection' },
  { cx: 900, cy: 1020, w: 240, h: 100, label: 'Tool Selection' },
]

const BODY_NODES: Node[] = [
  { cx: CENTER_X, cy: 780, w: 540, h: 100, label: 'Email and LinkedIn Infrastructure' },
  { cx: 150, cy: 1260, w: 220, h: 100, label: 'List Building' },
  { cx: 450, cy: 1260, w: 220, h: 100, label: 'Data Enrichment' },
  { cx: 750, cy: 1260, w: 220, h: 100, label: 'Lead Scoring' },
  { cx: 1050, cy: 1260, w: 260, h: 100, label: 'Personalized Copywriting' },
  { cx: CENTER_X, cy: 1480, w: 320, h: 100, label: 'Multichannel Outreach' },
  { cx: CENTER_X, cy: 1700, w: 280, h: 100, label: 'Qualified Leads' },
]

const CONNECTORS: string[] = [
  'M 600 160 L 600 270',
  'M 600 370 L 600 460 L 300 460 L 300 490',
  'M 600 370 L 600 460 L 900 460 L 900 490',
  'M 300 590 L 300 690 L 600 690 L 600 730',
  'M 900 590 L 900 690 L 600 690 L 600 730',
  'M 600 830 L 600 940 L 300 940 L 300 970',
  'M 600 830 L 600 940 L 900 940 L 900 970',
  'M 300 1070 L 300 1180 L 150 1180 L 150 1210',
  'M 300 1070 L 300 1180 L 450 1180 L 450 1210',
  'M 900 1070 L 900 1180 L 750 1180 L 750 1210',
  'M 900 1070 L 900 1180 L 1050 1180 L 1050 1210',
  'M 150 1310 L 150 1410 L 600 1410 L 600 1430',
  'M 450 1310 L 450 1410 L 600 1410 L 600 1430',
  'M 750 1310 L 750 1410 L 600 1410 L 600 1430',
  'M 1050 1310 L 1050 1410 L 600 1410 L 600 1430',
  'M 600 1530 L 600 1650',
  'M 600 1750 L 600 1810 L 400 1810 L 400 1870',
  'M 600 1750 L 600 1810 L 800 1810 L 800 1870',
]

function parallelogramPoints(cx: number, cy: number, w: number, h: number, skew: number) {
  const left = cx - w / 2
  const right = cx + w / 2
  const top = cy - h / 2
  const bottom = cy + h / 2
  return `${left + skew},${top} ${right + skew},${top} ${right - skew},${bottom} ${left - skew},${bottom}`
}

export function AutomatedOutboundFlowChart() {
  return (
    <svg
      className={styles.flow}
      viewBox="-30 -30 1260 2030"
      role="img"
      aria-label="Automated Outbound flow: System7 builds ICP Model and TAM Map, sets up Email and LinkedIn infrastructure, then runs play and tool selection that fan into list building, data enrichment, lead scoring and personalized copywriting, converging on multichannel outreach that yields qualified leads delivered to CRM (HubSpot, Salesforce) and Slack."
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <marker
          id="auto-outbound-arrow"
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
          <path key={i} d={d} markerEnd="url(#auto-outbound-arrow)" />
        ))}
      </g>

      <g>
        <rect
          x={CENTER_X - 360}
          y={0}
          width={720}
          height={160}
          rx={80}
          ry={80}
          className={styles.flowNodeHeader}
        />
        <text x={CENTER_X} y={64} className={styles.flowHeaderTitle}>
          Automated Outbound
        </text>
        <text x={CENTER_X} y={104} className={styles.flowHeaderSub}>
          End-to-end outbound systems that book meetings for you.
        </text>
      </g>

      <g>
        <polygon
          points={parallelogramPoints(CENTER_X, 320, 200, 100, 14)}
          className={styles.flowNodeBody}
        />
        <text x={CENTER_X} y={320} className={styles.flowNodeText}>
          System7
        </text>
      </g>

      {SELECTION_NODES.map((n) => (
        <g key={n.label}>
          <rect
            x={n.cx - n.w / 2}
            y={n.cy - n.h / 2}
            width={n.w}
            height={n.h}
            rx={10}
            ry={10}
            className={styles.flowNodeSelection}
          />
          <text x={n.cx} y={n.cy} className={styles.flowNodeText}>
            {n.label}
          </text>
        </g>
      ))}

      {BODY_NODES.map((n) => (
        <g key={n.label}>
          <rect
            x={n.cx - n.w / 2}
            y={n.cy - n.h / 2}
            width={n.w}
            height={n.h}
            rx={10}
            ry={10}
            className={styles.flowNodeBody}
          />
          <text x={n.cx} y={n.cy} className={styles.flowNodeText}>
            {n.label}
          </text>
        </g>
      ))}

      <g>
        <rect
          x={240}
          y={1870}
          width={320}
          height={100}
          rx={50}
          ry={50}
          className={styles.flowNodeTerminator}
        />
        <text x={400} y={1905} className={styles.flowTerminatorText}>
          CRM
        </text>
        <text x={400} y={1944} className={styles.flowTerminatorSub}>
          HubSpot · Salesforce
        </text>
      </g>

      <g>
        <rect
          x={690}
          y={1870}
          width={220}
          height={100}
          rx={50}
          ry={50}
          className={styles.flowNodeTerminator}
        />
        <text x={800} y={1920} className={styles.flowTerminatorText}>
          Slack
        </text>
      </g>
    </svg>
  )
}
