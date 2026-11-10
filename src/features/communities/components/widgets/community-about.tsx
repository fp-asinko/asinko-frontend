import { ArrowUpRightIcon, CakeIcon, GlobeIcon, UsersIcon } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { AsideCard } from '@/components/molecules/aside-card'
import type { CommunityPage } from '../../communities.types'

/**
 * "Community details", always first and not movable (specs/community-widgets CW-05): its name, its
 * description, its rules and website (PO, 2026-11-09: what creating and editing a group asks for),
 * when it was created, its members and that it is public. From the community itself: no widget
 * holds it.
 */
export function CommunityAbout({
  page,
  idPrefix,
  action,
}: {
  page: Pick<
    CommunityPage,
    | 'slug'
    | 'handle'
    | 'subtitle'
    | 'description'
    | 'rules'
    | 'mainUrl'
    | 'createdAt'
    | 'memberCount'
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
      {page.rules && (
        <section aria-labelledby={`${idPrefix}-about-rules`} className="mt-3">
          <h3 id={`${idPrefix}-about-rules`} className="type-section text-muted-foreground">
            {t('rules')}
          </h3>
          <p className="mt-1 type-small whitespace-pre-line text-muted-foreground">{page.rules}</p>
        </section>
      )}
      {page.mainUrl && (
        <a
          href={page.mainUrl.url}
          target="_blank"
          rel="noopener noreferrer nofollow ugc"
          className="mt-3 flex w-fit max-w-full tap items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 type-action text-muted-foreground hover:bg-muted-hover"
        >
          <span className="truncate">{page.mainUrl.domain}</span>
          <ArrowUpRightIcon aria-hidden className="size-3.5 shrink-0" />{' '}
          <span className="sr-only">{t('newTab')}</span>
        </a>
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
