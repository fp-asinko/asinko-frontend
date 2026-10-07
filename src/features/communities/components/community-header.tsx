import { useTranslations } from 'next-intl'
import { IdentityBanner } from '@/components/molecules/identity-banner'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { cn } from '@/lib/utils'
import type { CommunityPage } from '../communities.types'
import { BackButton } from './back-button'
import { CommunityActions } from './community-actions'

/**
 * The top of a community page, as the prototype (specs/community-pages § 1, measured on its
 * $NVDA view): the banner spans the whole center column, edge to edge up to the right column's
 * separator, square; the avatar (56px, white ring) sits on its bottom edge; title, name and
 * members go under it with the content's 16px gutter, then a divider. Mobile first: the actions
 * drop under the title when they do not fit.
 */
export function CommunityHeader({ page }: { page: CommunityPage }) {
  const t = useTranslations('communities')

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
        imageUrl={page.avatarUrl}
        size="xl"
        className={cn(
          'relative -mt-7 size-14 border-3 border-background text-base',
          page.kind === 'user' ? 'rounded-full' : 'rounded-xl',
        )}
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          {/* Loose classes, not type-page-title: the prototype's title is 800 (design-system.md). */}
          <h1 className="text-[1.375rem] leading-[1.3] font-extrabold wrap-anywhere">
            {page.handle}
          </h1>
          {page.subtitle && <p className="type-meta text-muted-foreground">{page.subtitle}</p>}
        </div>
        <CommunityActions
          slug={page.slug}
          handle={page.handle}
          membership={page.viewerMembership}
          favorite={page.viewerIsFavorite}
        />
      </div>
      {page.description && <p className="mt-2 type-ui text-muted-foreground">{page.description}</p>}
      <p className="mt-3 type-meta text-muted-foreground">
        {t.rich('members', {
          count: page.memberCount,
          b: (chunks) => <strong className="font-semibold text-foreground">{chunks}</strong>,
        })}
      </p>
    </header>
  )
}
