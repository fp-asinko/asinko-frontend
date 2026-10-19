import { useFormatter, useNow, useTranslations } from 'next-intl'
import { FeatureMenu } from '@/components/organisms/featured'
import { Link } from '@/i18n/navigation'
import { previewProps } from '@/lib/communities/preview'
import { cn } from '@/lib/utils'
import type { ThesisItem } from '../communities.types'
import { ThesisState } from './thesis-state'

/**
 * A thesis in a person's "Theses" tab, as the prototype's card without its votes (votes on theses
 * come with them to the feed, specs/profile-track-record PT-07): the asset and when, the state,
 * the claim, what it bets on and by when, how it ended, and the conviction in 4 bars. A Server
 * Component: read only. On your own profile, "⋯" features it (specs/profile-showcase PS-07).
 */
export function ThesisCard({ thesis, menu = false }: { thesis: ThesisItem; menu?: boolean }) {
  const t = useTranslations('communities.theses')
  const tf = useTranslations('featured')
  const format = useFormatter()
  const now = useNow()
  const titleId = `thesis-${thesis.id}`
  // Cents only below $1,000: "$150,000", "$182.47", "$2.41".
  const price = (value: number) =>
    format.number(value, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: value >= 1000 ? 0 : 2,
    })
  const date = format.dateTime(new Date(thesis.deadline), { dateStyle: 'medium' })

  return (
    <article aria-labelledby={titleId} className="px-4 py-4.5 wrap-anywhere md:px-0">
      <div className="flex items-center justify-between gap-3">
        <p className="flex min-w-0 items-center gap-1 type-meta text-muted-foreground">
          {thesis.asset && (
            <>
              <Link
                href={thesis.asset.path}
                {...previewProps('asset', thesis.asset.symbol)}
                className="-my-1 inline-block py-1 font-bold text-foreground hover:underline"
              >
                ${thesis.asset.symbol}
              </Link>
              <span aria-hidden>·</span>
            </>
          )}
          <time dateTime={thesis.publishedAt}>
            {format.relativeTime(new Date(thesis.publishedAt), now)}
          </time>
        </p>
        <div className="-my-2 flex items-center gap-1">
          <ThesisState state={thesis.state} />
          {menu && (
            <FeatureMenu
              kind="thesis"
              id={thesis.id}
              label={tf('thesisMenu', { title: thesis.claim })}
            />
          )}
        </div>
      </div>

      <h3 id={titleId} className="mt-2 type-post-title">
        {thesis.claim}
      </h3>

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
    </article>
  )
}
