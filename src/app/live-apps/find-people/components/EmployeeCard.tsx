'use client'

import { clsx } from 'clsx'

import type { Person, Seniority } from '@/app/api/mini-apps/find-people/types'

const SENIORITY_CLASS: Record<Seniority, string> = {
  'C-suite': 'csuite',
  VP: 'vp',
  Director: 'director',
  Manager: 'manager',
  Individual: 'individual',
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase()
}

function avatarHue(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return h % 360
}

export function EmployeeCard({ person, linkable = true }: { person: Person; linkable?: boolean }) {
  const hue = avatarHue(person.fullName)
  return (
    <article className="fp-card">
      <div
        className="fp-avatar"
        style={{
          background: `linear-gradient(135deg, hsl(${hue} 60% 22%), hsl(${(hue + 40) % 360} 50% 14%))`,
          color: `hsl(${hue} 80% 78%)`,
        }}
        aria-hidden
      >
        {initials(person.fullName)}
      </div>
      <div className="fp-card-body">
        <h3 className="fp-name">{person.fullName}</h3>
        <p className="fp-title">{person.title}</p>
        <div className="fp-badges">
          {person.seniority ? (
            <span className={clsx('fp-badge', SENIORITY_CLASS[person.seniority])}>
              {person.seniority}
            </span>
          ) : null}
          {person.department ? <span className="fp-badge dept">{person.department}</span> : null}
        </div>
      </div>
      {person.linkedinUrl ? (
        <a
          href={linkable ? person.linkedinUrl : undefined}
          target="_blank"
          rel="noopener noreferrer"
          className={clsx('fp-linkedin', { disabled: !linkable })}
          aria-label={`Open ${person.fullName} on LinkedIn`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v16H0zm7.5 0H12v2.2h.06c.63-1.18 2.18-2.4 4.49-2.4 4.8 0 5.69 3.15 5.69 7.26V24h-5v-7.1c0-1.69-.03-3.86-2.36-3.86-2.36 0-2.72 1.84-2.72 3.74V24h-5z" />
          </svg>
        </a>
      ) : (
        <span aria-hidden style={{ width: 32, height: 32 }} />
      )}
    </article>
  )
}
