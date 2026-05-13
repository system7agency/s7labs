import './page-styles.css'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'

import { MiniAppsPageClient } from './_components/MiniAppsPageClient'
import { PageScripts } from './PageScripts'

export const metadata = {
  title: 'Mini Apps — S7 Labs',
  description:
    'Explore live mini-apps built by System7. Each one is a compact product you can open, test and learn from — a marketplace of small software products that show how useful software can solve specific problems.',
}

export default function MiniAppsPage() {
  return (
    <div className="mini-apps-lab">
      <div className="bg-stack" aria-hidden="true">
        <canvas id="aurora" />
        <div className="bg-dots" />
      </div>
      <div className="bg-spotlight" aria-hidden="true" />
      <div className="bg-grain" aria-hidden="true" />

      <Header />

      <main>
        <MiniAppsPageClient />
      </main>

      <Footer />

      <PageScripts />
    </div>
  )
}
