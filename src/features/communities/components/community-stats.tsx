import { CheckIcon, XIcon } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { ProfileDetails } from '../communities.types'

// The numbers under a community's or a person's name in its page header
// (specs/community-pages CP-11).

/** "1,204 members", the number in bold. */
export function MemberCount({ count, className }: { count: number; className?: string }) {
  const t = useTranslations('communities')
  return (
    <p className={cn('type-meta text-muted-foreground', className)}>
      {t.rich('members', { count, b: (chunks) => <Strong>{chunks}</Strong> })}
    </p>
  )
}

function Strong({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-foreground">{children}</strong>
}

/**
 * A person's numbers in one line, as the prototype's profile (specs/profile-track-record PT-01,
 * changed with the PO on 2026-10-09): followers, following, accuracy and streak (correct theses in
 * a row, not days), apart without separators. The detail of the theses lives in their tab
 * (TrackRecord).
 */
export function ProfileStats({
  profile,
  className,
}: {
  profile: Pick<
    ProfileDetails,
    'followerCount' | 'followingCount' | 'accuracyRate' | 'currentStreak'
  >
  className?: string
}) {
  const t = useTranslations('communities.profile')
  const format = useFormatter()
  const b = (chunks: ReactNode) => <Strong>{chunks}</Strong>
  const parts = [
    t.rich('followers', { count: profile.followerCount, b }),
    t.rich('following', { count: profile.followingCount, b }),
    profile.accuracyRate !== null &&
      t.rich('accuracy', {
        value: format.number(profile.accuracyRate, { style: 'percent' }),
        b,
      }),
    t.rich('streak', { count: profile.currentStreak, b }),
  ].filter(Boolean)

  return (
    <p className={cn('flex flex-wrap gap-x-5 gap-y-1 type-meta text-muted-foreground', className)}>
      {parts.map((part, index) => (
        // A text space too: read aloud, the parts do not run together.
        <span key={index}>
          {index > 0 && ' '}
          {part}
        </span>
      ))}
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
