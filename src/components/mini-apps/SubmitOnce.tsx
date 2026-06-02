'use client'

import { useEffect, useRef } from 'react'

type Props = {
  submit: (input: object, output: object) => Promise<void>
  input: object
  output: object
}

export function SubmitOnce({ submit, input, output }: Props) {
  const fired = useRef(false)
  useEffect(() => {
    if (fired.current) return
    fired.current = true
    void submit(input, output)
    // Only fire on first mount per result; subsequent prop changes are intentional no-ops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
