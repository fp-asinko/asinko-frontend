import { useFormatter, useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

/**
 * How many said yes and no (specs/thesis-agree AG-04, AG-06): a bar split in the up green and the
 * down red, and below it both shares in words and the total. The color never goes alone. No
 * business: it gets the counts.
 *
 * Only `transform` moves (design-system.md § Movimiento): the red track is whole and the green
 * scales over it from the left. `display="words"` leaves the bar out, for when the buttons fill instead.
 */
export function AgreeBar({
  yes,
  no,
  display = 'bar',
  className,
}: {
  yes: number
  no: number
  /** `words`: the words alone, when the Yes and No buttons draw the shares (specs/thesis-agree AG-04). */
  display?: 'bar' | 'words'
  className?: string
}) {
  const t = useTranslations('agreeBar')
  const format = useFormatter()
  const count = yes + no

  if (count === 0) {
    return <p className={cn('type-meta text-muted-foreground', className)}>{t('empty')}</p>
  }

  const share = yes / count
  const percent = (value: number) =>
    format.number(value, { style: 'percent', maximumFractionDigits: 0 })

  const text = (
    <p className="type-meta text-muted-foreground tabular-nums">
      {t('result', { yes: percent(share), no: percent(1 - share), count })}
    </p>
  )
  if (display === 'words') return <div className={className}>{text}</div>

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div aria-hidden className="relative h-1.5 overflow-hidden rounded-full bg-bearish">
        <div
          className="absolute inset-0 origin-left bg-bullish transition-transform duration-200 ease-out"
          style={{ transform: `scaleX(${share})` }}
        />
      </div>
      {text}
    </div>
  )
}
