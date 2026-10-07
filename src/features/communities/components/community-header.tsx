import { useTranslations } from 'next-intl'
import { IdentityBanner } from '@/components/molecules/identity-banner'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { cn } from '@/lib/utils'
import type { CommunityPage } from '../communities.types'
import { BackButton } from './back-button'
import { CommunityActions } from './community-actions'

/**
 * The top of a community page, as the prototype (specs/community-pages § 1): banner (its image or
 * the identity gradient), the avatar over it, the handle as the page's H1, the name when it says
 * more, the description, the members and the actions. Mobile first: the actions drop under the
 * title when they do not fit.
 */
export function CommunityHeader({ page }: { page: CommunityPage }) {
  const t = useTranslations('communities')

  return (
    <header className="mb-4">
      <div className="relative">
        <IdentityBanner
          colorKey={page.slug}
          imageUrl={page.bannerUrl}
          className="h-24 sm:rounded-xl md:h-30"
        />
        <BackButton className="absolute top-3 left-3" />
      </div>
      <div className="px-4 sm:px-0">
        <UserAvatar
          name={page.handle}
          colorKey={page.slug}
          imageUrl={page.avatarUrl}
          size="xl"
          className={cn(
            'relative -mt-8 size-16 border-4 border-background text-lg',
            page.kind === 'user' ? 'rounded-full' : 'rounded-xl',
          )}
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="min-w-0">
            <h1 className="type-page-title wrap-anywhere">{page.handle}</h1>
            {page.subtitle && <p className="type-ui text-muted-foreground">{page.subtitle}</p>}
          </div>
          <CommunityActions
            slug={page.slug}
            handle={page.handle}
            membership={page.viewerMembership}
            favorite={page.viewerIsFavorite}
          />
        </div>
        {page.description && (
          <p className="mt-2 type-ui text-muted-foreground">{page.description}</p>
        )}
        <p className="mt-2 type-meta text-muted-foreground">
          {t('members', { count: page.memberCount })}
        </p>
      </div>
    </header>
  )
}
