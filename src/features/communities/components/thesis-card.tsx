import { useFormatter, useNow, useTranslations } from 'next-intl'
import { CardLink } from '@/components/molecules/card-link'
import { FeatureMenu } from '@/components/organisms/featured'
import { ThesisState } from '@/components/organisms/thesis-summary'
import { ThesisBadge, ThesisClaim, ThesisTicket } from '@/components/organisms/thesis-ticket'
import { thesisPath } from '@/lib/theses/paths'
import type { ThesisItem } from '../communities.types'

/**
 * A thesis in a person's "Theses" tab, as a ticket without its votes (specs/thesis-ticket Q5;
 * votes on theses are in the feed, specs/profile-track-record PT-07): THESIS, its state and when;
 * the ticket with the asset, the target, the conviction and the deadline or result; then the claim. A Server
 * Component: read only. On your own profile, "⋯" features it (specs/profile-showcase PS-07).
 * It opens its page, the whole card as in a feed (specs/thesis-detail TD-17).
 */
export function ThesisCard({ thesis, menu = false }: { thesis: ThesisItem; menu?: boolean }) {
  const tf = useTranslations('featured')
  const format = useFormatter()
  const now = useNow()
  const titleId = `thesis-${thesis.id}`
  return (
    // The whole card opens its page, with the feed's gray on hover (PO, 2026-11-03): its claim stays
    // the link for the keyboard and screen readers.
    <CardLink
      href={thesisPath(thesis.id)}
      aria-labelledby={titleId}
      className="px-4 py-4.5 wrap-anywhere transition-colors duration-150 ease-out hover:bg-surface sm:rounded-2xl md:my-1 md:px-3"
    >
      {/* When on the left and THESIS on the right, as every post's header (TK-01, PO 2026-11-05):
          the profile is its author's, so no byline. Its state, in the ticket. */}
      <div className="flex items-center gap-3">
        <time
          dateTime={thesis.publishedAt}
          className="min-w-0 flex-1 type-meta text-muted-foreground"
        >
          {format.relativeTime(new Date(thesis.publishedAt), now)}
        </time>
        <ThesisBadge />
        {menu && (
          <div className="-my-2">
            <FeatureMenu
              kind="thesis"
              id={thesis.id}
              label={tf('thesisMenu', { title: thesis.claim })}
            />
          </div>
        )}
      </div>

      <ThesisTicket thesis={thesis} stateChip={<ThesisState state={thesis.state} onSurface />} />
      {/* Its claim, second, opens its page (TK-09, specs/thesis-detail TD-17). */}
      <ThesisClaim
        claim={thesis.claim}
        titleId={titleId}
        heading="h3"
        href={thesisPath(thesis.id)}
      />
    </CardLink>
  )
}
