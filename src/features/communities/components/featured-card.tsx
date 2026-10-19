import { useTranslations } from 'next-intl'
import { FeatureMenu } from '@/components/organisms/featured'
import { Link } from '@/i18n/navigation'
import type { FeaturedItem } from '../communities.types'
import { ThesisState } from './thesis-state'

/**
 * A featured post or thesis, as LinkedIn's "Featured" cards (specs/profile-showcase PS-05): what it
 * is, its title or claim, its community and, in a thesis, its state. The whole card leads to the
 * post's page, or to the Theses tab (a thesis has no page of its own yet). On your own profile,
 * "⋯" takes it out (PS-07).
 */
export function FeaturedCard({
  item,
  thesesPath,
  own,
}: {
  item: FeaturedItem
  /** The profile's Theses tab. */
  thesesPath: string
  own: boolean
}) {
  const t = useTranslations('featured')
  const title = item.kind === 'post' ? item.title : item.claim
  const titleId = `featured-${item.kind}-${item.id}`

  return (
    <article
      aria-labelledby={titleId}
      className="relative flex h-full flex-col gap-2 rounded-lg border p-3.5 transition-colors hover:bg-surface"
    >
      <div className="flex min-h-6 items-center justify-between gap-2">
        <span className="type-section text-muted-foreground">
          {t(item.kind === 'post' ? 'post' : 'thesis')}
        </span>
        {item.kind === 'thesis' && <ThesisState state={item.state} />}
      </div>
      <h3 id={titleId} className="line-clamp-3 type-small font-bold wrap-anywhere">
        {/* The card's link covers it all (its ::after); the menu stays above it. */}
        <Link
          href={item.kind === 'post' ? item.path : thesesPath}
          className="rounded-sm outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
        >
          {title}
        </Link>
      </h3>
      <div className="mt-auto flex items-center justify-between gap-2">
        <p className="min-w-0 truncate type-meta text-muted-foreground">
          {item.kind === 'post'
            ? t('postMeta', {
                handle: item.community.handle,
                score: item.score,
                comments: item.commentCount,
              })
            : item.community.handle}
        </p>
        {own && (
          <div className="relative -my-1.5 -mr-1.5">
            <FeatureMenu
              kind={item.kind}
              id={item.id}
              label={t(item.kind === 'post' ? 'postMenu' : 'thesisMenu', { title })}
            />
          </div>
        )}
      </div>
    </article>
  )
}
