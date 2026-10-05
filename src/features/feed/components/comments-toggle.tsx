'use client'

import { ChevronDownIcon } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useId, useState, useTransition, type ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
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
  // Mounted from the first opening on, so closing can animate too (M-03).
  const [mounted, setMounted] = useState(false)
  const [preview, setPreview] = useState<ReactNode>(null)
  const [failed, setFailed] = useState(false)
  const [pending, startTransition] = useTransition()

  function toggle() {
    const next = !open
    setOpen(next)
    setMounted(true)
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
        aria-controls={mounted ? panelId : undefined}
        onClick={toggle}
        // The gray pill of the card actions (HR-09), darker while open.
        className="inline-flex h-9.5 tap items-center gap-1.5 rounded-full bg-muted px-3 type-action text-muted-foreground outline-none hover:bg-muted-hover hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:bg-muted-hover aria-expanded:text-foreground"
      >
        {children}
        <ChevronDownIcon
          aria-hidden
          className={cn(
            'size-3.5 transition-transform ease-out',
            open ? 'rotate-180 duration-200' : 'duration-150',
          )}
        />
      </button>
      {/* Always mounted: a live region inserted with its text already in it is often not read. */}
      <span role="status" className="sr-only">
        {open && pending ? t('loading') : ''}
      </span>
      {mounted && (
        <div
          id={panelId}
          // Closed: no focus, not read (WCAG), while the height animates to 0.
          inert={!open}
          aria-hidden={!open || undefined}
          // The full width of the card content, as a rounded box inside the card (FC-07). It
          // animates its height with grid rows: 0fr closed, 1fr open (M-03).
          className={cn(
            // Opening (what the person wants to see) takes 200ms; closing snaps in 150ms.
            'order-last grid basis-full transition-[grid-template-rows,margin] ease-out',
            open ? 'mt-1.5 grid-rows-[1fr] duration-200' : 'mt-0 grid-rows-[0fr] duration-150',
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="rounded-lg border bg-surface px-3.5 py-3">
              {pending ? (
                // Two comments tall, like a typical preview: the box barely moves when they arrive.
                // Decorative: the status above announces the loading.
                <div aria-hidden data-testid="comments-skeleton" className="flex flex-col gap-3.5">
                  {[0, 1].map((row) => (
                    <div key={row} className="flex gap-2.5">
                      <Skeleton className="size-5 shrink-0 rounded-full" />
                      <div className="flex flex-1 flex-col gap-1.5">
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-3.5 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : failed ? (
                <p role="alert" className="py-1 type-meta text-muted-foreground">
                  {t('error')}
                </p>
              ) : (
                preview
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
