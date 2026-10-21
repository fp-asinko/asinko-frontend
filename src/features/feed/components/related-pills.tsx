import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import type { PostItem } from '../feed.types'

/**
 * The communities and assets a post was tagged with (P-018, specs/backend-answer-1020 BA-07): gray
 * pills under its body, before the actions, each leading to its page. None, nothing.
 */
export function RelatedPills({
  related,
  className,
}: {
  related: PostItem['related']
  className?: string
}) {
  const t = useTranslations('feed.card')
  if (related.length === 0) return null
  return (
    <ul aria-label={t('related')} className={cn('flex flex-wrap gap-1.5', className)}>
      {related.map((each) => (
        <li key={each.path}>
          <Link
            href={each.path}
            className="inline-flex min-h-6 tap items-center rounded-full bg-muted px-2.5 type-meta font-semibold outline-none hover:bg-muted-hover focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {each.handle}
          </Link>
        </li>
      ))}
    </ul>
  )
}
