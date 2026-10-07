import { BadgeCheckIcon, LandmarkIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { ProfileDetails } from '../communities.types'

// The rating reuses the accuracy tones (FC-03): A grades high, B grades mid, C and D low. The
// grade stays written, so color is never the only cue.
const RATING_CLASSES = {
  high: 'bg-accuracy-high text-accuracy-high-foreground',
  mid: 'bg-accuracy-mid text-accuracy-mid-foreground',
  low: 'bg-accuracy-low text-accuracy-low-foreground',
} as const

function ratingTone(rating: NonNullable<ProfileDetails['rating']>) {
  if (rating.startsWith('A')) return 'high'
  if (rating.startsWith('B')) return 'mid'
  return 'low'
}

/**
 * What goes next to a profile's name (specs/community-pages § 12): its tier (Creator, Partner),
 * its rating and its verified or institutional badge, each only when it comes. Monochrome but for
 * the rating's tone.
 */
export function ProfileMarks({ profile }: { profile: ProfileDetails }) {
  const t = useTranslations('communities.profile')
  if (!profile.tier && !profile.rating && !profile.badge) return null

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 align-middle">
      {profile.badge && (
        <span className="inline-flex text-foreground" title={t(`badge.${profile.badge}`)}>
          {profile.badge === 'verified' ? (
            <BadgeCheckIcon aria-hidden className="size-4.5" />
          ) : (
            <LandmarkIcon aria-hidden className="size-4.5" />
          )}
          <span className="sr-only">{t(`badge.${profile.badge}`)}</span>
        </span>
      )}
      {profile.tier && (
        <span className="inline-flex h-5.5 items-center gap-1 rounded-full bg-muted px-2 text-[0.6875rem] font-semibold tracking-wide uppercase">
          <span aria-hidden>✦</span>
          {t(`tier.${profile.tier}`)}
        </span>
      )}
      {profile.rating && (
        <span
          data-tone={ratingTone(profile.rating)}
          className={cn(
            'inline-flex h-5.5 items-center rounded-md px-1.5 text-[0.6875rem] font-extrabold',
            RATING_CLASSES[ratingTone(profile.rating)],
          )}
        >
          <span aria-hidden>{profile.rating}</span>
          <span className="sr-only">{t('rating', { rating: profile.rating })}</span>
        </span>
      )}
    </span>
  )
}
