'use client'

import { useEffect, useRef } from 'react'

export type SubmitCost = {
  model: string
  inputTokens: number
  outputTokens: number
  costUsd: number
}

type Props = {
  submit: (input: object, output: object, cost?: SubmitCost) => Promise<void>
  input: object
  output: object
  cost?: SubmitCost
}

export function SubmitOnce({ submit, input, output, cost }: Props) {
  const fired = useRef(false)
  useEffect(() => {
    if (fired.current) return
    fired.current = true
    void submit(input, output, cost)
    // Only fire on first mount per result; subsequent prop changes are intentional no-ops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
