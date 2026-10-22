import { useFormatter, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import type { Achievement } from '../communities.types'
import { AchievementBadge, AchievementProgress, useAchievementName } from './achievement-badge'

/** The last ones earned the card shows (AC-03). */
const SHOWN = 4

/** The missing one nearest to be earned: the most advanced, else the first of the catalog. */
export function closestAchievement(achievements: Achievement[]): Achievement | undefined {
  const missing = achievements.filter((each) => !each.earnedAt)
  const ratio = (each: Achievement) =>
    each.progress ? each.progress.current / each.progress.target : -1
  return missing.reduce<Achievement | undefined>(
    (best, each) => (!best || ratio(each) > ratio(best) ? each : best),
    undefined,
  )
}

/**
 * A person's achievements, as Reddit's trophy case (specs/profile-achievements AC-03 to AC-05): how
 * many, the last four earned and "See all". On your own profile with none, the closest one with
 * its progress; on someone else's, nothing. In the right column from lg, and in the page under it.
 */
export function AchievementsCard({
  achievements,
  isSelf,
  name,
  achievementsPath,
  idPrefix,
  className,
}: {
  /** `null`: they could not be asked. */
  achievements: Achievement[] | null
  isSelf: boolean
  /** The display name or @username, for "See all of …". */
  name: string
  achievementsPath: string
  /** The card shows twice (the page in phones, the column from lg): ids of their own. */
  idPrefix: string
  className?: string
}) {
  const t = useTranslations('communities.achievements')
  const format = useFormatter()
  const achievementName = useAchievementName()
  const earned = achievements?.filter((each) => each.earnedAt) ?? []
  const closest = achievements && earned.length === 0 ? closestAchievement(achievements) : undefined
  if (achievements && earned.length === 0 && !isSelf) return null
  const titleId = `${idPrefix}-title`

  return (
    // A section of the profile's card, after a line, as "Participates in" (PO, 2026-10-21).
    <section aria-labelledby={titleId} className={cn('mt-4 border-t pt-3.5', className)}>
      <div className="flex min-h-6 items-center justify-between gap-2 pl-2">
        <h3 id={titleId} className="min-w-0 type-section text-muted-foreground">
          {earned.length > 0 ? t('cardTitle', { count: earned.length }) : t('title')}
        </h3>
        {achievements && (
          <Link
            href={achievementsPath}
            aria-label={t('seeAllLabel', { name })}
            className="inline-flex min-h-6 shrink-0 items-center rounded-md type-meta font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {t('seeAll')}
          </Link>
        )}
      </div>
      {/* Aligned with "Participates in": its rows have 8px inside. */}
      <div className="mt-2 px-2">
        {achievements === null ? (
          <p className="type-meta text-muted-foreground">{t('loadError')}</p>
        ) : earned.length > 0 ? (
          // A row each, as Reddit's trophy case (PO, 2026-10-21): its mark, its name and when.
          <ul className="mt-1.5 flex flex-col gap-3">
            {earned.slice(0, SHOWN).map((each) => (
              <li key={each.code} className="flex items-center gap-3">
                <AchievementBadge code={each.code} earned className="size-9 [&_svg]:size-4.5" />
                <div className="min-w-0">
                  <p className="truncate type-small font-semibold">{achievementName(each)}</p>
                  <time dateTime={each.earnedAt!} className="type-meta text-muted-foreground">
                    {t('earnedOn', {
                      date: format.dateTime(new Date(each.earnedAt!), {
                        month: 'short',
                        year: 'numeric',
                      }),
                    })}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <>
            <p className="type-meta text-muted-foreground">{t('empty')}</p>
            {closest && (
              <div className="mt-3 flex items-center gap-3 border-t pt-3">
                <AchievementBadge code={closest.code} earned={false} />
                <div className="min-w-0 flex-1">
                  <p className="type-meta text-muted-foreground">{t('closest')}</p>
                  <p className="truncate type-small font-semibold">
                    {achievementName(closest)}
                    <span className="sr-only">, {t('locked')}</span>
                  </p>
                  {closest.progress && (
                    <AchievementProgress
                      code={closest.code}
                      progress={closest.progress}
                      className="mt-1"
                    />
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
