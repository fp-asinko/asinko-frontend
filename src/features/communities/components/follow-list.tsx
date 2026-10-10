'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Fragment, useEffect, useRef, useState, useTransition, type ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { loadPeople } from '../actions/load-people.action'
import type { PeopleSource } from '../communities.types'
import { CloudOffIcon, UsersIcon } from 'lucide-react'
import { EmptyState } from '@/components/organisms/empty-state'

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; pages: ReactNode[]; count: number; next: string | null }

/**
 * A list of people, a tab of a person's lists (specs/follow-lists FL-03, FL-04) or a community's
 * members (specs/community-members CM-03, CM-04): asks its first page when it first shows,
 * then "Load more" (also when it scrolls into view). Skeleton rows while loading, an empty state
 * that speaks to you on your own profile, and a local error with Retry. A status region, always
 * there, says what happens (loading, failed, N more loaded); the focus never falls out of the
 * window when a button it was on goes away (WCAG 2.4.3).
 */
export function FollowList({
  source,
  handle,
  isSelf,
}: {
  source: PeopleSource
  /** @maria or #defi: the list's name and its empty state. */
  handle: string
  isSelf: boolean
}) {
  const t = useTranslations('communities.follows')
  const locale = useLocale()
  const [state, setState] = useState<State>({ status: 'loading' })
  const [announcement, setAnnouncement] = useState('')
  const [pending, startTransition] = useTransition()
  const [failedMore, setFailedMore] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLUListElement>(null)
  // How many rows there were before "Load more": the first new one comes right after them.
  const shownBefore = useRef(0)
  const button = useRef<HTMLButtonElement>(null)
  const started = useRef(false)
  // Each page once: the scroll and a click can ask for the same one at the same time.
  const requested = useRef(new Set<string>())
  // Where the focus goes after the next render, when the button it was on went away.
  const pendingFocus = useRef<'root' | 'newPage' | null>(null)

  function load(cursor?: string) {
    if (cursor) {
      if (requested.current.has(cursor)) return
      requested.current.add(cursor)
    }
    // Emptied first: the same text twice is announced twice.
    setAnnouncement(cursor ? '' : t('loading'))
    startTransition(async () => {
      const result = await loadPeople({ source, cursor, locale })
      if (!result.ok) {
        if (cursor) {
          // Failed: the same page can be asked again.
          requested.current.delete(cursor)
          setFailedMore(true)
        } else {
          setState({ status: 'error' })
        }
        setAnnouncement(cursor ? t('loadError') : t('error'))
        return
      }
      setFailedMore(false)
      setState((current) => ({
        status: 'ready',
        pages:
          current.status === 'ready' && cursor
            ? [...current.pages, result.data.items]
            : [result.data.items],
        count: (current.status === 'ready' && cursor ? current.count : 0) + result.data.count,
        next: result.data.nextCursor,
      }))
      setAnnouncement(cursor ? t('loaded', { count: result.data.count }) : '')
    })
  }

  // The first page, once, when the tab first shows.
  useEffect(() => {
    if (started.current) return
    started.current = true
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per tab
  }, [])

  // After a render that removed the focused button: the list, or the page that just arrived.
  useEffect(() => {
    const target = pendingFocus.current
    if (!target) return
    if (target === 'root' && root.current) {
      pendingFocus.current = null
      root.current.focus()
    }
    if (target === 'newPage' && state.status === 'ready' && state.count > shownBefore.current) {
      pendingFocus.current = null
      list.current?.children[shownBefore.current]?.querySelector<HTMLElement>('a')?.focus()
    }
  })

  const next = state.status === 'ready' ? state.next : null
  // Loads by itself when "Load more" scrolls into view, except after a failure.
  useEffect(() => {
    const target = button.current
    if (!target || !next || failedMore || pending || typeof IntersectionObserver === 'undefined') {
      return
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) load(next)
    })
    observer.observe(target)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load is recreated each render
  }, [next, failedMore, pending])

  let body: ReactNode
  if (state.status === 'loading') {
    body = (
      <div aria-hidden data-testid="follow-skeleton">
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className="flex min-h-14 items-center gap-3 px-4 py-2">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    )
  } else if (state.status === 'error') {
    body = (
      <EmptyState
        icon={<CloudOffIcon />}
        title={t('error')}
        description={t('errorBody')}
        action={
          <button
            type="button"
            onClick={() => {
              pendingFocus.current = 'root'
              setState({ status: 'loading' })
              load()
            }}
            className="inline-flex h-9 tap items-center rounded-full bg-muted px-4 type-action outline-none hover:bg-muted-hover focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {t('retry')}
          </button>
        }
      />
    )
  } else if (state.count === 0) {
    body = (
      <EmptyState
        icon={<UsersIcon />}
        title={
          isSelf && source.list !== 'members'
            ? t(`emptySelf.${source.list}`)
            : t(`empty.${source.list}`, { handle })
        }
      />
    )
  } else {
    body = (
      <>
        <ul ref={list} aria-label={t(`listLabel.${source.list}`, { handle })}>
          {state.pages.map((page, index) => (
            <Fragment key={index}>{page}</Fragment>
          ))}
        </ul>
        {state.next && (
          <div className="flex flex-col items-center gap-2 px-4 py-4">
            {failedMore && (
              <p role="alert" className="type-meta text-destructive">
                {t('loadError')}
              </p>
            )}
            <button
              ref={button}
              type="button"
              onClick={() => {
                if (!state.next) return
                pendingFocus.current = 'newPage'
                shownBefore.current = state.count
                load(state.next)
              }}
              aria-disabled={pending || undefined}
              className="inline-flex h-11 tap items-center rounded-full bg-muted px-5 type-action text-muted-foreground outline-none hover:bg-muted-hover hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:cursor-wait aria-disabled:active:scale-100"
            >
              {pending ? t('loadingMore') : t('loadMore')}
            </button>
          </div>
        )}
      </>
    )
  }

  return (
    // Focusable only from code: where the focus lands when Retry goes away.
    <div
      ref={root}
      tabIndex={-1}
      // Seen where the focus lands after Retry (WCAG 2.4.7).
      className="outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
    >
      <p role="status" className="sr-only">
        {announcement}
      </p>
      {body}
    </div>
  )
}
