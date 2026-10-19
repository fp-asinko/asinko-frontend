import { useTranslations } from 'next-intl'
import { AsideCard } from '@/components/molecules/aside-card'
import { Link } from '@/i18n/navigation'
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
  const achievementName = useAchievementName()
  const earned = achievements?.filter((each) => each.earnedAt) ?? []
  const closest = achievements && earned.length === 0 ? closestAchievement(achievements) : undefined
  if (achievements && earned.length === 0 && !isSelf) return null
  const titleId = `${idPrefix}-title`

  return (
    <AsideCard
      id={titleId}
      title={earned.length > 0 ? t('cardTitle', { count: earned.length }) : t('title')}
      action={
        achievements && (
          <Link
            href={achievementsPath}
            aria-label={t('seeAllLabel', { name })}
            className="inline-flex min-h-6 shrink-0 items-center rounded-md type-meta font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {t('seeAll')}
          </Link>
        )
      }
      className={className}
    >
      {achievements === null ? (
        <p className="type-meta text-muted-foreground">{t('loadError')}</p>
      ) : earned.length > 0 ? (
        <ul className="mt-1.5 grid grid-cols-4 gap-2">
          {earned.slice(0, SHOWN).map((each) => (
            <li key={each.code} className="flex min-w-0 flex-col items-center gap-1.5 text-center">
              <AchievementBadge code={each.code} earned />
              <span className="line-clamp-2 type-caption">{achievementName(each)}</span>
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
    </AsideCard>
  )
}
