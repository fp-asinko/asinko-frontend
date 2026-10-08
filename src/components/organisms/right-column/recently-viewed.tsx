'use client'

import { ArrowBigUpIcon, MessageSquareIcon } from 'lucide-react'
import { useFormatter, useNow, useTranslations } from 'next-intl'
import { useId, useRef, useSyncExternalStore } from 'react'
import { Link } from '@/i18n/navigation'
import { clearRecent, readRecent, readRecentOnServer, subscribeRecent } from '@/lib/recently-viewed'

/** When it was seen; within the last minute, "now" (not "1s ago", which looks like a counter). */
const seen = (viewedAt: string, now: Date) => {
  const date = new Date(viewedAt)
  return now.getTime() - date.getTime() < 60_000 ? now : date
}

/**
 * "Recently viewed" in the right column, as the prototype (specs/recently-viewed § 3): the posts
 * opened lately, newest first, each a link to its page with where it was published, when, its
 * title and its numbers from that visit. "Clear" empties it. Kept in this browser; follows the
 * changes of this tab and the others. Downloaded after the page loads (RecentlyViewedSlot).
 */
export function RecentlyViewed() {
  const t = useTranslations('rightColumn.recent')
  const format = useFormatter()
  // The "12 min" moves on while the page stays open.
  const now = useNow({ updateInterval: 60_000 })
  const titleId = useId()
  const items = useSyncExternalStore(subscribeRecent, readRecent, readRecentOnServer)
  const heading = useRef<HTMLHeadingElement>(null)
  const compact = (value: number) =>
    format.number(value, { notation: 'compact', maximumFractionDigits: 1 })

  return (
    <section aria-labelledby={titleId} className="mx-3.5 mb-3.5">
      <div className="flex items-center justify-between border-b px-1 pt-1 pb-2">
        {/* Takes the focus after "Clear", whose button goes away (WCAG 2.4.3). */}
        <h2
          ref={heading}
          id={titleId}
          tabIndex={-1}
          className="type-section text-muted-foreground outline-none"
        >
          {t('title')}
        </h2>
        {items.length > 0 && (
          <button
            type="button"
            onClick={() => {
              clearRecent()
              heading.current?.focus()
            }}
            aria-label={t('clearLabel')}
            className="-my-1 inline-flex min-h-6 items-center rounded-sm px-1 type-action outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {t('clear')}
          </button>
        )}
      </div>
      {items.length === 0 ? (
        // Said when the list empties (Clear), not only seen.
        <p role="status" className="px-1 py-6 text-center type-meta text-muted-foreground">
          {t('empty')}
        </p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id} className="border-b">
              <Link
                href={item.href}
                className="block rounded-md px-1 py-2.5 outline-none hover:bg-surface focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="mb-1 flex items-center gap-2 type-meta">
                  <span className="truncate font-bold text-muted-foreground">{item.label}</span>
                  <span className="sr-only">:</span>{' '}
                  <span className="ml-auto shrink-0 text-muted-foreground">
                    {format.relativeTime(seen(item.viewedAt, now), { now, style: 'narrow' })}
                  </span>
                </span>
                {/* A space between the parts: read as one sentence, not glued together. */}{' '}
                <span className="line-clamp-2 type-small font-semibold wrap-anywhere">
                  {item.title}
                </span>{' '}
                <span className="mt-1.5 flex items-center gap-3 type-meta text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <ArrowBigUpIcon aria-hidden className="size-3.5" />
                    <span aria-hidden>{compact(item.score)}</span>
                    <span className="sr-only">{t('votes', { count: item.score })}</span>
                  </span>{' '}
                  <span className="inline-flex items-center gap-1">
                    <MessageSquareIcon aria-hidden className="size-3.5" />
                    <span aria-hidden>{compact(item.comments)}</span>
                    <span className="sr-only">{t('comments', { count: item.comments })}</span>
                  </span>{' '}
                  <span className="ml-auto rounded-full bg-muted px-2 font-semibold uppercase">
                    {t(`kinds.${item.kind}`)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
