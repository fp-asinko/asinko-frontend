import { CircleHelpIcon, PlusIcon, Share2Icon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { BackButton } from '@/components/molecules/back-button'
import { ComingSoon } from '@/components/molecules/coming-soon'
import { ShareButton } from '@/components/molecules/share-button'
import { IdentityBanner } from '@/components/molecules/identity-banner'
import { ComposeTrigger } from '@/components/organisms/compose'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { cn } from '@/lib/utils'
import type { CommunityPage, ProfileDetails } from '../communities.types'
import { CommunityActions } from './community-actions'
import { MemberCount, ProfileStats } from './community-stats'
import { ProfileMarks } from './profile-marks'
import { EditProfileButton, EditProfileProvider } from './edit-profile-button'
import { OpenToCard } from './open-to-card'
import { ProfileAbout } from './profile-about'
import { ProfileIntro } from './profile-intro'
import { toEditableProfile } from '../lib/editable-profile'

/**
 * The top of a community page, as the prototype (specs/community-pages § 1, measured on its
 * $NVDA view): the banner spans the whole center column, edge to edge up to the right column's
 * separator, square; the avatar (56px, white ring) sits on its bottom edge; title, name and
 * members go under it with the content's 16px gutter, then a divider. Mobile first: the actions
 * drop under the title when they do not fit. A profile (§ 12) titles with its display name, adds
 * its marks, its presentation (headline, location and links, specs/profile-presentation), stats and
 * "Ask", and follows instead of joining (none on your own profile: there, "Edit profile").
 */
export function CommunityHeader({
  page,
  profile,
  moderation,
}: {
  page: CommunityPage
  profile?: ProfileDetails
  /** A moderator's tools, by the actions (specs/community-widgets CW-08: "Edit widgets"). */
  moderation?: ReactNode
}) {
  const t = useTranslations('communities')
  // A group's # much smaller and in gray, the name the protagonist (specs/byline-handles BH-03);
  // one string for assistive tech, "#crypto". An asset keeps its $, a profile its name (Q1).
  const title =
    profile?.displayName ??
    (page.kind === 'group' ? (
      <>
        <span className="mr-0.5 align-baseline text-[0.75em] font-semibold text-muted-foreground">
          {page.handle.slice(0, 1)}
        </span>
        {page.handle.slice(1)}
      </>
    ) : (
      page.handle
    ))
  const subtitle = profile ? (profile.displayName ? page.handle : null) : page.subtitle
  const description = profile ? profile.bio : page.description
  // Anyone posts in a group or an asset; in a profile, only its owner (PC-03).
  const canPost = !profile || profile.isSelf

  const header = (
    <header className="border-b px-4 pb-4 sm:px-0">
      {/* -mx: the banner bleeds over the column's gutter (16px phones, the main's padding from sm). */}
      <div className="relative -mx-4">
        <IdentityBanner
          colorKey={page.slug}
          imageUrl={profile?.bannerUrl ?? page.bannerUrl}
          className="h-24 md:h-30"
        />
        <BackButton to="home" className="absolute top-2.5 left-3" />
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
        <div className="flex flex-wrap items-center gap-2">
          {canPost && (
            // As Reddit's "Create post": the page to create one, with this community chosen
            // (specs/submit-page SU-02).
            <ComposeTrigger
              community={page.slug}
              className="inline-flex h-8 tap items-center gap-1.5 rounded-full bg-muted px-3.5 type-action outline-none hover:bg-muted-hover focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <PlusIcon aria-hidden className="size-4" />
              {t('createPost')}
            </ComposeTrigger>
          )}
          {moderation}
          {/* Your own profile: edit it where others follow (specs/profile-edit PE-01). */}
          {profile?.isSelf && <EditProfileButton />}
          {!profile?.isSelf && (
            <CommunityActions
              slug={page.slug}
              handle={page.handle}
              membership={page.viewerMembership}
              favorite={page.viewerIsFavorite}
              variant={profile ? 'user' : 'community'}
            />
          )}
          {profile && (
            // Share the profile, as Reddit's card (specs/profile-aside PA-04): here, by the
            // actions, the same in phones and desktop; in the right column it would travel twice.
            <ShareButton
              href={`/user/${encodeURIComponent(profile.username)}`}
              aria-label={t('profile.share')}
              className="inline-flex size-8 tap items-center justify-center rounded-full bg-muted outline-none hover:bg-muted-hover focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-4"
            >
              <Share2Icon aria-hidden />
            </ShareButton>
          )}
        </div>
      </div>
      {/* Under the name and the actions, the whole width: a long headline never squeezes them. */}
      {profile && <ProfileIntro profile={profile} />}
      {/* A person's About clamps at three lines (specs/profile-showcase PS-04). */}
      {description &&
        (profile ? (
          <ProfileAbout text={description} />
        ) : (
          // The user's own text: long words wrap at 360px and its line breaks stay (PE-07).
          <p className="mt-2 type-ui wrap-anywhere whitespace-pre-line text-muted-foreground">
            {description}
          </p>
        ))}
      {profile ? (
        <ProfileStats profile={profile} className="mt-3" />
      ) : (
        <MemberCount
          count={page.memberCount}
          slug={page.slug}
          handle={page.handle}
          className="mt-3"
        />
      )}
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
      {profile && <OpenToCard values={profile.openTo} isSelf={profile.isSelf} />}
    </header>
  )

  if (!profile?.isSelf) return header
  return <EditProfileProvider profile={toEditableProfile(profile)}>{header}</EditProfileProvider>
}
