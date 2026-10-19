import { useTranslations } from 'next-intl'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { Link } from '@/i18n/navigation'
import type { ActiveCommunity } from '../communities.types'

/** Shown at once; the rest fold under "See all" (specs/profile-aside PA-05). */
const SHOWN = 5

function Row({ community }: { community: ActiveCommunity }) {
  const t = useTranslations('communities.profileCard')
  return (
    <li>
      <Link
        href={community.path}
        className="flex min-h-10 items-center gap-2.5 rounded-lg px-2 outline-none hover:bg-surface focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <UserAvatar
          name={community.handle}
          colorKey={community.colorKey}
          imageUrl={community.avatarUrl}
          size="sm"
          className={community.kind === 'user' ? 'rounded-full' : 'rounded-md'}
        />
        <span className="min-w-0 flex-1 truncate type-small font-semibold">{community.handle}</span>{' '}
        <span className="shrink-0 type-meta text-muted-foreground tabular-nums">
          {t('posts', { count: community.postCount })}
        </span>
      </Link>
    </li>
  )
}

/**
 * "Participates in", as Reddit's profile card (specs/profile-aside PA-05): where the person
 * published most in the last 90 days, with how many posts, each leading to its page. Five at once;
 * "See all (N)" unfolds the rest without JavaScript. Nothing lately, nothing shown.
 */
export function ActiveCommunities({
  communities,
  idPrefix,
}: {
  communities: ActiveCommunity[]
  /** The card shows twice (the page in phones, the column from lg): ids of their own. */
  idPrefix: string
}) {
  const t = useTranslations('communities.profileCard')
  if (communities.length === 0) return null
  const titleId = `${idPrefix}-active`
  const rest = communities.slice(SHOWN)

  return (
    <section aria-labelledby={titleId} className="mt-4 border-t pt-3.5">
      <h3 id={titleId} className="px-2 type-section text-muted-foreground">
        {t('activeTitle')}
      </h3>
      <ul className="mt-1.5">
        {communities.slice(0, SHOWN).map((community) => (
          <Row key={community.path} community={community} />
        ))}
      </ul>
      {rest.length > 0 && (
        <details className="group/all">
          <summary className="mt-1 inline-flex min-h-8 list-none items-center rounded-full px-2 type-action text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
            <span className="group-open/all:hidden">
              {t('seeAll', { count: communities.length })}
            </span>
            <span className="hidden group-open/all:inline">{t('seeFewer')}</span>
          </summary>
          <ul>
            {rest.map((community) => (
              <Row key={community.path} community={community} />
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}
