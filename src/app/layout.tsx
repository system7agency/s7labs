import type { Metadata } from 'next'
import { Geist, Geist_Mono, Fraunces } from 'next/font/google'

import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  style: 'italic',
  weight: ['300', '500'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'S7 Labs',
  description: 'The innovation sub-brand of System7.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable}`}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
