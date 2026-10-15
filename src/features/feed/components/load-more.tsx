'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useRef, useState, useTransition, type ReactNode } from 'react'
import { loadMoreFeed } from '../actions/load-more-feed.action'
import type { FeedParams } from '../schemas/feed-params.schema'

/**
 * Infinite scroll of the feed (H-16). When the button comes into view (IntersectionObserver) or is
 * pressed, the next page arrives already rendered and is appended. The button stays as the
 * accessible fallback of the scroll; it disappears when there are no more pages.
 *
 * Focus (WCAG 2.4.3): after a load the person asked for (click or keyboard), focus moves to the
 * first new card, so it is not left behind the new content nor lost when the button goes away.
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
  const lastPage = useRef<HTMLUListElement>(null)
  const focusNewPage = useRef(false)

  function load(byHand: boolean) {
    if (!next || pending) return
    setFailed(false)
    focusNewPage.current = byHand
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

  // Move focus to the first card of the page that just arrived, when asked by hand.
  useEffect(() => {
    if (!focusNewPage.current) return
    focusNewPage.current = false
    const first = lastPage.current?.querySelector('article')
    if (!first) return
    first.tabIndex = -1
    first.focus()
  }, [pages])

  // Loads by itself when the button scrolls into view, except after a failure (then: by hand).
  useEffect(() => {
    const target = button.current
    if (!target || failed || pending || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) load(false)
    })
    observer.observe(target)
    return () => observer.disconnect()
    // load reads the latest state through these dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load is recreated each render
  }, [next, failed, pending])

  return (
    <>
      {pages.map((page, index) => (
        <ul
          key={index}
          ref={index === pages.length - 1 ? lastPage : undefined}
          className="stagger divide-y border-t [&_article]:outline-none [&_article:focus-visible]:ring-3 [&_article:focus-visible]:ring-ring/50 [&_article:focus-visible]:ring-inset"
        >
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
            onClick={() => load(true)}
            aria-disabled={pending || undefined}
            className="inline-flex h-11 tap items-center rounded-full bg-muted px-5 type-action text-muted-foreground outline-none hover:bg-muted-hover hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:cursor-wait"
          >
            {pending ? t('loading') : t('button')}
          </button>
        </div>
      )}
    </>
  )
}
