'use client'

import type { ReactNode } from 'react'

import type {
  Department,
  FindPeopleResult as FindPeopleResultType,
  Person,
  Seniority,
} from '@/app/api/mini-apps/find-people/types'
import '../page-styles.css'

import { EmployeeCard } from './EmployeeCard'

export type FindPeopleInput = { company?: string; domain?: string }
export type FindPeopleOutput = FindPeopleResultType

export const SENIORITIES: Array<'All' | Seniority> = [
  'All',
  'C-suite',
  'VP',
  'Director',
  'Manager',
  'Individual',
]

export const DEPARTMENTS: Array<'All' | Department> = [
  'All',
  'Engineering',
  'Sales',
  'Marketing',
  'Product',
  'Operations',
  'Other',
]

export const PAGE_INCREMENT = 25

type Props = {
  input: FindPeopleInput
  output: FindPeopleOutput
  /**
   * When true, render only the inner result body (head + filters slot + list +
   * footer slots) without the surrounding `.find-people / .panel-wrap /
   * .panel / .panel-body / .fp-state` wrappers. The inline mini-app page
   * provides those itself and keeps its own filter pills + load-more button
   * at page level, so it consumes the component in bare mode. The standalone
   * `/results/[id]` route uses the default (full) render.
   */
  bare?: boolean
  /**
   * Optional render slot for the filter row (inline page passes its own
   * interactive `<FilterPills />` rows).
   */
  renderFilters?: () => ReactNode
  /**
   * Optional render slot for the list footer (inline page renders a
   * paginator + "Search another company" button).
   */
  renderFooter?: () => ReactNode
  /**
   * Override the visible people list (inline page provides a
   * filtered + paginated slice). Defaults to `output.people`.
   */
  visiblePeople?: Person[]
  /**
   * Override the count label rendered in the head. Inline page passes
   * "Showing 25 of ~412 employees"; standalone renders
   * "<n> employees".
   */
  countLabel?: string
}

function ResultBody({
  output,
  renderFilters,
  renderFooter,
  visiblePeople,
  countLabel,
}: {
  output: FindPeopleOutput
  renderFilters?: () => ReactNode
  renderFooter?: () => ReactNode
  visiblePeople?: Person[]
  countLabel?: string
}) {
  const people = visiblePeople ?? output.people
  const label =
    countLabel ?? `${people.length} of ${output.totalEmployees.toLocaleString()} employees`
  return (
    <>
      <div className="fp-result-head">
        <div>
          <span className="company">{output.companyName}</span>
          <span className="domain">{output.companyDomain}</span>
        </div>
        <span className="count">{label}</span>
      </div>

      {renderFilters ? <div className="fp-filters">{renderFilters()}</div> : null}

      <div className="fp-list">
        {people.map((p, i) => (
          <EmployeeCard key={`${p.fullName}-${i}`} person={p} linkable />
        ))}
      </div>

      {renderFooter ? renderFooter() : null}
    </>
  )
}

export function FindPeopleResult({
  input,
  output,
  bare = false,
  renderFilters,
  renderFooter,
  visiblePeople,
  countLabel,
}: Props) {
  void input
  if (bare) {
    return (
      <ResultBody
        output={output}
        renderFilters={renderFilters}
        renderFooter={renderFooter}
        visiblePeople={visiblePeople}
        countLabel={countLabel}
      />
    )
  }
  return (
    <div className="find-people">
      <div className="panel-wrap">
        <div className="panel">
          <div className="panel-body">
            <section className="fp-state active">
              <ResultBody
                output={output}
                renderFilters={renderFilters}
                renderFooter={renderFooter}
                visiblePeople={visiblePeople}
                countLabel={countLabel}
              />
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
