import { BackToMiniAppsPill } from '@/components/mini-apps/BackToMiniAppsPill'

// Canonical design-system layer for the mini-apps gallery. Tokens first, then
// the shared component classes that consume them. Imported once here so every
// mini-app route gets the unified buttons/inputs/cards/result styles without
// per-app duplication. Classes resolve against the `.mini-app-scope` ancestor
// each app applies to its root element.
import '@/styles/mini-app-tokens.css'
import '@/styles/mini-app-ui.css'

export default function MiniAppsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BackToMiniAppsPill />
      {children}
    </>
  )
}
