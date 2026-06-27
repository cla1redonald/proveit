import type { Metadata } from 'next'
import { Playfair_Display, Fira_Code } from 'next/font/google'
import { Agentation } from 'agentation'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-fira-code',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ProveIt Studio',
  description: 'Your validated ideas, as case files.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${firaCode.variable}`}>
      <body>
        {children}
        {/* Local-only feedback toolbar — never ships to studio.proveit.tools (NODE_ENV=production there). */}
        {process.env.NODE_ENV === 'development' && <Agentation />}
      </body>
    </html>
  )
}
