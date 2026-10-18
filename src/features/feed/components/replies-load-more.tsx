'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useRef, useState, useTransition, type ReactNode } from 'react'
import { loadMoreReplies } from '../actions/load-more-replies.action'

/**
 * "Load more" of a person's replies (specs/backend-adoption BK-03), as the theses': the next page arrives
 * rendered and is appended. Only the button,
 * whose press moves the focus to the first new reply (WCAG 2.4.3).
 */
export function RepliesLoadMore({ userId, cursor }: { userId: string; cursor: string }) {
  const t = useTranslations('feed.replies.more')
  const locale = useLocale()
  const [pages, setPages] = useState<ReactNode[]>([])
  const [next, setNext] = useState<string | null>(cursor)
  const [announcement, setAnnouncement] = useState('')
  const [failed, setFailed] = useState(false)
  const [pending, startTransition] = useTransition()
  const lastPage = useRef<HTMLUListElement>(null)
  const focusNewPage = useRef(false)

  function load() {
    if (!next || pending) return
    setFailed(false)
    // Emptied first: two loads of the same size are announced both times.
    setAnnouncement('')
    startTransition(async () => {
      const result = await loadMoreReplies({ userId, cursor: next, locale })
      if (!result.ok) {
        setFailed(true)
        return
      }
      focusNewPage.current = true
      setPages((loaded) => [...loaded, result.data.items])
      setNext(result.data.nextCursor)
      setAnnouncement(t('loaded', { count: result.data.count }))
    })
  }

  useEffect(() => {
    if (!focusNewPage.current) return
    focusNewPage.current = false
    const first = lastPage.current?.querySelector('article')
    if (!first) return
    first.tabIndex = -1
    first.focus()
  }, [pages])

  return (
    <>
      {pages.map((page, index) => (
        <ul
          key={index}
          ref={index === pages.length - 1 ? lastPage : undefined}
          className="divide-y border-t [&_article]:outline-none [&_article:focus-visible]:ring-3 [&_article:focus-visible]:ring-ring/50 [&_article:focus-visible]:ring-inset"
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
            type="button"
            onClick={load}
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
