import { ForwardIcon, MessagesSquareIcon } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { ShareButton } from '@/components/molecules/share-button'
import { ThesisState } from '@/components/organisms/thesis-summary'
import { ThesisBadge, ThesisClaim, ThesisTicket } from '@/components/organisms/thesis-ticket'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import type { ThesisItem } from '../feed.types'
import { CARD_ACTION } from './card-action'
import { CardLink } from '@/components/molecules/card-link'
import { FeedReasonLine } from './feed-reason-line'
import { CardByline } from './card-byline'
import { ThesisAgree } from './thesis-agree'
import { VoteControl } from './vote-control'

/**
 * A thesis in a feed as a betting ticket (specs/thesis-ticket), a Server Component: the header of
 * every post, with THESIS on the right; the ticket with the asset, the target, the conviction and its state, and
 * the deadline; then the claim, second; and votes, arguments and share. The whole card opens its
 * page.
 *
 * The `detail` variant is the thesis's own page (TD-06, Q4): the ticket says every number once,
 * the claim is the h1 and the reasoning goes whole below it, before the actions.
 */
export function ThesisCard({
  thesis,
  variant = 'card',
  feedCommunity,
  leading,
  chart,
  menu,
  children,
}: {
  thesis: ThesisItem
  variant?: 'card' | 'detail'
  /** The community the feed is filtered by: no join button for it (CP-07). */
  feedCommunity?: string
  /** Before the header: the page's back button (specs/post-detail-refresh PD-01). */
  leading?: ReactNode
  /**
   * Its page's price chart, between the header and the ticket (specs/thesis-chart Q3, PO
   * 2026-11-06: the back button and the author stay on top of everything).
   */
  chart?: ReactNode
  /** "⋯" to cancel it, when its author can (TD-12): over the card's link. */
  menu?: ReactNode
  /** What the page adds between the summary and the actions: the reasoning (TD-06). */
  children?: ReactNode
}) {
  const t = useTranslations('feed.thesis')
  const tc = useTranslations('feed.card')
  const format = useFormatter()
  const detail = variant === 'detail'
  const titleId = `thesis-${thesis.id}`
  const argumentCount = thesis.argumentCount.pro + thesis.argumentCount.contra

  const Card = detail ? 'article' : CardLink
  const cardProps = detail
    ? {}
    : {
        href: thesis.path,
        // What the impressions read, as a post's (specs/explore-v1).
        'data-content-id': thesis.id,
        'data-content-path': thesis.path,
        className:
          'transition-colors duration-150 ease-out hover:bg-surface sm:rounded-2xl md:my-1 md:px-3',
      }

  return (
    <Card
      {...(cardProps as { href: string })}
      className={cn(
        'px-4 py-4.5 wrap-anywhere md:px-0 md:py-5.5',
        'className' in cardProps && cardProps.className,
      )}
      aria-labelledby={titleId}
    >
      {!detail && thesis.reason && <FeedReasonLine reason={thesis.reason} />}
      {/* The header every post has: its group or author first, THESIS and its state on the right,
          as POLL (TK-01, PO 2026-11-05). Not the asset's own community: the ticket shows it (TK-02). */}
      <div className={cn('flex items-center gap-2.5', detail && 'mb-1')}>
        {leading}
        <div className="min-w-0 flex-1">
          <CardByline
            author={thesis.author}
            community={ownGroup(thesis)}
            publishedAt={thesis.publishedAt}
            titleId={titleId}
            canJoin={thesis.community?.slug !== feedCommunity}
            // Beside the page's back button in a phone: the icon alone (TD-01). Its state goes
            // down, in the ticket (PO, 2026-11-05).
            badge={<ThesisBadge iconOnly={detail} />}
            // Who bets and how often they are right (specs/thesis-identity TI-08).
            accuracy="words"
          />
        </div>
        {menu && <div className="relative -my-2">{menu}</div>}
      </div>

      {/* Empty when there is no history (CH-06): no gap, the page as before. */}
      {chart && <div className="mt-3 empty:hidden">{chart}</div>}

      {/* The bet first: asset, target, conviction and deadline (TK-03 to TK-08). On its page, also
          the entry price's date and the deadline to the minute (Q4). */}
      <ThesisTicket
        thesis={thesis}
        variant={detail ? 'detail' : 'card'}
        stateChip={<ThesisState state={thesis.state} onSurface />}
        author={thesis.author?.username}
      />

      {/* The claim, second (TK-09): its page's h1, or the card's title and link. */}
      <ThesisClaim
        claim={thesis.claim}
        titleId={titleId}
        heading={detail ? 'h1' : 'h2'}
        href={detail ? undefined : thesis.path}
      />

      {/* "Do you agree?" right after what has to happen: the claim (specs/thesis-agree AG-01, PO
          2026-11-06). Closed, only its result, if anyone answered (AG-02); without the backend's
          field, nothing (AG-18). */}
      {thesis.agreement &&
        (thesis.state === 'open' || thesis.agreement.yes + thesis.agreement.no > 0) && (
          <ThesisAgree
            thesisId={thesis.id}
            assetSymbol={thesis.asset?.symbol ?? null}
            bet={
              thesis.author && thesis.target
                ? {
                    handle: thesis.author.handle,
                    direction: thesis.target.direction,
                    price: thesis.target.price,
                    deadline: thesis.deadline,
                  }
                : null
            }
            agreement={thesis.agreement}
            className="mt-3"
          />
        )}

      {children}

      <div className={cn('flex flex-wrap items-center gap-3', detail ? 'mt-6' : 'mt-3')}>
        <VoteControl
          kind="thesis"
          id={thesis.id}
          score={thesis.score}
          viewerVote={thesis.viewerVote}
        />
        {/* Its arguments, for and against: on its page (Q3, MVP-141). */}
        <Link
          // The side with more, For when even (specs/thesis-arguments TA-08).
          href={
            detail
              ? '#arguments'
              : thesis.argumentCount.contra > thesis.argumentCount.pro
                ? `${thesis.path}?side=contra#arguments`
                : `${thesis.path}#arguments`
          }
          aria-label={t('argumentsLabel', { count: argumentCount })}
          className={CARD_ACTION}
        >
          <MessagesSquareIcon aria-hidden className="size-4" />
          {format.number(argumentCount)}
        </Link>
        <span className="ml-auto md:ml-0">
          <ShareButton href={thesis.path} className={cn(CARD_ACTION, 'min-w-8 justify-center')}>
            <ForwardIcon aria-hidden className="size-4" />
            <span className="sr-only sm:not-sr-only">{tc('share')}</span>
          </ShareButton>
        </span>
      </div>
    </Card>
  )
}

/** Its group, unless it is the asset's own community: the ticket already says the asset (TK-02). */
function ownGroup({ community, asset }: ThesisItem) {
  return community?.kind === 'asset' && community.slug === asset?.symbol ? null : community
}
