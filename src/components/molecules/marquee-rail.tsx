'use client'

import { PauseIcon, PlayIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { HoverHint } from './hover-hint'

/**
 * A row that slides by itself, like a ticker (specs/thesis-form-steps FS-05): a second, inert copy
 * of the items follows the first so the loop has no seam, moved with transform only. It stops with
 * its pause button (WCAG 2.2.2), under the mouse and while a finger is down; with the keyboard's
 * focus inside it goes back to the start, so the focused item is in view. Asking for reduced
 * motion, it stands still and scrolls by hand, without the button.
 */
export function MarqueeRail({
  label,
  children,
  duration,
  className,
}: {
  /** The row's name, for its region. */
  label: string
  children: ReactNode
  /** Seconds for one full turn: more items, more time, the same pace. */
  duration: number
  className?: string
}) {
  const t = useTranslations('common.marquee')
  const [paused, setPaused] = useState(false)
  const [held, setHeld] = useState(false)
  const [focused, setFocused] = useState(false)
  const stopped = paused || held

  const track = {
    '--marquee-duration': `${duration}s`,
    animationPlayState: stopped ? 'paused' : undefined,
  } as CSSProperties

  return (
    <section aria-label={label} className={cn('flex min-w-0 items-center gap-1', className)}>
      <div
        className="min-w-0 flex-1 [scrollbar-width:none] overflow-hidden motion-reduce:overflow-x-auto [&::-webkit-scrollbar]:hidden"
        onPointerEnter={(event) => event.pointerType === 'mouse' && setHeld(true)}
        onPointerLeave={() => setHeld(false)}
        onPointerDown={(event) => event.pointerType !== 'mouse' && setHeld(true)}
        onPointerUp={(event) => event.pointerType !== 'mouse' && setHeld(false)}
        onPointerCancel={() => setHeld(false)}
        onFocus={() => setFocused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
        }}
      >
        <div
          data-testid="marquee-track"
          data-stopped={stopped || undefined}
          style={track}
          className={cn('flex w-max', !focused && 'motion-safe:animate-marquee')}
        >
          <div className="flex gap-2 pr-2 [&>*]:shrink-0">{children}</div>
          <div aria-hidden inert className="flex gap-2 pr-2 motion-reduce:hidden [&>*]:shrink-0">
            {children}
          </div>
        </div>
      </div>
      <HoverHint
        label={paused ? t('play') : t('pause')}
        align="end"
        className="motion-reduce:hidden"
      >
        <button
          type="button"
          aria-label={paused ? t('play') : t('pause')}
          onClick={() => setPaused(!paused)}
          className="inline-flex size-8 shrink-0 tap items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-4"
        >
          {paused ? <PlayIcon aria-hidden /> : <PauseIcon aria-hidden />}
        </button>
      </HoverHint>
    </section>
  )
}
