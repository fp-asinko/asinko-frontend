import { ForwardIcon, MessagesSquareIcon } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { ShareButton } from '@/components/molecules/share-button'
import { ThesisClaim, ThesisTicket } from '@/components/organisms/thesis-ticket'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import type { ThesisItem } from '../feed.types'
import { CARD_ACTION } from './card-action'
import { CardLink } from '@/components/molecules/card-link'
import { FeedReasonLine } from './feed-reason-line'
import { ThesisByline } from './thesis-byline'
import { VoteControl } from './vote-control'

/**
 * A thesis in a feed as a betting ticket (specs/thesis-ticket), a Server Component: a small line
 * with THESIS, its state and its author; the ticket with the asset, the target, the conviction and
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
      {/* THESIS, its state, its author (TK-01, TK-02): small, the ticket leads. */}
      <div className={cn('flex items-center gap-2.5', detail && 'mb-1')}>
        {leading}
        <div className="min-w-0 flex-1">
          <ThesisByline
            thesis={thesis}
            titleId={titleId}
            canJoin={thesis.community?.slug !== feedCommunity}
            compact={detail}
          />
        </div>
        {menu && <div className="relative -my-2">{menu}</div>}
      </div>

      {/* The bet first: asset, target, conviction and deadline (TK-03 to TK-08). On its page, also
          the entry price's date and the deadline to the minute (Q4). */}
      <ThesisTicket thesis={thesis} variant={detail ? 'detail' : 'card'} />

      {/* The claim, second (TK-09): its page's h1, or the card's title and link. */}
      <ThesisClaim
        claim={thesis.claim}
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
