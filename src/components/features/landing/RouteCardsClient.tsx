'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

import { useInView } from '@/hooks/useInView'
import type { RouteCardData } from '@/types/route'

import { RouteCard } from './RouteCard'
import { SoonCard } from './SoonCard'

type SoonCardData = {
  index: string
  label: string
  tagline: string
  tags: string[]
}

type Props = {
  routes: RouteCardData[]
  soon: SoonCardData
}

export function RouteCardsClient({ routes, soon }: Props) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.3 })
  const [completedIndex, setCompletedIndex] = useState<number>(-1)

  function handleComplete(index: number) {
    setCompletedIndex((prev) => Math.max(prev, index))
  }

  const allDone = completedIndex >= routes.length - 1

  return (
    <>
      <div ref={ref} className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        {routes.map((route, index) => (
          <RouteCard
            key={route.label}
            route={route}
            shouldType={inView && (index === 0 || completedIndex >= index - 1)}
            onTypingComplete={() => handleComplete(index)}
          />
        ))}
      </div>

      {allDone && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-4"
        >
          <SoonCard index={soon.index} label={soon.label} tagline={soon.tagline} tags={soon.tags} />
        </motion.div>
      )}
    </>
  )
}
