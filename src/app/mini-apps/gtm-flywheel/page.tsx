'use client'

import { useCallback, useMemo, useRef, useState, type DragEvent } from 'react'

import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
  type ReactFlowInstance,
  ReactFlow,
  useEdgesState,
  useNodesState,
  Position,
} from '@xyflow/react'

import '@xyflow/react/dist/style.css'
import './page-styles.css'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { AuroraBackground } from '@/components/mini-apps/AuroraBackground'
import { EmailGate } from '@/components/mini-apps/EmailGate'
import { SubmitOnce } from '@/components/mini-apps/SubmitOnce'
import { PageScripts } from './PageScripts'

type MotionType =
  | 'Outbound'
  | 'Inbound'
  | 'Content'
  | 'Paid'
  | 'Partnerships'
  | 'Community'
  | 'Product-led'
  | 'Referrals'
  | 'Events'
  | 'Custom'

type FlywheelNodeData = {
  label: string
  motion: MotionType
  accent: string
}

type ShareNode = {
  id: string
  label: string
  motion: MotionType
  accent: string
  x: number
  y: number
}

type ShareEdge = {
  id: string
  source: string
  target: string
}

type SharePayload = {
  n: ShareNode[]
  e: ShareEdge[]
}

const FLOW_HASH_PREFIX = '#flow='
const HASH_CHAR_LIMIT = 2048

const MOTIONS: Array<{ name: MotionType; accent: string; blurb: string }> = [
  { name: 'Outbound', accent: '#50b0ff', blurb: 'Prospecting, direct outreach, SDR motions' },
  { name: 'Inbound', accent: '#30d0c6', blurb: 'Demand capture and conversion pathways' },
  { name: 'Content', accent: '#7d8fff', blurb: 'Authority flywheel from assets and distribution' },
  { name: 'Paid', accent: '#ff9966', blurb: 'Paid acquisition and retargeting loops' },
  { name: 'Partnerships', accent: '#a28bff', blurb: 'Channel, affiliate, and ecosystem leverage' },
  {
    name: 'Community',
    accent: '#33d69f',
    blurb: 'Peer proof, social trust, and compounding reach',
  },
  { name: 'Product-led', accent: '#ffd166', blurb: 'Activation loops inside product UX' },
  { name: 'Referrals', accent: '#ff6ea8', blurb: 'Advocacy and customer-led growth loops' },
  { name: 'Events', accent: '#72c4ff', blurb: 'Live demand capture and follow-up sequences' },
  { name: 'Custom', accent: '#8892a5', blurb: 'Bring your own motion and tailor it to your GTM' },
]

const MOTION_MAP = new Map(MOTIONS.map((motion) => [motion.name, motion]))

const TEMPLATE_NODES: Node<FlywheelNodeData>[] = [
  {
    id: 'tpl-1',
    type: 'flywheelNode',
    position: { x: 80, y: 60 },
    data: { label: 'Content Engine', motion: 'Content', accent: '#7d8fff' },
  },
  {
    id: 'tpl-2',
    type: 'flywheelNode',
    position: { x: 430, y: 60 },
    data: { label: 'Inbound Funnel', motion: 'Inbound', accent: '#30d0c6' },
  },
  {
    id: 'tpl-3',
    type: 'flywheelNode',
    position: { x: 580, y: 290 },
    data: { label: 'Product-led Activation', motion: 'Product-led', accent: '#ffd166' },
  },
  {
    id: 'tpl-4',
    type: 'flywheelNode',
    position: { x: 260, y: 420 },
    data: { label: 'Referrals', motion: 'Referrals', accent: '#ff6ea8' },
  },
  {
    id: 'tpl-5',
    type: 'flywheelNode',
    position: { x: 20, y: 270 },
    data: { label: 'Outbound Plays', motion: 'Outbound', accent: '#50b0ff' },
  },
]

const TEMPLATE_EDGES: Edge[] = [
  { id: 'tpl-e1', source: 'tpl-1', target: 'tpl-2' },
  { id: 'tpl-e2', source: 'tpl-2', target: 'tpl-3' },
  { id: 'tpl-e3', source: 'tpl-3', target: 'tpl-4' },
  { id: 'tpl-e4', source: 'tpl-4', target: 'tpl-5' },
  { id: 'tpl-e5', source: 'tpl-5', target: 'tpl-1' },
]

const HOW_STEPS: Array<{ title: string; body: string }> = [
  {
    title: 'Drop your motions',
    body: 'Drag growth motions onto the canvas and map how each one feeds the next.',
  },
  {
    title: 'Connect the loop',
    body: 'Link nodes to reveal the compounding path from acquisition to retention and referral.',
  },
  {
    title: 'Export and share',
    body: 'Unlock export once, then share links and PNG snapshots with your GTM team.',
  },
  {
    title: 'Iterate weekly',
    body: 'Re-open from URL hash, refine your loop, and keep your go-to-market system live.',
  },
]

const baseEdge = {
  style: { stroke: '#7fa2ff', strokeWidth: 1.5 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#7fa2ff' },
}

function createNodeId() {
  return `node-${Math.random().toString(36).slice(2, 9)}`
}

function createEdgeId() {
  return `edge-${Math.random().toString(36).slice(2, 9)}`
}

function serializeFlow(nodes: Node<FlywheelNodeData>[], edges: Edge[]): string | null {
  const payload: SharePayload = {
    n: nodes.map((node) => ({
      id: node.id,
      label: node.data.label,
      motion: node.data.motion,
      accent: node.data.accent,
      x: Number(node.position.x.toFixed(1)),
      y: Number(node.position.y.toFixed(1)),
    })),
    e: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    })),
  }

  const encoded = encodeURIComponent(JSON.stringify(payload))
  if (encoded.length > HASH_CHAR_LIMIT) return null
  return `${FLOW_HASH_PREFIX}${encoded}`
}

function parseHash(hash: string): { nodes: Node<FlywheelNodeData>[]; edges: Edge[] } {
  if (!hash.startsWith(FLOW_HASH_PREFIX)) {
    return { nodes: [], edges: [] }
  }

  try {
    const raw = decodeURIComponent(hash.slice(FLOW_HASH_PREFIX.length))
    const parsed = JSON.parse(raw) as SharePayload
    if (!Array.isArray(parsed.n) || !Array.isArray(parsed.e)) {
      return { nodes: [], edges: [] }
    }

    const nodes: Node<FlywheelNodeData>[] = parsed.n
      .filter((node) => typeof node.id === 'string' && typeof node.label === 'string')
      .map((node) => ({
        id: node.id,
        type: 'flywheelNode',
        position: { x: Number(node.x) || 0, y: Number(node.y) || 0 },
        data: {
          label: node.label.slice(0, 80),
          motion: MOTION_MAP.has(node.motion) ? node.motion : 'Custom',
          accent: typeof node.accent === 'string' && node.accent ? node.accent : '#7fa2ff',
        },
      }))

    const nodeIds = new Set(nodes.map((node) => node.id))
    const edges: Edge[] = parsed.e
      .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
      .map((edge) => ({
        id: edge.id || createEdgeId(),
        source: edge.source,
        target: edge.target,
        ...baseEdge,
      }))

    return { nodes, edges }
  } catch {
    return { nodes: [], edges: [] }
  }
}

function FlywheelNode({ data, selected }: NodeProps<Node<FlywheelNodeData>>) {
  return (
    <div
      className={`fly-node${selected ? 'selected' : ''}`}
      style={{ '--node-accent': data.accent } as React.CSSProperties}
    >
      <Handle type="target" position={Position.Top} className="fly-handle" />
      <span className="fly-node-motion">{data.motion}</span>
      <div className="fly-node-label">{data.label}</div>
      <Handle type="source" position={Position.Bottom} className="fly-handle" />
    </div>
  )
}

const nodeTypes = { flywheelNode: FlywheelNode }

function MotionChip({
  motion,
  onDragStart,
  onAdd,
}: {
  motion: (typeof MOTIONS)[number]
  onDragStart: (evt: DragEvent<HTMLButtonElement>, motionName: MotionType) => void
  onAdd: (motionName: MotionType) => void
}) {
  return (
    <button
      type="button"
      className="motion-chip"
      draggable
      onDragStart={(evt) => onDragStart(evt, motion.name)}
      onClick={() => onAdd(motion.name)}
      style={{ '--chip-accent': motion.accent } as React.CSSProperties}
      title={motion.blurb}
    >
      <span className="motion-name">{motion.name}</span>
      <span className="motion-blurb">{motion.blurb}</span>
    </button>
  )
}

function ExportPanel({
  shareMessage,
  onShare,
  onDownloadPng,
  onCopyLink,
}: {
  shareMessage: string | null
  onShare: () => void
  onDownloadPng: () => void
  onCopyLink: () => void
}) {
  return (
    <div className="export-card">
      <div className="export-head">
        <h3>Export</h3>
        <p>Free to play. Unlock once to export and share.</p>
      </div>
      <div className="export-actions">
        <button type="button" onClick={onShare}>
          Share link
        </button>
        <button type="button" onClick={onDownloadPng}>
          Download PNG
        </button>
        <button type="button" onClick={onCopyLink}>
          Copy link
        </button>
      </div>
      <p className="export-status">{shareMessage ?? 'Ready'}</p>
    </div>
  )
}

export default function GtmFlywheelPage() {
  const initialFlow = useMemo(() => {
    if (typeof window === 'undefined')
      return { nodes: [] as Node<FlywheelNodeData>[], edges: [] as Edge[] }
    return parseHash(window.location.hash)
  }, [])

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<FlywheelNodeData>>(initialFlow.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialFlow.edges)
  const [shareMessage, setShareMessage] = useState<string | null>(null)
  const [mobileLibraryOpen, setMobileLibraryOpen] = useState(false)
  const [instance, setInstance] = useState<ReactFlowInstance<Node<FlywheelNodeData>, Edge> | null>(
    null
  )

  const canvasRef = useRef<HTMLDivElement | null>(null)

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((curr) =>
        addEdge(
          {
            id: createEdgeId(),
            ...connection,
            ...baseEdge,
          },
          curr
        )
      )
    },
    [setEdges]
  )

  const addMotionNode = useCallback(
    (motionName: MotionType, x = 160, y = 140) => {
      const template = MOTION_MAP.get(motionName)
      if (!template) return

      const nextId = createNodeId()
      const label = motionName === 'Custom' ? 'Custom Motion' : motionName

      setNodes((curr) => [
        ...curr,
        {
          id: nextId,
          type: 'flywheelNode',
          position: { x, y },
          data: { label, motion: motionName, accent: template.accent },
        },
      ])
    },
    [setNodes]
  )

  const onDragStart = useCallback((event: DragEvent<HTMLButtonElement>, motionName: MotionType) => {
    event.dataTransfer.setData('application/gtm-motion', motionName)
    event.dataTransfer.effectAllowed = 'move'
  }, [])

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      const motionName = event.dataTransfer.getData('application/gtm-motion') as MotionType
      if (!motionName || !instance) return

      const bounds = event.currentTarget.getBoundingClientRect()
      const position = instance.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      })
      addMotionNode(motionName, position.x, position.y)
      setMobileLibraryOpen(false)
    },
    [addMotionNode, instance]
  )

  const loadTemplate = useCallback(() => {
    setNodes(TEMPLATE_NODES)
    setEdges(TEMPLATE_EDGES.map((edge) => ({ ...edge, ...baseEdge })))
    setShareMessage('Template loaded')
  }, [setEdges, setNodes])

  const clearCanvas = useCallback(() => {
    setNodes([])
    setEdges([])
    setShareMessage('Canvas cleared')
    window.history.replaceState(null, '', window.location.pathname)
  }, [setEdges, setNodes])

  const buildShareUrl = useCallback(() => {
    const hash = serializeFlow(nodes, edges)
    if (!hash) {
      setShareMessage('Share payload exceeded 2KB. Trim nodes/edges to export.')
      return null
    }
    const url = `${window.location.origin}${window.location.pathname}${hash}`
    window.history.replaceState(null, '', `${window.location.pathname}${hash}`)
    return url
  }, [edges, nodes])

  const handleCopyLink = useCallback(async () => {
    const url = buildShareUrl()
    if (!url) return
    await navigator.clipboard.writeText(url)
    setShareMessage('Link copied')
  }, [buildShareUrl])

  const handleShareLink = useCallback(async () => {
    const url = buildShareUrl()
    if (!url) return
    if (navigator.share) {
      await navigator.share({ title: 'GTM Flywheel', url })
      setShareMessage('Shared')
      return
    }
    await navigator.clipboard.writeText(url)
    setShareMessage('Shared via copied link')
  }, [buildShareUrl])

  const handleDownloadPng = useCallback(async () => {
    const viewport = canvasRef.current?.querySelector<HTMLElement>('.react-flow__viewport')
    if (!viewport) return
    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(viewport, {
      backgroundColor: '#06080f',
      scale: 2,
      useCORS: true,
      logging: false,
    })
    const link = document.createElement('a')
    link.download = 'gtm-flywheel.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
    setShareMessage('PNG downloaded')
  }, [])

  const libraryItems = useMemo(
    () =>
      MOTIONS.map((motion) => (
        <MotionChip
          key={motion.name}
          motion={motion}
          onDragStart={onDragStart}
          onAdd={(motionName) => addMotionNode(motionName)}
        />
      )),
    [addMotionNode, onDragStart]
  )

  const exportInput = useMemo(
    () => ({
      nodes: nodes.map((node) => ({
        id: node.id,
        label: node.data.label,
        motion: node.data.motion,
      })),
      edges: edges.map((edge) => ({ id: edge.id, source: edge.source, target: edge.target })),
    }),
    [edges, nodes]
  )

  const exportOutput = useMemo(
    () => ({ exportUnlocked: true, nodeCount: nodes.length, edgeCount: edges.length }),
    [edges.length, nodes.length]
  )

  return (
    <div className="gtm-flywheel">
      <AuroraBackground />
      <Header />

      <main className="flywheel-shell">
        <section className="hero">
          <span className="eyebrow">GTM Flywheel</span>
          <h1>Map the compounding loop behind your growth engine.</h1>
          <p>
            Drag motions into the canvas, connect your channels, and turn GTM strategy into a
            shareable operating model.
          </p>
        </section>

        <section className="builder">
          <aside className="library desktop-library">
            <h2>Motion library</h2>
            <p>Drag to canvas or click to add at center.</p>
            <div className="motion-list">{libraryItems}</div>
            <button type="button" className="template-btn" onClick={loadTemplate}>
              Start from template
            </button>
          </aside>

          <div className="canvas-column">
            <div className="canvas-wrap" onDragOver={onDragOver} onDrop={onDrop} ref={canvasRef}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={setInstance}
                nodeTypes={nodeTypes}
                fitView={initialFlow.nodes.length > 0}
                panOnScroll
                selectionOnDrag
                deleteKeyCode={['Backspace', 'Delete']}
                defaultEdgeOptions={baseEdge}
              >
                <Controls position="top-right" />
                <Background gap={20} size={1} color="#2a3344" variant={BackgroundVariant.Dots} />
              </ReactFlow>
              {nodes.length < 3 && (
                <div className="guide-ring" aria-hidden>
                  <div className="ring" />
                  <p>Add at least 3 motions to complete the loop</p>
                </div>
              )}
            </div>

            <div className="export-panel">
              <EmailGate miniAppSlug="gtm-flywheel" pattern="upfront" initialInput={exportInput}>
                {({ submitToApi }) => (
                  <>
                    <SubmitOnce submit={submitToApi} input={exportInput} output={exportOutput} />
                    <ExportPanel
                      shareMessage={shareMessage}
                      onShare={() => void handleShareLink()}
                      onDownloadPng={() => void handleDownloadPng()}
                      onCopyLink={() => void handleCopyLink()}
                    />
                  </>
                )}
              </EmailGate>
            </div>
          </div>
        </section>

        <section className="how-it-works">
          <h2>How it works</h2>
          <div className="how-grid">
            {HOW_STEPS.map((step, index) => (
              <article key={step.title} className="how-card">
                <span className="step-index">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <div className="bottom-bar">
        <button type="button" onClick={clearCanvas}>
          Clear
        </button>
        <button type="button" onClick={loadTemplate}>
          Load template
        </button>
        <a href="https://www.system7.ai/contact" target="_blank" rel="noreferrer">
          Book a call
        </a>
      </div>

      <button
        type="button"
        className="mobile-library-toggle"
        onClick={() => setMobileLibraryOpen((open) => !open)}
      >
        {mobileLibraryOpen ? 'Close motions' : 'Open motions'}
      </button>

      <div className={`mobile-library${mobileLibraryOpen ? 'open' : ''}`}>
        <div className="mobile-library-head">
          <strong>Motion library</strong>
          <button type="button" onClick={() => setMobileLibraryOpen(false)}>
            Close
          </button>
        </div>
        <div className="motion-list">{libraryItems}</div>
      </div>

      <Footer />
      <PageScripts />
    </div>
  )
}
