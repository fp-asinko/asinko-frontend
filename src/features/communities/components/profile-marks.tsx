import { BadgeCheckIcon, LandmarkIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ProfileDetails } from '../communities.types'

/**
 * What goes next to a profile's name (specs/community-pages § 12): its verified or institutional
 * badge. Tier (Creator, Partner) and rating come after the MVP (backend, 2026-10-07).
 */
export function ProfileMarks({ profile }: { profile: ProfileDetails }) {
  const t = useTranslations('communities.profile')
  if (!profile.badge) return null

  return (
    <span className="inline-flex text-foreground" title={t(`badge.${profile.badge}`)}>
      {profile.badge === 'verified' ? (
        <BadgeCheckIcon aria-hidden className="size-4.5" />
      ) : (
        <LandmarkIcon aria-hidden className="size-4.5" />
      )}
      <span className="sr-only">{t(`badge.${profile.badge}`)}</span>
    </span>
  )
}
