'use client'

import { useTranslations } from 'next-intl'
import { useRef, useState, type ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ActionResult } from '@/lib/result'
import { cn } from '@/lib/utils'

/** The preview's Server Action (the feed's card), passed down from the page (structure.md). */
export type PreviewAction = (draft: unknown) => Promise<ActionResult<{ card: ReactNode }>>

/** The body's box, as Reddit's: its border darkens while writing in it (SF-04, SF-07). */
const BOX =
  'rounded-2xl border border-input transition-colors duration-150 focus-within:border-foreground/60'

const TAB =
  'h-8 rounded-full px-3 type-action text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-active:bg-muted data-active:text-foreground'

/**
 * The body's two tabs (specs/submit-tools ST-01 to ST-03): Write, with the format toolbar, and
 * Preview, the post as the feed will show it. Write stays mounted: what is written is never lost.
 * The preview is asked each time it opens (the text may have changed); without a title and a
 * body it says what is missing, and a failure is said without leaving the editor.
 */
export function BodyTabs({
  preview,
  draft,
  toolbar,
  children,
}: {
  preview?: PreviewAction
  /** What is written, for the preview; null while the title or the body is missing. */
  draft: () => unknown | null
  toolbar: ReactNode
  children: ReactNode
}) {
  const t = useTranslations('composer.preview')
  const [tab, setTab] = useState<'write' | 'preview'>('write')
  const [card, setCard] = useState<ReactNode>(null)
  // Its own state, not a transition: React holds every pending transition together, and an older
  // preview still on its way would keep the newer one waiting.
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'failed'>('loading')
  // The last preview asked: an older answer arriving later does not replace it.
  const asked = useRef(0)

  if (!preview) {
    return (
      <div className={BOX}>
        <div className="flex justify-end px-2 pt-2">{toolbar}</div>
        <div className="px-4 pt-1 pb-3">{children}</div>
      </div>
    )
  }

  function open(next: 'write' | 'preview') {
    setTab(next)
    if (next !== 'preview') return
    const written = draft()
    if (!written) {
      setState('missing')
      return
    }
    setCard(null)
    setState('loading')
    const ask = ++asked.current
    void preview!(written).then(
      (result) => {
        if (ask !== asked.current) return
        if (result.ok) setCard(result.data.card)
        setState(result.ok ? 'ready' : 'failed')
      },
      () => ask === asked.current && setState('failed'),
    )
  }

  return (
    <Tabs
      value={tab}
      onValueChange={(next) => open(next === 'preview' ? 'preview' : 'write')}
      className={cn(BOX, 'gap-0')}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-2 pt-2">
        <TabsList aria-label={t('label')} className="h-auto gap-1 bg-transparent p-0">
          <TabsTrigger value="write" className={TAB}>
            {t('write')}
          </TabsTrigger>
          <TabsTrigger value="preview" className={TAB}>
            {t('preview')}
          </TabsTrigger>
        </TabsList>
        {/* In Preview it keeps its room (nothing jumps) but is out of reach: nothing to format. */}
        <div
          aria-hidden={tab !== 'write' || undefined}
          inert={tab !== 'write'}
          className={cn(tab !== 'write' && 'invisible')}
        >
          {toolbar}
        </div>
      </div>
      <TabsContent value="write" keepMounted className="px-4 pt-1 pb-3">
        {children}
      </TabsContent>
      {/* The card inside the box, with room: as the feed, not touching its edge. */}
      {/* What the preview is doing, announced: the focus stays on its tab (WCAG 4.1.3). */}
      <p role="status" className="sr-only">
        {tab !== 'preview'
          ? ''
          : state === 'missing'
            ? t('missing')
            : state === 'loading'
              ? t('loading')
              : state === 'ready'
                ? t('ready')
                : ''}
      </p>
      <TabsContent value="preview" className="md:px-4">
        {state === 'missing' ? (
          <p className="px-4 py-6 text-center type-small text-muted-foreground md:px-0">
            {t('missing')}
          </p>
        ) : state === 'failed' ? (
          <p role="alert" className="px-4 py-6 text-center type-small text-destructive md:px-0">
            {t('failed')}
          </p>
        ) : state === 'loading' ? (
          // The card's outline (byline, title, body, actions): nothing jumps when it comes.
          <div aria-hidden className="flex flex-col gap-2 px-4 py-4.5 md:px-0 md:py-5.5">
            <div className="flex items-center gap-2.5">
              <Skeleton className="size-8 rounded-lg" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-12" />
            <div className="mt-1 flex gap-3">
              <Skeleton className="h-8 w-16 rounded-full" />
              <Skeleton className="h-8 w-14 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
          </div>
        ) : (
          card
        )}
      </TabsContent>
    </Tabs>
  )
}
