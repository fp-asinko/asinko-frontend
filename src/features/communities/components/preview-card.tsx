import { useFormatter, useTranslations } from 'next-intl'
import { useId, type ReactNode } from 'react'
import { IdentityBanner } from '@/components/molecules/identity-banner'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { Link } from '@/i18n/navigation'
import { communityPath } from '@/lib/communities/paths'
import type { Preview, PreviewCommunity, ProfileDetails } from '../communities.types'
import { CommunityActions } from './community-actions'
import { ProfileMarks } from './profile-marks'

type Stat = { label: string; value: string }

/**
 * What a hover card shows (specs/mention-preview MP-03 to MP-06), as Reddit's: a group or an asset
 * under its banner, a person with a bigger avatar and no banner. The name links to the page, Join
 * or Follow sit next to it (none on your own card), and the numbers go in columns under a divider.
 * `summaryId` marks what a screen reader hears as the link's description: the text and numbers,
 * not the buttons.
 */
export function PreviewCard({ preview, summaryId }: { preview: Preview; summaryId: string }) {
  const titleId = useId()
  const { community, profile } = preview
  const actions = !profile?.isSelf && (
    <CommunityActions
      slug={community.slug}
      handle={community.handle}
      membership={community.viewerMembership}
      favorite={null}
      variant={profile ? 'user' : 'community'}
      // Joined, the focus stays in the card: on its name (and back to the link on closing).
      focusFallbackId={titleId}
    />
  )
  return profile ? (
    <PersonCard
      community={community}
      profile={profile}
      titleId={titleId}
      summaryId={summaryId}
      actions={actions}
    />
  ) : (
    <CommunityCard
      community={community}
      titleId={titleId}
      summaryId={summaryId}
      actions={actions}
    />
  )
}

type Parts = { titleId: string; summaryId: string; actions: ReactNode }

function CommunityCard({
  community,
  titleId,
  summaryId,
  actions,
}: Parts & { community: PreviewCommunity }) {
  const t = useTranslations('preview.stats')
  const format = useFormatter()
  const stats: Stat[] = [
    { label: t('members'), value: compact(format, community.memberCount) },
    ...(community.createdAt
      ? [{ label: t('created'), value: monthYear(format, community.createdAt) }]
      : []),
  ]

  return (
    <div>
      <IdentityBanner colorKey={community.slug} imageUrl={community.bannerUrl} className="h-24" />
      <div className="p-4">
        <div className="flex items-center gap-3">
          <UserAvatar
            name={community.handle}
            colorKey={community.slug}
            imageUrl={community.avatarUrl}
            size="xl"
            className="size-14 rounded-xl text-base"
          />
          <div className="min-w-0 flex-1">
            <Title id={titleId} community={community}>
              {community.handle}
            </Title>
            {community.subtitle && (
              <p className="truncate type-meta text-muted-foreground">{community.subtitle}</p>
            )}
          </div>
          {actions}
        </div>
        <Summary id={summaryId} text={community.description} stats={stats} />
      </div>
    </div>
  )
}

function PersonCard({
  community,
  profile,
  titleId,
  summaryId,
  actions,
}: Parts & { community: PreviewCommunity; profile: ProfileDetails }) {
  const t = useTranslations('preview.stats')
  const format = useFormatter()
  const stats: Stat[] = [
    { label: t('followers'), value: compact(format, profile.followerCount) },
    ...(profile.accuracyRate !== null
      ? [
          {
            label: t('accuracy'),
            value: format.number(profile.accuracyRate, { style: 'percent' }),
          },
        ]
      : []),
    { label: t('streak'), value: format.number(profile.currentStreak) },
    { label: t('since'), value: monthYear(format, profile.joinedAt) },
  ]

  return (
    <div className="p-4">
      <div className="flex items-center gap-3">
        <UserAvatar
          name={community.handle}
          colorKey={community.slug}
          imageUrl={profile.avatarUrl ?? community.avatarUrl}
          size="xl"
          className="size-16 rounded-full text-lg"
        />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <Title id={titleId} community={community}>
              {profile.displayName ?? community.handle}
            </Title>
            <ProfileMarks profile={profile} />
          </div>
          {profile.displayName && (
            <p className="truncate type-meta text-muted-foreground">{community.handle}</p>
          )}
        </div>
        {actions}
      </div>
      <Summary id={summaryId} text={profile.bio} stats={stats} />
    </div>
  )
}

/** The name, a link to the page. */
function Title({
  id,
  community,
  children,
}: {
  id: string
  community: PreviewCommunity
  children: ReactNode
}) {
  return (
    <Link
      id={id}
      href={communityPath(community.kind, community.slug)}
      className="block min-w-0 truncate type-post-title hover:underline"
    >
      {children}
    </Link>
  )
}

/** What it is about, then its numbers in columns, the value over its label (as Reddit). */
function Summary({ id, text, stats }: { id: string; text: string | null; stats: Stat[] }) {
  return (
    <div id={id}>
      {text && (
        // Users' text: long words wrap instead of overflowing the card.
        <p className="mt-3 line-clamp-3 type-post-body wrap-anywhere">{text}</p>
      )}
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col-reverse">
            <dt className="type-meta text-muted-foreground">{stat.label}</dt>
            <dd className="type-post-title">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

type Format = ReturnType<typeof useFormatter>

const compact = (format: Format, value: number) =>
  format.number(value, { notation: 'compact', maximumFractionDigits: 1 })

const monthYear = (format: Format, iso: string) =>
  format.dateTime(new Date(iso), { month: 'short', year: 'numeric' })
