import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

/**
 * Daily change of an asset (H-07). Color plus arrow, never color alone, and a spoken label.
 * Server-renderable: next-intl hooks work in Server Components too.
 */
export function Delta({ value, className }: { value: number; className?: string }) {
  const t = useTranslations('common.delta')
  const format = useFormatter()
  const direction = value > 0 ? 'up' : value < 0 ? 'down' : 'flat'
  const percent = format.number(Math.abs(value) / 100, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  })
  const Icon = direction === 'up' ? ArrowUpIcon : direction === 'down' ? ArrowDownIcon : MinusIcon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 font-semibold tabular-nums',
        direction === 'up' && 'text-bullish',
        direction === 'down' && 'text-bearish',
        direction === 'flat' && 'text-muted-foreground',
        className,
      )}
    >
      <Icon aria-hidden className="size-3" strokeWidth={2.5} />
      <span aria-hidden>{percent}</span>
      <span className="sr-only">{t(direction, { value: percent })}</span>
    </span>
  )
}
