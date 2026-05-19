import styles from './CapabilitiesSection.module.css'
import type { MobileLevel, MobileVariant } from './mobileFlowData'

type Props = {
  levels: MobileLevel[]
  markerId: string
}

const VARIANT_TO_CLASS: Record<MobileVariant, string> = {
  header: styles.mobileCardHeader ?? '',
  system7: styles.mobileCardSystem7 ?? '',
  selection: styles.mobileCardSelection ?? '',
  body: styles.mobileCardBody ?? '',
  accent: styles.mobileCardAccent ?? '',
  terminator: styles.mobileCardTerminator ?? '',
  'yellow-terminator': styles.mobileCardYellowTerminator ?? '',
}

function VerticalEdge({ markerId }: { markerId: string }) {
  const height = 24
  const width = 24
  return (
    <svg
      className={styles.mobileConnector}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      <path d={`M 12 0 L 12 ${height - 4}`} markerEnd={`url(#${markerId})`} />
    </svg>
  )
}

function BranchBar() {
  return (
    <div className={styles.mobileBranchBar} aria-hidden="true">
      <span className={styles.mobileBranchBarLine} />
    </div>
  )
}

export function MobileFlowTimeline({ levels, markerId }: Props) {
  const flatNodes = levels.flatMap((l) => l.nodes.map((n) => n.id))
  const indexById = new Map(flatNodes.map((id, i) => [id, i + 1]))
  return (
    <div className={styles.mobileTimeline}>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <marker
            id={markerId}
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
      </svg>

      {levels.map((lvl, levelIdx) => {
        const connectorEl = (() => {
          if (lvl.connector === 'start') return null
          if (lvl.connector === 'fanout') {
            return (
              <>
                <VerticalEdge markerId={markerId} />
                <BranchBar />
              </>
            )
          }
          if (lvl.connector === 'merge') {
            return (
              <>
                <BranchBar />
                <VerticalEdge markerId={markerId} />
              </>
            )
          }
          // linear or parallel
          return <VerticalEdge markerId={markerId} />
        })()

        return (
          <div key={`lvl-${lvl.level}`} className={styles.mobileLevel}>
            {connectorEl && levelIdx > 0 ? (
              <div className={styles.mobileConnectorGroup}>{connectorEl}</div>
            ) : null}
            <div className={styles.mobileLevelCards}>
              {lvl.nodes.map((node) => {
                const idTag = String(indexById.get(node.id) ?? 0).padStart(2, '0')
                const variantClass = VARIANT_TO_CLASS[node.variant]
                return (
                  <div
                    key={node.id}
                    data-flow-node
                    data-flow-level={lvl.level}
                    className={`${styles.mobileCard} ${variantClass}`}
                  >
                    <span className={`${styles.mobileCardCorner} ${styles.mobileCardCornerTl}`} />
                    <span className={`${styles.mobileCardCorner} ${styles.mobileCardCornerTr}`} />
                    <span className={`${styles.mobileCardCorner} ${styles.mobileCardCornerBl}`} />
                    <span className={`${styles.mobileCardCorner} ${styles.mobileCardCornerBr}`} />
                    <span className={styles.mobileCardId}>{idTag}</span>
                    <div className={styles.mobileCardBodyText}>
                      <span className={styles.mobileCardTitle} data-flow-title>
                        {node.title}
                      </span>
                      {node.subtitle ? (
                        <span className={styles.mobileCardSubtitle}>{node.subtitle}</span>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
