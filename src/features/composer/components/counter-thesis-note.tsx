import { ArrowDownIcon, ArrowUpIcon, EqualIcon, ReplyIcon } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import { thesisPrice } from '@/lib/theses/price'
import type { CounterThesis } from '../composer.types'

const ARROWS = { above: ArrowUpIcon, below: ArrowDownIcon, equals: EqualIcon } as const

/**
 * The thesis a new one answers (specs/thesis-agree AG-11), above the form: whose it is, its bet,
 * and which way to go to bet against it. A reference, not a field: the target the person writes
 * still decides the direction (specs/thesis-create TC-24). A Server Component: no JS.
 */
export function CounterThesisNote({ thesis }: { thesis: CounterThesis }) {
  const t = useTranslations('submitPage.counter')
  const tc = useTranslations('feed.card')
  const format = useFormatter()
  const price = thesisPrice(format, thesis.targetPrice)
  const Arrow = ARROWS[thesis.direction]
  // From the thesis, not useId: on the server it can repeat a client component's id.
  const titleId = `counter-${thesis.id}`

  return (
    // Named by its title, read once (not an aria-label repeating it).
    <aside aria-labelledby={titleId} className="flex gap-3 rounded-lg border bg-surface p-3.5">
      <ReplyIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="flex min-w-0 flex-col gap-1">
        <p id={titleId} className="type-meta text-muted-foreground">
          {t('title', { author: thesis.author ?? tc('system') })}
        </p>
        <p className="inline-flex flex-wrap items-center gap-1 type-action">
          <span className="font-extrabold">${thesis.symbol}</span>
          <Arrow aria-hidden className="size-3.5" strokeWidth={3} />
          {t('bet', {
            direction: thesis.direction,
            price,
            date: format.dateTime(new Date(thesis.deadline), { dateStyle: 'medium' }),
          })}
        </p>
        <p className="type-small text-muted-foreground">
          {t('hint', { direction: thesis.direction, price })}
        </p>
      </div>
    </aside>
  )
}
