import { useFormatter, useNow, useTranslations } from 'next-intl'
import { FeatureMenu } from '@/components/organisms/featured'
import { ThesisState, ThesisSummary } from '@/components/organisms/thesis-summary'
import { Link } from '@/i18n/navigation'
import { previewProps } from '@/lib/communities/preview'
import { thesisPath } from '@/lib/theses/paths'
import type { ThesisItem } from '../communities.types'

/**
 * A thesis in a person's "Theses" tab, as the prototype's card without its votes (votes on theses
 * come with them to the feed, specs/profile-track-record PT-07): the asset and when, the state,
 * the claim, what it bets on and by when, how it ended, and the conviction in 4 bars. A Server
 * Component: read only. On your own profile, "⋯" features it (specs/profile-showcase PS-07).
 * Its claim opens its page (specs/thesis-detail TD-17).
 */
export function ThesisCard({ thesis, menu = false }: { thesis: ThesisItem; menu?: boolean }) {
  const tf = useTranslations('featured')
  const format = useFormatter()
  const now = useNow()
  const titleId = `thesis-${thesis.id}`
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

      {/* Its claim opens its page (specs/thesis-detail TD-17), as a post's title. */}
      <ThesisSummary thesis={thesis} titleId={titleId} href={thesisPath(thesis.id)} />
    </article>
  )
}
