'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { flushImpressions, trackImpression } from '../lib/impression-queue'
import { OWN_CLICK } from './card-link'

/** Seen: at least half the card, for at least a second (specs/explore-v1 EX-05). */
export const SEEN_RATIO = 0.5
export const SEEN_MS = 1000

/** A post's path in a link, without the locale: /en/post/1/a → /post/1/a. */
function pathOf(anchor: HTMLAnchorElement) {
  return new URL(anchor.href, window.location.href).pathname.replace(/^\/[a-z]{2}(?=\/)/, '')
}

/**
 * Reports what of one feed page was seen and opened (specs/explore-v1 EX-05 to EX-07), with that
 * page's requestId. Wraps the page's list without boxing it (`contents`) and reads its cards by
 * `data-content-id`; a post also carries `data-content-path`, to tell a click that opens it.
 */
export function ImpressionTracker({
  requestId,
  children,
}: {
  requestId: string
  children: ReactNode
}) {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const list = root.current
    if (!list || typeof IntersectionObserver === 'undefined') return
    const cards = [...list.querySelectorAll<HTMLElement>('article[data-content-id]')]
    // The cards on screen enough, since when each counts (only while the page shows), and the
    // ones already reported (once per page load).
    const inView = new Set<Element>()
    const since = new Map<Element, number>()
    const done = new Set<string>()
    const opened = new Set<string>()

    function report(card: Element, until: number) {
      const start = since.get(card)
      since.delete(card)
      const contentId = (card as HTMLElement).dataset.contentId
      if (start === undefined || !contentId || done.has(contentId)) return
      const dwellMs = Math.round(until - start)
      if (dwellMs < SEEN_MS) return
      done.add(contentId)
      observer.unobserve(card)
      trackImpression(requestId, { contentId, type: 'SEEN', dwellMs })
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= SEEN_RATIO) {
            inView.add(entry.target)
            if (document.visibilityState !== 'hidden' && !since.has(entry.target)) {
              since.set(entry.target, performance.now())
            }
          } else {
            inView.delete(entry.target)
            report(entry.target, performance.now())
          }
        }
      },
      { threshold: SEEN_RATIO },
    )
    for (const card of cards) observer.observe(card)

    // Hidden (another tab, closing it) with a card on screen: it counts up to now. Shown again,
    // what is still on screen starts counting again: a glimpse before hiding is not lost.
    function onVisibility() {
      const now = performance.now()
      if (document.visibilityState === 'hidden') {
        for (const card of [...since.keys()]) report(card, now)
        flushImpressions()
        return
      }
      for (const card of inView) if (!since.has(card)) since.set(card, now)
    }

    function onClick(event: MouseEvent) {
      const target = event.target as Element
      const card = target.closest<HTMLElement>('article[data-content-path]')
      const { contentId, contentPath } = card?.dataset ?? {}
      if (!card || !contentId || !contentPath || opened.has(contentId)) return
      const anchor = target.closest('a[href]')
      // Its title, image or comments; or the card itself, as CardLink opens it.
      const opens = anchor
        ? anchor instanceof HTMLAnchorElement && pathOf(anchor) === contentPath
        : !target.closest(OWN_CLICK) && !window.getSelection()?.toString()
      if (!opens) return
      opened.add(contentId)
      trackImpression(requestId, { contentId, type: 'OPEN' })
    }

    document.addEventListener('visibilitychange', onVisibility)
    list.addEventListener('click', onClick, true)
    return () => {
      // Leaving the page (another feed, a post): what was on screen long enough still counts.
      const now = performance.now()
      for (const card of [...since.keys()]) report(card, now)
      flushImpressions()
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      list.removeEventListener('click', onClick, true)
    }
  }, [requestId])

  return (
    <div ref={root} className="contents">
      {children}
    </div>
  )
}

/** A page with a requestId reports what was seen and opened of it; one without, nothing (EX-09). */
export function Impressions({
  requestId,
  children,
}: {
  requestId: string | null | undefined
  children: ReactNode
}) {
  return requestId ? (
    <ImpressionTracker requestId={requestId}>{children}</ImpressionTracker>
  ) : (
    children
  )
}
