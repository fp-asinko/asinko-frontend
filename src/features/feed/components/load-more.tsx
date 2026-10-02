'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useRef, useState, useTransition, type ReactNode } from 'react'
import { loadMoreFeed } from '../actions/load-more-feed.action'
import type { FeedParams } from '../schemas/feed-params.schema'

/**
 * Infinite scroll of the feed (H-16). When the button comes into view (IntersectionObserver) or is
 * pressed, the next page arrives already rendered and is appended. The button stays as the
 * accessible fallback of the scroll; it disappears when there are no more pages.
 */
export function LoadMore({ params, cursor }: { params: FeedParams; cursor: string }) {
  const t = useTranslations('feed.loadMore')
  const locale = useLocale()
  const [pages, setPages] = useState<ReactNode[]>([])
  const [next, setNext] = useState<string | null>(cursor)
  const [announcement, setAnnouncement] = useState('')
  const [failed, setFailed] = useState(false)
  const [pending, startTransition] = useTransition()
  const button = useRef<HTMLButtonElement>(null)

  function load() {
    if (!next || pending) return
    setFailed(false)
    startTransition(async () => {
      const result = await loadMoreFeed({ ...params, cursor: next, locale })
      if (!result.ok) {
        setFailed(true)
        return
      }
      setPages((loaded) => [...loaded, result.data.items])
      setNext(result.data.nextCursor)
      setAnnouncement(t('loaded', { count: result.data.count }))
    })
  }

  // Loads by itself when the button scrolls into view, except after a failure (then: by hand).
  useEffect(() => {
    const target = button.current
    if (!target || failed || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) load()
    })
    observer.observe(target)
    return () => observer.disconnect()
  })

  return (
    <>
      {pages.map((page, index) => (
        <ul key={index} className="divide-y border-t">
          {page}
        </ul>
      ))}
      <p role="status" className="sr-only">
        {announcement}
      </p>
      {next && (
        <div className="flex flex-col items-center gap-2 border-t px-4 py-4">
          {failed && (
            <p role="alert" className="type-meta text-destructive">
              {t('error')}
            </p>
          )}
          <button
            ref={button}
            type="button"
            onClick={load}
            disabled={pending}
            className="inline-flex h-9 items-center rounded-full border px-4 type-action text-muted-foreground outline-none hover:bg-surface hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-wait"
          >
            {pending ? t('loading') : t('button')}
          </button>
        </div>
      )}
    </>
  )
}
