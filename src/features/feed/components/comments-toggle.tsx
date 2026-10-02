'use client'

import { ChevronDownIcon } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useId, useState, useTransition, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { loadCommentsPreview } from '../actions/load-comments-preview.action'

/**
 * The 💬 button of a card (H-28). The first time it opens, it asks the server for the comments
 * preview, already rendered; later toggles reuse it. A failure can be retried by closing and
 * opening again. The panel spans the card's full width under the actions row (prototype).
 */
export function CommentsToggle({
  kind,
  id,
  children,
}: {
  kind: 'post' | 'poll'
  id: string
  /** Button content rendered by the card: icon and count. */
  children: ReactNode
}) {
  const t = useTranslations('feed.comments')
  const locale = useLocale()
  const panelId = useId()
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<ReactNode>(null)
  const [failed, setFailed] = useState(false)
  const [pending, startTransition] = useTransition()

  function toggle() {
    const next = !open
    setOpen(next)
    if (!next || preview !== null || pending) return
    startTransition(async () => {
      const result = await loadCommentsPreview({ kind, id, locale })
      if (result.ok) setPreview(result.data)
      setFailed(!result.ok)
    })
  }

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={toggle}
        className="inline-flex min-h-7 items-center gap-1.5 rounded-sm type-action text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {children}
        <ChevronDownIcon
          aria-hidden
          className={cn(
            'size-3.5 transition-transform motion-reduce:transition-none',
            open && 'rotate-180',
          )}
        />
      </button>
      {/* Always mounted: a live region inserted with its text already in it is often not read. */}
      <span role="status" className="sr-only">
        {open && pending ? t('loading') : ''}
      </span>
      {open && (
        <div
          id={panelId}
          // Bleeds to the card edges: negative margins plus the same extra width (2rem / 3rem).
          className="order-last -mx-4 mt-1 -mb-4.5 basis-[calc(100%+2rem)] border-t bg-surface px-3.5 pt-2.5 pb-1.5 md:-mx-6 md:-mb-5.5 md:basis-[calc(100%+3rem)]"
        >
          {pending ? (
            <p className="py-1 type-meta text-muted-foreground">{t('loading')}</p>
          ) : failed ? (
            <p role="alert" className="py-1 type-meta text-muted-foreground">
              {t('error')}
            </p>
          ) : (
            preview
          )}
        </div>
      )}
    </>
  )
}
