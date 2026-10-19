import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { Link } from '@/i18n/navigation'
import type { WidgetLink } from '../../communities.types'

/**
 * A link a moderator wrote (specs/community-widgets CW-07): a page of the site with the localized
 * Link; an external one in another tab, without passing who sent the person, and saying so.
 */
export function WidgetAnchor({
  link,
  className,
  children,
}: {
  link: WidgetLink
  className?: string
  children: ReactNode
}) {
  const t = useTranslations('communities.widgets')
  if (!link.external) {
    return (
      <Link href={link.url} className={className}>
        {children}
      </Link>
    )
  }
  return (
    <a href={link.url} target="_blank" rel="noopener noreferrer nofollow ugc" className={className}>
      {children} <span className="sr-only">{t('newTab')}</span>
    </a>
  )
}
