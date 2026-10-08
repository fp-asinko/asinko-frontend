'use client'

import { SearchIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'

/**
 * "Search comments" (specs/post-detail-refresh PD-05), a pill with a magnifier. Sending navigates
 * to the same page with `?q=` (PD-06); the server searches and renders the results. Empty, it
 * goes back to all the comments.
 */
export function CommentsSearch({ query }: { query?: string }) {
  const t = useTranslations('postDetail.search')
  const router = useRouter()
  const pathname = usePathname()

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        const q = String(new FormData(event.currentTarget).get('q') ?? '').trim()
        router.push(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname, { scroll: false })
      }}
      className="relative min-w-0 flex-1 basis-full sm:max-w-72 sm:basis-auto"
    >
      <SearchIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        // A new search (or back to all) starts from what the URL says.
        key={query ?? ''}
        type="search"
        name="q"
        defaultValue={query}
        aria-label={t('label')}
        placeholder={t('label')}
        minLength={2}
        maxLength={100}
        // 16px in phones: iOS zooms into smaller fields (design-system.md § Mobile first).
        className="h-11 w-full rounded-full border border-input bg-background pr-4 pl-10 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:h-9 md:text-sm"
      />
    </form>
  )
}
