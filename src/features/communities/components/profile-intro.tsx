import { MapPinIcon } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { LinkMark } from '@/components/ui/link-marks'
import { countryName } from '@/lib/countries'
import type { ProfileDetails } from '../communities.types'
import { EditProfilePrompt } from './edit-profile-button'

/**
 * Who the person is at a glance, as LinkedIn's (specs/profile-presentation PP-01 to PP-04), under
 * the name: the headline, the location in gray and the links, each with its site's mark and its real
 * host (a link cannot pass for another). User text, plain (PP-11). What is not set takes no room;
 * on your own profile, the headline and the links are offered where they would go.
 */
export function ProfileIntro({
  profile,
}: {
  profile: Pick<ProfileDetails, 'headline' | 'city' | 'countryCode' | 'links' | 'isSelf'>
}) {
  const t = useTranslations('communities.profile')
  const country = countryName(profile.countryCode, useLocale())
  const location =
    profile.city && country
      ? t('location', { city: profile.city, country })
      : (profile.city ?? country)

  return (
    <div className="mt-1 flex flex-col gap-1">
      {profile.headline ? (
        <p className="type-ui wrap-anywhere">{profile.headline}</p>
      ) : (
        profile.isSelf && <EditProfilePrompt field="headline">{t('addHeadline')}</EditProfilePrompt>
      )}
      {location && (
        <p className="flex items-center gap-1 type-meta text-muted-foreground">
          <MapPinIcon aria-hidden className="size-3.5 shrink-0" />
          <span className="wrap-anywhere">{location}</span>
        </p>
      )}
      {profile.links.length > 0 ? (
        <ul aria-label={t('links')} className="flex flex-wrap gap-x-3 gap-y-1">
          {profile.links.map((link) => (
            <li key={link.url} className="min-w-0">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer nofollow ugc"
                className="inline-flex min-h-6 max-w-full items-center gap-1 rounded-md type-meta font-semibold text-foreground outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <LinkMark site={link.site} className="size-3.5 shrink-0" />
                <span className="truncate">{link.host}</span>{' '}
                <span className="sr-only">{t('newTab')}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        profile.isSelf && <EditProfilePrompt field="links">{t('addLinks')}</EditProfilePrompt>
      )}
    </div>
  )
}
