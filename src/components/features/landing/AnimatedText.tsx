'use client'

import { motion } from 'framer-motion'

import { useReducedMotion } from '@/hooks/useReducedMotion'

type Props = {
  text: string
  delay?: number
  staggerPerChar?: number
  className?: string
}

export function AnimatedText({ text, delay = 0, staggerPerChar = 0.02, className }: Props) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <span className={className}>{text}</span>
  }

  return (
    <motion.span
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerPerChar,
            delayChildren: delay,
          },
        },
      }}
      aria-label={text}
    >
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { opacity: 0, y: 4 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          aria-hidden="true"
          style={{ display: 'inline-block', whiteSpace: 'pre' }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  )
}
