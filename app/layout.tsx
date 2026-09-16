import type { Metadata, Viewport } from 'next'
import { Geist_Mono, Inter } from 'next/font/google'
import { AnalyticsBoot } from '@/components/AnalyticsBoot'
import '@/styles/tokens.css'

/*
 * Two typefaces, and there were four.
 *
 * Inter set tight, with Geist Mono for anything that is a code, a clock, an address or machine
 * output. The workstation used to have two of its own — a period display face and a typewriter
 * mono — on the theory that a fictional computer typing in its publisher's font is not
 * believable. In practice a present-day forensic tool sets its interface in the system grotesk
 * and its data in a mono, exactly like this, and the costume faces were the last thing on the
 * machine still dressed as the product this repository used to be.
 */
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-geist-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'UNLISTED',
  description:
    'A man has been missing eight days and the police are not looking. You get a laptop image, a locked handset, and one evening at the workstation. Case 001 is free and needs no account.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  openGraph: {
    title: 'UNLISTED — Case 001',
    description: 'He never came home. The police are not looking. Where do you look first?',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#07090b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable}`}>
      <body>
        <AnalyticsBoot />
        {children}
      </body>
    </html>
  )
}
