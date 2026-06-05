'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { formatCurrency } from '@/lib/insights/format'

type Point = { date: string; costUsd: number }

type Props = {
  title: string
  data: Point[]
  error?: boolean
}

function formatYTick(v: number): string {
  if (v === 0) return '$0'
  if (v < 1) return `$${v.toFixed(2)}`
  if (v < 100) return `$${v.toFixed(1)}`
  return `$${Math.round(v)}`
}

function formatXTick(d: string): string {
  // YYYY-MM-DD → "Jun 4"
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return d
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function ChartTooltip(props: {
  active?: boolean
  payload?: Array<{ value?: number; payload?: Point }>
}) {
  if (!props.active || !props.payload || props.payload.length === 0) return null
  const p = props.payload[0]
  const date = p?.payload?.date
  const cost = p?.value ?? 0
  return (
    <div className="ins-chart-tooltip">
      <div className="ins-chart-tooltip-date">
        {date
          ? new Date(date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })
          : ''}
      </div>
      <div className="ins-chart-tooltip-value">{formatCurrency(cost)}</div>
    </div>
  )
}

export function DailySpendChart({ title, data, error }: Props) {
  const hasData = !error && data.some((d) => d.costUsd > 0)
  // For dense ranges, skip x-axis labels so they don't overlap.
  const interval = data.length <= 14 ? 0 : data.length <= 30 ? 4 : data.length <= 60 ? 9 : 14
  const prefersReduced =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  return (
    <article className="ins-card">
      <h2 className="ins-card-title">{title}</h2>
      {error ? (
        <div className="ins-placeholder-body">Data unavailable.</div>
      ) : !hasData ? (
        <div className="ins-placeholder-body">No data in this range.</div>
      ) : (
        <div className="ins-chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 8 }}>
              <defs>
                <linearGradient id="ins-spend-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#04e3ee" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#04e3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatXTick}
                interval={interval}
                tick={{ fill: '#6b6c75', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                tickLine={false}
                tickMargin={8}
                angle={-30}
                dy={6}
              />
              <YAxis
                tickFormatter={formatYTick}
                tick={{ fill: '#6b6c75', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: 'rgba(4,227,238,0.25)', strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="costUsd"
                stroke="#04e3ee"
                strokeWidth={2}
                fill="url(#ins-spend-fill)"
                isAnimationActive={!prefersReduced}
                animationDuration={prefersReduced ? 0 : 500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  )
}
