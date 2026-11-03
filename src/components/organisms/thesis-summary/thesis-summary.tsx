import { useFormatter, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { thesisPrice } from '@/lib/theses/price'
import { cn } from '@/lib/utils'
import type { ThesisSummaryData } from './thesis-summary.types'

/**
 * The body of a thesis, the same in the profile and in the feed (specs/thesis-detail TD-03): the
 * claim as its title, what it bets on and by when, how it ended, and the conviction in 4 bars.
 * The card around it draws the header (asset, author, state) and the actions.
 */
export function ThesisSummary({
  thesis,
  titleId,
  heading = 'h3',
  href,
  claimOnly = false,
}: {
  thesis: ThesisSummaryData
  /** The title's id: the card's article is labelled by it. */
  titleId: string
  /** The page's own thesis is its h1; a card in a list, h2 or h3. */
  heading?: 'h1' | 'h2' | 'h3'
  /**
   * Its page, when the card opens it: the claim is the link for the keyboard and screen readers,
   * as a post's title (specs/thesis-detail TD-05).
   */
  href?: string
  /**
   * Only the claim: the thesis's page says the rest once, in its bet (specs/thesis-detail TD-07,
   * PO 2026-11-03).
   */
  claimOnly?: boolean
}) {
  const t = useTranslations('thesisSummary')
  const format = useFormatter()
  const Title = heading
  const price = (value: number) => thesisPrice(format, value)
  const date = format.dateTime(new Date(thesis.deadline), { dateStyle: 'medium' })

  return (
    <>
      <Title id={titleId} className="mt-2 type-post-title">
        {href ? (
          // A 24px target on the 22px line (WCAG 2.5.8), as the post's title.
          <Link
            href={href}
            className="-mb-0.5 inline-block rounded-sm pb-0.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {thesis.claim}
          </Link>
        ) : (
          thesis.claim
        )}
      </Title>
      {!claimOnly && (
        <>
          <p className="mt-1.5 type-small text-muted-foreground">
            {thesis.target
              ? t(`target.${thesis.target.direction}`, { price: price(thesis.target.price), date })
              : t('target.none', { date })}
          </p>
          {thesis.resolutionPrice !== null && (
            <p className="type-small text-muted-foreground">
              {t('resolved', { price: price(thesis.resolutionPrice) })}
            </p>
          )}
          {thesis.state === 'cancelled' && thesis.cancellationReason && (
            <p className="type-small text-muted-foreground">
              {t('cancelledReason', { reason: thesis.cancellationReason })}
            </p>
          )}

          <p className="mt-3 flex items-center gap-2 type-section text-muted-foreground">
            {t('conviction.label')}
            <span aria-hidden className="flex gap-0.5">
              {[1, 2, 3, 4].map((bar) => (
                <span
                  key={bar}
                  className={cn(
                    'h-3 w-1.5 rounded-sm',
                    bar <= thesis.conviction ? 'bg-foreground' : 'bg-border-strong',
                  )}
                />
              ))}
            </span>
            <span className="normal-case">{t(`conviction.${thesis.conviction}`)}</span>
          </p>
        </>
      )}
    </>
  )
}
