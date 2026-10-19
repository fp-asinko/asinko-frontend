import { useTranslations } from 'next-intl'
import type { FeaturedItem } from '../communities.types'
import { FeaturedCard } from './featured-card'

/**
 * "Featured", as LinkedIn's (specs/profile-showcase PS-05, PS-06): up to three posts or theses the
 * person put at the front, the last featured first. In phones a row that slides sideways (a part
 * of the next card shows it goes on); from md, three columns. Nothing featured, no section.
 */
export function FeaturedSection({
  items,
  thesesPath,
  own,
}: {
  items: FeaturedItem[]
  thesesPath: string
  own: boolean
}) {
  const t = useTranslations('featured')
  if (items.length === 0) return null

  return (
    <section aria-labelledby="featured-title" className="border-b py-4">
      <h2 id="featured-title" className="px-4 type-section text-muted-foreground sm:px-0">
        {t('title')}
      </h2>
      <ul className="mt-3 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 sm:scroll-px-0 sm:px-0 md:grid md:grid-cols-3 md:overflow-visible">
        {items.map((item) => (
          <li key={`${item.kind}-${item.id}`} className="w-65 shrink-0 snap-start md:w-auto">
            <FeaturedCard item={item} thesesPath={thesesPath} own={own} />
          </li>
        ))}
      </ul>
    </section>
  )
}
