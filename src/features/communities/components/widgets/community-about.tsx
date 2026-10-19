import { CakeIcon, GlobeIcon, UsersIcon } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { AsideCard } from '@/components/molecules/aside-card'
import type { CommunityPage } from '../../communities.types'

/**
 * "Community details", always first and not movable (specs/community-widgets CW-05): its name, its
 * description, when it was created, its members and that it is public. From the community itself:
 * no widget holds it.
 */
export function CommunityAbout({
  page,
  idPrefix,
  action,
}: {
  page: Pick<
    CommunityPage,
    'slug' | 'handle' | 'subtitle' | 'description' | 'createdAt' | 'memberCount'
  >
  idPrefix: string
  /** "Edit widgets", for a moderator. */
  action?: ReactNode
}) {
  const t = useTranslations('communities.widgets.about')
  const format = useFormatter()
  const row =
    'flex items-center gap-2 type-meta text-muted-foreground [&_svg]:size-4 [&_svg]:shrink-0'

  return (
    <AsideCard id={`${idPrefix}-about`} title={page.subtitle ?? page.handle} action={action}>
      {page.description && (
        <p className="type-small whitespace-pre-line text-muted-foreground">{page.description}</p>
      )}
      <ul className="mt-3 flex flex-col gap-1.5">
        {page.createdAt && (
          <li className={row}>
            <CakeIcon aria-hidden />
            {t('created', {
              date: format.dateTime(new Date(page.createdAt), { dateStyle: 'medium' }),
            })}
          </li>
        )}
        <li className={row}>
          <UsersIcon aria-hidden />
          {t('members', { count: page.memberCount })}
        </li>
        <li className={row}>
          <GlobeIcon aria-hidden />
          {t('public')}
        </li>
      </ul>
    </AsideCard>
  )
}
