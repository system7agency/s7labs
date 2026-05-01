import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

type Props = HTMLAttributes<HTMLDivElement>

export function Container({ className, ...props }: Props) {
  return <div className={cn('mx-auto w-full max-w-[1280px] px-6 md:px-8', className)} {...props} />
}
