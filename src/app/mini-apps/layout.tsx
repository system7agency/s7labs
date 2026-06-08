import { BackToMiniAppsPill } from '@/components/mini-apps/BackToMiniAppsPill'

export default function MiniAppsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BackToMiniAppsPill />
      {children}
    </>
  )
}
