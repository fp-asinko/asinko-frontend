'use client'

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * A row that scrolls sideways (specs/thesis-form-steps FS-05): native scroll with snap, by finger,
 * wheel or keyboard; ‹ › show only when there is more on that side. No library, no autoplay. Its
 * children are the items, each snapping at its start.
 */
export function ScrollRail({
  label,
  children,
  className,
}: {
  /** The rail's name, for the region and its arrows. */
  label: string
  children: ReactNode
  className?: string
}) {
  const t = useTranslations('common.rail')
  const track = useRef<HTMLDivElement>(null)
  const [more, setMore] = useState({ before: false, after: false })

  useEffect(() => {
    const element = track.current
    if (!element) return
    const update = () =>
      setMore({
        before: element.scrollLeft > 1,
        after: element.scrollLeft + element.clientWidth < element.scrollWidth - 1,
      })
    update()
    element.addEventListener('scroll', update, { passive: true })
    const resize = new ResizeObserver(update)
    resize.observe(element)
    return () => {
      element.removeEventListener('scroll', update)
      resize.disconnect()
    }
  }, [])

  const scroll = (direction: 1 | -1) =>
    track.current?.scrollBy({
      left: direction * track.current.clientWidth * 0.8,
      behavior: 'smooth',
    })

  const arrow =
    'absolute top-1/2 z-1 inline-flex size-8 -translate-y-1/2 tap items-center justify-center rounded-full border bg-background text-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-4'

  return (
    <section aria-label={label} className={cn('relative min-w-0', className)}>
      <div
        ref={track}
        className="flex snap-x snap-mandatory [scrollbar-width:none] gap-2 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [&>*]:shrink-0 [&>*]:snap-start"
      >
        {children}
      </div>
      {more.before && (
        <button
          type="button"
          aria-label={t('previous', { label })}
          onClick={() => scroll(-1)}
          className={cn(arrow, 'left-0')}
        >
          <ChevronLeftIcon aria-hidden />
        </button>
      )}
      {more.after && (
        <button
          type="button"
          aria-label={t('next', { label })}
          onClick={() => scroll(1)}
          className={cn(arrow, 'right-0')}
        >
          <ChevronRightIcon aria-hidden />
        </button>
      )}
    </section>
  )
}
