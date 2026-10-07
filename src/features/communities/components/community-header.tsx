import { CircleHelpIcon } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { ComingSoon } from '@/components/molecules/coming-soon'
import { IdentityBanner } from '@/components/molecules/identity-banner'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { cn } from '@/lib/utils'
import type { CommunityPage, ProfileDetails } from '../communities.types'
import { BackButton } from './back-button'
import { CommunityActions } from './community-actions'
import { ProfileMarks } from './profile-marks'

/**
 * The top of a community page, as the prototype (specs/community-pages § 1, measured on its
 * $NVDA view): the banner spans the whole center column, edge to edge up to the right column's
 * separator, square; the avatar (56px, white ring) sits on its bottom edge; title, name and
 * members go under it with the content's 16px gutter, then a divider. Mobile first: the actions
 * drop under the title when they do not fit. A profile (§ 12) titles with its display name, adds
 * its marks, stats and "Ask", and follows instead of joining (none on your own profile).
 */
export function CommunityHeader({
  page,
  profile,
}: {
  page: CommunityPage
  profile?: ProfileDetails
}) {
  const t = useTranslations('communities')
  const title = profile?.displayName ?? page.handle
  const subtitle = profile ? (profile.displayName ? page.handle : null) : page.subtitle
  const description = profile ? profile.bio : page.description

  return (
    <header className="border-b px-4 pb-4 sm:px-0">
      {/* -mx: the banner bleeds over the column's gutter (16px phones, the main's padding from sm). */}
      <div className="relative -mx-4">
        <IdentityBanner colorKey={page.slug} imageUrl={page.bannerUrl} className="h-24 md:h-30" />
        <BackButton className="absolute top-2.5 left-3" />
      </div>
      <UserAvatar
        name={page.handle}
        colorKey={page.slug}
        imageUrl={profile?.avatarUrl ?? page.avatarUrl}
        size="xl"
        className={cn(
          'relative -mt-7 size-14 border-3 border-background text-base',
          page.kind === 'user' ? 'rounded-full' : 'rounded-xl',
        )}
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {/* Loose classes, not type-page-title: the prototype's title is 800 (design-system.md). */}
            <h1 className="text-[1.375rem] leading-[1.3] font-extrabold wrap-anywhere">{title}</h1>
            {profile && <ProfileMarks profile={profile} />}
          </div>
          {subtitle && <p className="type-meta text-muted-foreground">{subtitle}</p>}
        </div>
        {!profile?.isSelf && (
          <CommunityActions
            slug={page.slug}
            handle={page.handle}
            membership={page.viewerMembership}
            favorite={page.viewerIsFavorite}
            variant={profile ? 'user' : 'community'}
          />
        )}
      </div>
      {description && <p className="mt-2 type-ui text-muted-foreground">{description}</p>}
      {profile ? <ProfileStats profile={profile} /> : <MemberCount count={page.memberCount} />}
      {profile && (
        <div className="mt-3">
          <ComingSoon
            label={t('profile.ask', { name: profile.displayName ?? page.handle })}
            className="inline-flex h-8 tap items-center gap-1.5 rounded-full border px-3 type-action"
          >
            <CircleHelpIcon aria-hidden className="size-3.5" />
            {t('profile.ask', { name: profile.displayName ?? page.handle })}
          </ComingSoon>
        </div>
      )}
    </header>
  )
}

function MemberCount({ count }: { count: number }) {
  const t = useTranslations('communities')
  return (
    <p className="mt-3 type-meta text-muted-foreground">
      {t.rich('members', { count, b: (chunks) => <Strong>{chunks}</Strong> })}
    </p>
  )
}

function Strong({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-foreground">{children}</strong>
}

/** Followers · accuracy · streak (CP-11); the streak counts correct theses in a row, not days. */
function ProfileStats({ profile }: { profile: ProfileDetails }) {
  const t = useTranslations('communities.profile')
  const format = useFormatter()
  const parts = [
    t.rich('followers', {
      count: profile.followerCount,
      b: (chunks) => <Strong>{chunks}</Strong>,
    }),
    profile.accuracyRate !== null &&
      t.rich('accuracy', {
        value: format.number(profile.accuracyRate, { style: 'percent' }),
        b: (chunks) => <Strong>{chunks}</Strong>,
      }),
    t.rich('streak', { count: profile.currentStreak, b: (chunks) => <Strong>{chunks}</Strong> }),
  ].filter(Boolean)

  return (
    <p className="mt-3 flex flex-wrap gap-x-2 type-meta text-muted-foreground">
      {parts.map((part, index) => (
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
