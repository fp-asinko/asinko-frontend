'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useId, useState } from 'react'
import { HoverCard, HoverCardContent } from '@/components/ui/hover-card'
import { Skeleton } from '@/components/ui/skeleton'
import type { PreviewTarget } from '@/lib/communities/preview'
import { getPreview } from '../actions/get-preview.action'
import type { Preview } from '../communities.types'
import { PreviewCard } from './preview-card'

// Every card seen in this visit: shown again at once (MP-08). Membership changes do not go stale:
// the buttons read them from JoinedProvider.
const seen = new Map<string, Preview>()

/**
 * The hover card of one link (specs/mention-preview § 2), downloaded the first time a card is
 * wanted: the shadcn HoverCard anchored to the link, with no Trigger (the links are the server's).
 * A skeleton while the data travels; if it fails, no card (the link still works).
 */
export function PreviewPopover({
  anchor,
  target,
  open,
  onClose,
}: {
  anchor: HTMLElement
  target: PreviewTarget
  open: boolean
  onClose: () => void
}) {
  const t = useTranslations('preview')
  const summaryId = useId()
  const key = `${target.kind}:${target.slug}`
  const [answer, setAnswer] = useState<{ key: string; failed: boolean } | null>(null)
  const preview = seen.get(key)
  const failed = !preview && answer?.key === key && answer.failed

  useEffect(() => {
    if (seen.has(key)) return
    let live = true
    void getPreview(target).then((result) => {
      if (result.ok) seen.set(key, result.data)
      if (live) setAnswer({ key, failed: !result.ok })
    })
    return () => {
      live = false
    }
    // The target is the key: a new object with the same key is the same card.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by `key`
  }, [key])

  // The link is described by the card's summary while it shows (a screen reader hears it, Q1).
  useEffect(() => {
    if (!open || !preview) return
    const before = anchor.getAttribute('aria-describedby')
    anchor.setAttribute('aria-describedby', before ? `${before} ${summaryId}` : summaryId)
    return () => {
      if (before) anchor.setAttribute('aria-describedby', before)
      else anchor.removeAttribute('aria-describedby')
    }
  }, [anchor, open, preview, summaryId])

  return (
    <HoverCard open={open && !failed} onOpenChange={(next) => !next && onClose()}>
      <HoverCardContent
        anchor={anchor}
        side="bottom"
        align="start"
        alignOffset={0}
        sideOffset={8}
        data-preview-card
        // Border and the one shadow of the system: it floats over the page (design-system.md).
        // Important: shadcn's shadow-md (none here) stays in the classes and comes later in the CSS.
        className="w-90 max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border p-0 shadow-float! ring-0"
      >
        {preview ? (
          <PreviewCard preview={preview} summaryId={summaryId} />
        ) : (
          <div role="status">
            <span className="sr-only">{t('loading')}</span>
            <Skeleton className="h-24 rounded-none" />
            <div className="space-y-2 p-4">
              <Skeleton className="size-14 rounded-xl" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  )
}
