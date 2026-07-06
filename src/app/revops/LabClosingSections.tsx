import type { ReactNode } from 'react'

import { InsideSystem7Section } from './InsideSystem7Section'
import { LiveAppsSection } from './LiveAppsSection'
import { StartHereSection } from './StartHereSection'

/* ==========================================================================
   LabClosingSections — the doc's "fixed repeated module" sequence shared by
   every lab route (RevOps, Agent, Build): Inside System7 → Start here →
   Live apps, in that order. Only the copy varies by route; anything omitted
   falls back to each module's own default (the RevOps copy).
   ========================================================================== */

type LabClosingSectionsProps = {
  inside?: { header?: ReactNode; subhead?: ReactNode }
  start?: { header?: ReactNode; subhead?: ReactNode }
  live?: { subhead?: ReactNode }
}

export function LabClosingSections({ inside, start, live }: LabClosingSectionsProps = {}) {
  return (
    <>
      <InsideSystem7Section header={inside?.header} subhead={inside?.subhead} />
      <StartHereSection header={start?.header} subhead={start?.subhead} />
      <LiveAppsSection subhead={live?.subhead} />
    </>
  )
}
