import { useTranslations } from 'next-intl'
import { FeatureMenu } from '@/components/organisms/featured'
import { Link } from '@/i18n/navigation'
import type { FeaturedItem } from '../communities.types'
import { ThesisState } from './thesis-state'

/**
 * A featured post, poll or thesis, as LinkedIn's "Featured" cards (specs/profile-showcase PS-05,
 * specs/backend-answer-1020 BA-04): what it is, its title, question or claim, its community and, in
 * a thesis, its state. The whole card leads to the post's page; a poll and a thesis have no page of
 * their own yet, so to the profile's Posts or Theses tab. On your own profile, "⋯" takes it out.
 */
export function FeaturedCard({
  item,
  postsPath,
  thesesPath,
  own,
}: {
  item: FeaturedItem
  /** The profile's Posts tab, where a poll shows. */
  postsPath: string
  /** The profile's Theses tab. */
  thesesPath: string
  own: boolean
}) {
  const t = useTranslations('featured')
  const title = item.kind === 'thesis' ? item.claim : item.title
  const titleId = `featured-${item.kind}-${item.id}`
  const href = item.kind === 'post' ? item.path : item.kind === 'poll' ? postsPath : thesesPath
  const meta =
    item.kind === 'post'
      ? t('postMeta', {
          handle: item.community.handle,
          score: item.score,
          comments: item.commentCount,
        })
      : item.kind === 'poll'
        ? t('pollMeta', { handle: item.community.handle, comments: item.commentCount })
        : item.community.handle

  return (
    <article
      aria-labelledby={titleId}
      className="relative flex h-full flex-col gap-2 rounded-lg border p-3.5 transition-colors hover:bg-surface"
    >
      <div className="flex min-h-6 items-center justify-between gap-2">
        <span className="type-section text-muted-foreground">{t(item.kind)}</span>
        {item.kind === 'thesis' && <ThesisState state={item.state} />}
      </div>
      <h3 id={titleId} className="line-clamp-3 type-small font-bold wrap-anywhere">
        {/* The card's link covers it all (its ::after); the menu stays above it. */}
        <Link
          href={href}
          className="rounded-sm outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
        >
          {title}
        </Link>
      </h3>
      <div className="mt-auto flex items-center justify-between gap-2">
        <p className="min-w-0 truncate type-meta text-muted-foreground">{meta}</p>
        {own && (
          <div className="relative -my-1.5 -mr-1.5">
            <FeatureMenu kind={item.kind} id={item.id} label={t(`${item.kind}Menu`, { title })} />
          </div>
        )}
      </div>
    </article>
  )
}
