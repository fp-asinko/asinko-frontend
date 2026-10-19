import { useFormatter, useTranslations } from 'next-intl'
import { ACHIEVEMENT_CODES } from '@/lib/api/contract'
import { cn } from '@/lib/utils'
import type { Achievement, AchievementGroup } from '../communities.types'
import { AchievementBadge, AchievementProgress, useAchievementName } from './achievement-badge'

const GROUPS: AchievementGroup[] = ['theses', 'community', 'tenure', 'profile']

/** Within a group, the earned ones as they come (newest first), then the missing ones in order. */
function sortGroup(items: Achievement[]): Achievement[] {
  const earned = items.filter((each) => each.earnedAt)
  const missing = items
    .filter((each) => !each.earnedAt)
    .toSorted((a, b) => ACHIEVEMENT_CODES.indexOf(a.code) - ACHIEVEMENT_CODES.indexOf(b.code))
  return [...earned, ...missing]
}

/**
 * Every achievement of a person, in its four groups (specs/profile-achievements AC-06, AC-07, AC-09):
 * each with its mark, name, how it is earned, and when; on your own profile the missing ones too,
 * gray, saying "Locked" and how far they are. A group without any does not show.
 */
export function AchievementsList({ achievements }: { achievements: Achievement[] }) {
  const t = useTranslations('communities.achievements')
  const items = useTranslations('communities.achievements.items')
  const name = useAchievementName()
  const format = useFormatter()

  return (
    <div className="flex flex-col gap-6">
      {GROUPS.map((group) => {
        const list = sortGroup(achievements.filter((each) => each.group === group))
        if (list.length === 0) return null
        return (
          <section key={group} aria-labelledby={`achievements-${group}`}>
            <h2 id={`achievements-${group}`} className="type-section text-muted-foreground">
              {t(`groups.${group}`)}
            </h2>
            <ul className="mt-2.5 grid grid-cols-2 gap-2.5 md:grid-cols-3">
              {list.map((each) => {
                const earned = each.earnedAt !== null
                return (
                  <li
                    key={each.code}
                    className={cn(
                      'flex flex-col gap-2 rounded-lg border p-3',
                      !earned && 'border-dashed',
                    )}
                  >
                    <AchievementBadge code={each.code} earned={earned} />
                    <div className="min-w-0">
                      <h3
                        className={cn('type-small font-bold', !earned && 'text-muted-foreground')}
                      >
                        {name(each)}
                      </h3>
                      <p className="mt-0.5 type-meta text-muted-foreground">
                        {items(`${each.code}.description`)}
                      </p>
                    </div>
                    <div className="mt-auto">
                      {each.earnedAt ? (
                        <time dateTime={each.earnedAt} className="type-meta text-muted-foreground">
                          {t('earnedOn', {
                            date: format.dateTime(new Date(each.earnedAt), {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            }),
                          })}
                        </time>
                      ) : (
                        <>
                          <p className="type-meta font-semibold text-muted-foreground">
                            {t('locked')}
                          </p>
                          {each.progress && (
                            <AchievementProgress
                              code={each.code}
                              progress={each.progress}
                              className="mt-1"
                            />
                          )}
                        </>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
