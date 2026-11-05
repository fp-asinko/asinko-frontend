import { useFormatter, useNow, useTranslations } from 'next-intl'
import { JoinButton } from '@/components/organisms/join'
import { ThesisState } from '@/components/organisms/thesis-summary'
import { ThesisBadge } from '@/components/organisms/thesis-ticket'
import { joinCommunity } from '@/lib/communities/join-community.action'
import type { ThesisItem } from '../feed.types'
import { AuthorName, GroupName } from './card-byline'

/**
 * A thesis's top line (specs/thesis-ticket TK-01, TK-02), small: THESIS and its state, then its
 * author and when. Its group only when it is not the asset's own community (the ticket already
 * shows the asset), with Join when the viewer is not in it.
 */
export function ThesisByline({
  thesis,
  titleId,
  canJoin,
  compact = false,
}: {
  thesis: ThesisItem
  /** The focus goes to the title when Join disappears (CF-14). */
  titleId: string
  canJoin: boolean
  /** Beside the page's back button in a phone: the badge's word for screen readers only. */
  compact?: boolean
}) {
  const t = useTranslations('feed.card')
  const format = useFormatter()
  const now = useNow()
  const { community, asset, author } = thesis
  const group =
    community &&
    !community.personal &&
    !(community.kind === 'asset' && community.slug === asset?.symbol)
      ? community
      : null
  const join = group && canJoin && group.viewerIsMember !== true ? group : null

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 type-meta text-muted-foreground">
      <ThesisBadge iconOnly={compact} />
      <ThesisState state={thesis.state} />
      {group && <GroupName group={group} linked />}
      <span className="flex min-w-0 items-center gap-x-1.25 sm:ml-auto">
        <AuthorName
          author={author}
          fallback={t('system')}
          className="font-semibold text-foreground"
        />
        <span aria-hidden>·</span>
        <time dateTime={thesis.publishedAt} className="shrink-0 whitespace-nowrap">
          {format.relativeTime(new Date(thesis.publishedAt), now)}
        </time>
      </span>
      {join && (
        <JoinButton
          slug={join.slug}
          handle={join.handle}
          action={joinCommunity}
          focusFallbackId={titleId}
        />
      )}
    </div>
  )
}
