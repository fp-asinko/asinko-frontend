'use client'

import './globals.css'

// Last resort when the root layout itself fails: no layout, no providers, no translations.
// The only hardcoded text in the app (design.md §10), in English (the default locale).
export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh items-center justify-center p-6 text-center">
        <title>Asinko</title>
        <main className="flex max-w-md flex-col items-center gap-3">
          <h1 className="text-title-2">Something went wrong</h1>
          <p className="text-muted-foreground">An unexpected error occurred. Please try again.</p>
          <button
            type="button"
            onClick={() => retry()}
            className="mt-3 min-h-11 rounded-lg bg-primary px-5 text-headline text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
