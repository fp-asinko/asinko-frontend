'use client'

import { ThemeProvider } from 'next-themes'
import type { ReactNode } from 'react'

// Light by default regardless of the OS (F-19); the user's choice persists (F-20).
// The nonce lets next-themes' anti-flicker inline script pass the CSP.
export function Providers({ nonce, children }: { nonce: string | undefined; children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      nonce={nonce}
    >
      {children}
    </ThemeProvider>
  )
}
