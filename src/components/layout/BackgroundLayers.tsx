import { AuroraCanvas } from './AuroraCanvas'
import { CursorSpotlight } from './CursorSpotlight'

export function BackgroundLayers() {
  return (
    <>
      <div className="bg-dots" aria-hidden="true" />
      <AuroraCanvas />
      <div className="bg-grain" aria-hidden="true" />
      <CursorSpotlight />
    </>
  )
}
