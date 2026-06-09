import Link from 'next/link'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { AuroraBackground } from '@/components/mini-apps/AuroraBackground'

import styles from './results/[submissionId]/_components/results.module.css'

export const metadata = {
  title: 'Not found · S7 Labs',
}

export default function NotFound() {
  return (
    <div className={styles.page}>
      <AuroraBackground />
      <Header />
      <main className={styles.main}>
        <section className={styles.card}>
          <span className={styles.cornerTopRight} aria-hidden="true" />
          <span className={styles.cornerBottomLeft} aria-hidden="true" />
          <span className={styles.monoLabel}>{'// 404 · NOT FOUND'}</span>
          <h1 className={styles.heading}>This page doesn&apos;t exist.</h1>
          <p className={styles.body}>
            The URL you opened isn&apos;t something we host. It may have been mistyped, expired, or
            moved.
          </p>
          <Link href="/" className={styles.primaryButton}>
            Back to home
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  )
}
