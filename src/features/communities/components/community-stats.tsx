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

type Stats = Pick<
  ProfileDetails,
  | 'followerCount'
  | 'followingCount'
  | 'accuracyRate'
  | 'currentStreak'
  | 'correctCount'
  | 'incorrectCount'
  | 'cancelledCount'
>

/**
 * A person's numbers, as X's profile (specs/profile-track-record PT-01 to PT-03): who they follow
 * and who follows them, then their track record: accuracy, streak (correct theses in a row, not
 * days), and the theses resolved right (✓), wrong (✗) and cancelled. The marks say it, not only
 * the color. Without a resolved thesis, it says so instead of a row of zeros.
 */
export function ProfileStats({ profile, className }: { profile: Stats; className?: string }) {
  const t = useTranslations('communities.profile')
  const format = useFormatter()
  const b = (chunks: ReactNode) => <Strong>{chunks}</Strong>
  const resolved = profile.correctCount + profile.incorrectCount > 0

  return (
    <div className={cn('flex flex-col gap-1 type-meta text-muted-foreground', className)}>
      <Line
        parts={[
          t.rich('following', { count: profile.followingCount, b }),
          t.rich('followers', { count: profile.followerCount, b }),
        ]}
      />
      {resolved ? (
        <Line
          parts={[
            profile.accuracyRate !== null &&
              t.rich('accuracy', {
                value: format.number(profile.accuracyRate, { style: 'percent' }),
                b,
              }),
            t.rich('streak', { count: profile.currentStreak, b }),
            <>
              <CheckIcon aria-hidden className="inline size-3.5 text-success" />{' '}
              {t.rich('correct', { count: profile.correctCount, b })}
            </>,
            <>
              <XIcon aria-hidden className="inline size-3.5 text-destructive" />{' '}
              {t.rich('incorrect', { count: profile.incorrectCount, b })}
            </>,
            profile.cancelledCount > 0 && t.rich('cancelled', { count: profile.cancelledCount, b }),
          ]}
        />
      ) : (
        <p>{t('noResolved')}</p>
      )}
    </div>
  )
}

/** Parts separated by "·", wrapping between them at 360px. */
function Line({ parts }: { parts: ReactNode[] }) {
  return (
    <p className="flex flex-wrap gap-x-2">
      {parts.filter(Boolean).map((part, index) => (
        // Not flex inside: the bold number and its word keep a normal space between them.
        <span key={index}>
          {index > 0 && (
            <span aria-hidden className="mr-2">
              ·
            </span>
          )}
          {part}
        </span>
      ))}
    </p>
  )
}
