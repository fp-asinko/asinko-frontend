import { useFormatter, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { ActiveCommunity, ProfileDetails } from '../communities.types'
import { ActiveCommunities } from './active-communities'

type CardProfile = Pick<
  ProfileDetails,
  | 'username'
  | 'displayName'
  | 'avatarUrl'
  | 'accuracyRate'
  | 'currentStreak'
  | 'correctCount'
  | 'incorrectCount'
  | 'points'
  | 'joinedAt'
>

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col-reverse gap-0.5">
      <dt className="type-meta text-muted-foreground">{label}</dt>
      <dd className="type-post-title tabular-nums">{children}</dd>
    </div>
  )
}

/**
 * A person's card, as Reddit's profile card (specs/profile-aside PA-01, PA-05): the numbers of
 * their reputation (accuracy, streak, right and wrong theses, points, member since), where they
 * publish and, after it, their achievements. One gray card, without the photo and name the header
 * already shows (PO, 2026-10-21). In the right column from lg, and in the page under it
 * (PA-03): the same card, so phones and desktop show the same.
 */
export function ProfileCard({
  profile,
  communities,
  idPrefix,
  className,
  children,
}: {
  profile: CardProfile
  communities: ActiveCommunity[]
  /** More sections at its end, each after a line (the achievements). */
  children?: ReactNode
  /** The card shows twice (the page in phones, the column from lg): ids of their own. */
  idPrefix: string
  className?: string
}) {
  const t = useTranslations('communities.profileCard')
  const format = useFormatter()
  const name = profile.displayName ?? `@${profile.username}`
  const titleId = `${idPrefix}-title`
  const number = (value: number) => format.number(value)

  return (
    <section
      aria-labelledby={titleId}
      className={cn('rounded-xl border bg-surface px-3.5 py-4', className)}
    >
      {/* Its photo and name are the header's, right there: not again (PO, 2026-10-21). Still
          named, for who navigates by regions. */}
      <h2 id={titleId} className="sr-only">
        {name}
      </h2>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-3.5">
        <Stat label={t('accuracy')}>
          {profile.accuracyRate === null ? (
            <>
              <span aria-hidden>—</span>
              <span className="block type-meta font-normal text-muted-foreground">
                {t('noResolved')}
              </span>
            </>
          ) : (
            format.number(profile.accuracyRate, { style: 'percent' })
          )}
        </Stat>
        <Stat label={t('streak')}>{number(profile.currentStreak)}</Stat>
        <Stat label={t('correct')}>{number(profile.correctCount)}</Stat>
        <Stat label={t('incorrect')}>{number(profile.incorrectCount)}</Stat>
        <Stat label={t('points')}>{number(profile.points)}</Stat>
        <Stat label={t('memberSince')}>
          <time dateTime={profile.joinedAt}>
            {format.dateTime(new Date(profile.joinedAt), { month: 'short', year: 'numeric' })}
          </time>
        </Stat>
      </dl>

      <ActiveCommunities communities={communities} idPrefix={idPrefix} />
      {/* More sections of the same card: the achievements (specs/profile-achievements). */}
      {children}
    </section>
  )
}
