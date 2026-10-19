import { ArrowLeftIcon } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { env } from '@/env'
import { buildAlternates, OG_LOCALES } from '@/i18n/alternates'
import { Link } from '@/i18n/navigation'
import { safeLocale } from '@/i18n/safe-locale'
import { getOrThrow } from '@/lib/api'
import { communityPath } from '@/lib/communities/paths'
import { brandImagePath, shareImage } from '@/lib/share-image/share-metadata'
import type { Achievement, ProfileDetails } from '../communities.types'
import { getAchievements } from '../lib/achievements-api'
import { getProfileDetails } from '../lib/profile-api'
import { AchievementsList } from './achievements-list'

const pathOf = (username: string) => `${communityPath('user', username)}/achievements`

/** The person and their achievements; one that does not exist is the not-found page (AC-08). */
export async function getAchievementsPage(username: string) {
  const result = await getProfileDetails(username)
  if (!result.ok && (result.code === 'NOT_FOUND' || result.code === 'INVALID')) notFound()
  const profile = getOrThrow(result)
  return { profile, achievements: await getAchievements(profile.id, profile.isSelf) }
}

/** Title, description, canonical and hreflang of /user/{username}/achievements (AC-08). */
export async function achievementsMetadata(username: string, rawLocale: string): Promise<Metadata> {
  const locale = safeLocale(rawLocale)
  const result = await getProfileDetails(username)
  if (!result.ok) return {}
  const profile = result.data
  const name = profile.displayName ?? `@${profile.username}`
  const t = await getTranslations({ locale, namespace: 'communities.achievements.page' })
  const site = await getTranslations({ locale, namespace: 'metadata' })
  const title = t('metaTitle', { name })
  const description = t('metaDescription', { name })
  const image = shareImage(brandImagePath(locale), site('description'))
  return {
    title,
    description,
    alternates: buildAlternates(env.NEXT_PUBLIC_SITE_URL, locale, pathOf(profile.username)),
    openGraph: {
      title,
      description,
      siteName: site('title'),
      locale: OG_LOCALES[locale],
      ...image.openGraph,
    },
    twitter: image.twitter,
  }
}

/**
 * A person's trophy case, whole (specs/profile-achievements AC-06 to AC-08): back to the profile,
 * who it is, and the list in its groups. On someone else's profile without any, it says so.
 */
export function AchievementsView({
  profile,
  achievements,
}: {
  profile: Pick<ProfileDetails, 'username' | 'displayName' | 'avatarUrl' | 'isSelf'>
  achievements: Achievement[] | null
}) {
  const t = useTranslations('communities.achievements')
  const name = profile.displayName ?? `@${profile.username}`
  const earned = achievements?.some((each) => each.earnedAt) ?? false

  return (
    <div className="px-4 pt-4 pb-8 sm:px-0">
      <Link
        href={communityPath('user', profile.username)}
        className="-ml-1 inline-flex min-h-11 max-w-full tap items-center gap-1.5 rounded-full px-1 type-action text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 md:min-h-8"
      >
        <ArrowLeftIcon aria-hidden className="size-4" />
        {/* A name is the person's: a long one breaks, never past the screen. */}
        <span className="min-w-0 wrap-anywhere">{t('page.back', { name })}</span>
      </Link>
      <div className="mt-3 flex items-center gap-3 border-b pb-4">
        <UserAvatar
          name={`@${profile.username}`}
          colorKey={profile.username}
          imageUrl={profile.avatarUrl}
          size="md"
        />
        {/* Whose they are, in the title (seo.md § GEO). */}
        <h1 className="min-w-0 type-page-title wrap-anywhere">{t('page.metaTitle', { name })}</h1>
      </div>
      <div className="mt-5">
        {achievements === null ? (
          <p className="type-small text-muted-foreground">{t('loadError')}</p>
        ) : !earned && !profile.isSelf ? (
          <p className="type-small text-muted-foreground">{t('page.none', { name })}</p>
        ) : (
          <AchievementsList achievements={achievements} />
        )}
      </div>
    </div>
  )
}
