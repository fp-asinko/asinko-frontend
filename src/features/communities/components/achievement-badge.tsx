import {
  ArrowBigUpIcon,
  CakeIcon,
  CircleCheckIcon,
  FlagIcon,
  FlameIcon,
  LightbulbIcon,
  ListChecksIcon,
  MessageCircleIcon,
  PenLineIcon,
  ShieldIcon,
  SparklesIcon,
  TargetIcon,
  UserCheckIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { AchievementCode } from '@/lib/api/contract'
import { cn } from '@/lib/utils'
import type { Achievement } from '../communities.types'

const ICONS: Record<AchievementCode, LucideIcon> = {
  FIRST_THESIS: LightbulbIcon,
  FIRST_CORRECT: CircleCheckIcon,
  STREAK_3: FlameIcon,
  STREAK_5: FlameIcon,
  STREAK_10: FlameIcon,
  RESOLVED_10: ListChecksIcon,
  ACCURACY_70: TargetIcon,
  FIRST_POST: PenLineIcon,
  FIRST_COMMENT: MessageCircleIcon,
  POST_100_VOTES: ArrowBigUpIcon,
  FOLLOWERS_100: UsersIcon,
  GROUP_FOUNDER: FlagIcon,
  GROUP_MODERATOR: ShieldIcon,
  ANNIVERSARY: CakeIcon,
  FOUNDING_MEMBER: SparklesIcon,
  PROFILE_COMPLETE: UserCheckIcon,
}

/**
 * An achievement's mark (specs/profile-achievements AC-01, AC-09): its icon in a circle, filled
 * when earned; dashed and faint when missing, which its name and "Locked" also say in words.
 */
export function AchievementBadge({
  code,
  earned,
  className,
}: {
  code: AchievementCode
  earned: boolean
  className?: string
}) {
  const Icon = ICONS[code]
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-full [&_svg]:size-5',
        earned
          ? 'bg-muted text-foreground'
          : 'border border-dashed border-border-strong text-faint',
        className,
      )}
    >
      <Icon />
    </span>
  )
}

/** Its name: the anniversary says its years (a missing one, the first). */
export function useAchievementName() {
  const t = useTranslations('communities.achievements.items')
  return ({ code, level }: Pick<Achievement, 'code' | 'level'>) =>
    t(`${code}.name`, { years: level ?? 1 })
}

/** How far a missing one is, in words and as a bar (AC-07): "3 of 5", accuracy in points. */
export function AchievementProgress({
  code,
  progress,
  className,
}: {
  code: AchievementCode
  progress: NonNullable<Achievement['progress']>
  className?: string
}) {
  const t = useTranslations('communities.achievements')
  const { current, target } = progress
  const text = t(code === 'ACCURACY_70' ? 'progressPercent' : 'progress', { current, target })
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        role="progressbar"
        aria-label={t('progressLabel')}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuenow={Math.min(current, target)}
        aria-valuetext={text}
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.min(current / target, 1) * 100}%` }}
        />
      </div>
      <span aria-hidden className="shrink-0 type-meta text-muted-foreground tabular-nums">
        {text}
      </span>
    </div>
  )
}
