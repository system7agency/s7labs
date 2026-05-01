import type { Metadata } from 'next'
import { Geist, Geist_Mono, Fraunces } from 'next/font/google'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
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
  weight: ['300'],
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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}
