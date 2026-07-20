'use client'

import { useEffect, useId, useRef, useState } from 'react'

type BlueprintDiagramProps = {
  chart: string
  onError?: () => void
}

let mermaidReady = false

async function ensureMermaid() {
  if (mermaidReady) return (await import('mermaid')).default
  const mermaid = (await import('mermaid')).default
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'strict',
    themeVariables: {
      primaryColor: '#16161b',
      primaryTextColor: '#f2f3f5',
      primaryBorderColor: '#4f8cff',
      lineColor: '#4f8cff',
      secondaryColor: '#101014',
      tertiaryColor: '#060608',
      fontFamily: 'ui-monospace, monospace',
    },
  })
  mermaidReady = true
  return mermaid
}

export function BlueprintDiagram({ chart, onError }: BlueprintDiagramProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const renderId = useId().replace(/:/g, '')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (!chart.trim() || !containerRef.current) return
      try {
        const mermaid = await ensureMermaid()
        const { svg } = await mermaid.render(`blueprint-${renderId}`, chart.trim())
        if (cancelled || !containerRef.current) return
        containerRef.current.innerHTML = svg
      } catch {
        if (!cancelled) {
          setFailed(true)
          onError?.()
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [chart, renderId, onError])

  if (failed) return null

  return <div ref={containerRef} className="mermaid-output" />
}

export function PageScripts() {
  // Cursor spotlight + aurora canvas are now provided by <AuroraBackground />.
  return null
}
