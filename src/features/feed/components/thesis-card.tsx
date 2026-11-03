import { ForwardIcon, MessagesSquareIcon, TargetIcon } from 'lucide-react'
import { useFormatter, useNow, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { ShareButton } from '@/components/molecules/share-button'
import { ThesisState, ThesisSummary } from '@/components/organisms/thesis-summary'
import { Link } from '@/i18n/navigation'
import { previewProps } from '@/lib/communities/preview'
import { cn } from '@/lib/utils'
import type { ThesisItem } from '../feed.types'
import { CARD_ACTION } from './card-action'
import { CardByline } from './card-byline'
import { CardLink } from './card-link'
import { FeedReasonLine } from './feed-reason-line'
import { VoteControl } from './vote-control'

/**
 * A thesis in a feed (specs/thesis-detail TD-02 to TD-05), a Server Component as the post's card:
 * the group and its author, THESIS where a poll says POLL, the state and the asset, the profile's
 * summary, and votes, arguments and share. The whole card opens its page.
 *
 * The `detail` variant is the thesis's own page (TD-06): the claim is the h1 and the reasoning
 * goes whole below the summary, before the actions.
 */
export function ThesisCard({
  thesis,
  variant = 'card',
  feedCommunity,
  leading,
  menu,
  children,
}: {
  thesis: ThesisItem
  variant?: 'card' | 'detail'
  /** The community the feed is filtered by: no join button for it (CP-07). */
  feedCommunity?: string
  /** Before the header: the page's back button (specs/post-detail-refresh PD-01). */
  leading?: ReactNode
  /** "⋯" to cancel it, when its author can (TD-12): over the card's link. */
  menu?: ReactNode
  /** What the page adds between the summary and the actions: the reasoning (TD-06). */
  children?: ReactNode
}) {
  const t = useTranslations('feed.thesis')
  const tc = useTranslations('feed.card')
  const format = useFormatter()
  const now = useNow()
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
      <div className={cn('flex items-center gap-2.5', detail ? 'mb-3.5' : 'mb-2')}>
        {leading}
        <div className="min-w-0 flex-1">
          <CardByline
            author={thesis.author}
            community={thesis.community}
            publishedAt={thesis.publishedAt}
            edited={false}
            titleId={titleId}
            canJoin={thesis.community?.slug !== feedCommunity}
            linked
            // A thesis says so, where a poll says POLL (Q2: monochrome, no strip of color).
            badge={
              <span className="inline-flex min-h-6 shrink-0 items-center gap-1.25 type-action font-extrabold text-muted-foreground uppercase">
                <TargetIcon aria-hidden className="size-3.5" />
                {/* On its page in a phone, beside the back button and Join, only the icon: the
                    community's name needs the room. */}
                <span className={detail ? 'sr-only sm:not-sr-only' : undefined}>{t('badge')}</span>
              </span>
            }
          />
        </div>
        {menu && <div className="relative -my-2">{menu}</div>}
      </div>

      {/* Its state and asset, and how long it has left (TD-03). */}
      {/* Clear of the author's link above: two 24px targets never overlap (WCAG 2.5.8). */}
      <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 type-meta text-muted-foreground">
        <ThesisState state={thesis.state} />
        {thesis.asset && (
          <Link
            href={thesis.asset.path}
            {...previewProps('asset', thesis.asset.symbol)}
            className="inline-flex min-h-6 items-center font-bold text-foreground hover:underline"
          >
            ${thesis.asset.symbol}
          </Link>
        )}
        {/* On its page, where it stands says it (TD-08). */}
        {!detail && thesis.state === 'open' && (
          <time dateTime={thesis.deadline}>
            {t('closes', { when: format.relativeTime(new Date(thesis.deadline), now) })}
          </time>
        )}
      </p>

      <ThesisSummary
        thesis={summaryOf(thesis)}
        titleId={titleId}
        heading={detail ? 'h1' : 'h2'}
        href={detail ? undefined : thesis.path}
      />

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
          href={detail ? '#arguments' : thesis.path}
          aria-label={t('arguments', { count: argumentCount })}
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

/** What the shared summary draws, from the feed's thesis. */
function summaryOf(thesis: ThesisItem) {
  return {
    claim: thesis.claim,
    state: thesis.state,
    target: thesis.target,
    deadline: thesis.deadline,
    conviction: thesis.conviction,
    resolutionPrice: thesis.resolution?.price ?? null,
    cancellationReason: thesis.cancellation?.reason ?? null,
  }
}
