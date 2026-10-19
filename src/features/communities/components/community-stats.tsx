import { CheckIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { FollowCounts } from './follow-counts'
import { MembersButton } from './members-button'
import type { ProfileDetails } from '../communities.types'

// The numbers under a community's or a person's name in its page header
// (specs/community-pages CP-11).

/** "1,204 members", the number in bold: a button to the members (specs/community-members CM-01). */
export function MemberCount({
  count,
  slug,
  handle,
  className,
}: {
  count: number
  slug: string
  /** #defi or $BTC. */
  handle: string
  className?: string
}) {
  const t = useTranslations('communities')
  return (
    <p className={cn('type-meta text-muted-foreground', className)}>
      <MembersButton slug={slug} handle={handle}>
        {t.rich('members', { count, b: (chunks) => <Strong>{chunks}</Strong> })}
      </MembersButton>
    </p>
  )
}

function Strong({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-foreground">{children}</strong>
}

/**
 * Under a person's name: followers and following, which open their lists (specs/follow-lists
 * FL-01). The rest of the numbers are in the profile's card (specs/profile-aside PA-02).
 */
export function ProfileStats({
  profile,
  className,
}: {
  profile: Pick<ProfileDetails, 'id' | 'username' | 'isSelf' | 'followerCount' | 'followingCount'>
  className?: string
}) {
  const t = useTranslations('communities.profile')
  const b = (chunks: ReactNode) => <Strong>{chunks}</Strong>

  return (
    <p className={cn('flex flex-wrap gap-x-5 gap-y-1 type-meta text-muted-foreground', className)}>
      <FollowCounts
        userId={profile.id}
        handle={`@${profile.username}`}
        isSelf={profile.isSelf}
        followers={t.rich('followers', { count: profile.followerCount, b })}
        following={t.rich('following', { count: profile.followingCount, b })}
      />
    </p>
  )
}

/**
 * The track record over a person's theses (PT-02, PT-03): resolved right (✓), wrong (✗) and
 * cancelled; the marks say it, not only the color. Without a resolved thesis, it says so instead
 * of a row of zeros.
 */
export function TrackRecord({
  profile,
  className,
}: {
  profile: Pick<ProfileDetails, 'correctCount' | 'incorrectCount' | 'cancelledCount'>
  className?: string
}) {
  const t = useTranslations('communities.profile')
  const b = (chunks: ReactNode) => <Strong>{chunks}</Strong>
  if (profile.correctCount + profile.incorrectCount === 0) {
    return <p className={cn('type-meta text-muted-foreground', className)}>{t('noResolved')}</p>
  }
  return (
    <p className={cn('flex flex-wrap gap-x-4 gap-y-1 type-meta text-muted-foreground', className)}>
      <span className="inline-flex items-center gap-1">
        <CheckIcon aria-hidden className="size-3.5 text-success" />
        <span>{t.rich('correct', { count: profile.correctCount, b })}</span>
      </span>{' '}
      <span className="inline-flex items-center gap-1">
        <XIcon aria-hidden className="size-3.5 text-destructive" />
        <span>{t.rich('incorrect', { count: profile.incorrectCount, b })}</span>
      </span>{' '}
      <span>{t.rich('cancelled', { count: profile.cancelledCount, b })}</span>
    </p>
  )
}
