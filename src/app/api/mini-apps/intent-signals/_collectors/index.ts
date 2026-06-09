export type CollectorSignalType = 'hiring' | 'news' | 'tech'

export type CollectorSignalStrength = 'strong' | 'moderate' | 'weak'

export type CollectorSignal = {
  type: CollectorSignalType
  headline: string
  detail: string
  source: string
  sourceUrl: string
  observedAt: string
  strength?: CollectorSignalStrength
}

export type SignalCollector = (domain: string) => Promise<CollectorSignal[]>

export { collectHiringSignals } from './hiring'
export { collectNewsSignals } from './news'
export { collectTechSignals } from './tech'
