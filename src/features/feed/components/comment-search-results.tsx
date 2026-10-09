import { useFormatter, useNow, useTranslations } from 'next-intl'
import { Announce } from '@/components/molecules/announce'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { Link } from '@/i18n/navigation'
import { previewProps } from '@/lib/communities/preview'
import type { CommentNode } from '../feed.types'
import { highlightMatches } from '../lib/highlight'
import { markdownText } from '../lib/post-excerpt'
import { SearchXIcon } from 'lucide-react'
import { EmptyState } from '@/components/organisms/empty-state'

/**
 * The comments that match a search (specs/post-detail-refresh PD-05): how many, the way back to
 * all of them, and each one as a comment without its replies, its text plain with what was
 * searched in bold. Bold, not a color: the system is monochrome (design-system.md).
 */
export function CommentSearchResults({
  query,
  comments,
  allHref,
  announcer,
}: {
  query: string
  comments: CommentNode[]
  /** The same page without the search. */
  allHref: string
  /** The live region that stays on the page, outside this list's Suspense (WCAG 4.1.3). */
  announcer: string
}) {
  const t = useTranslations('postDetail.search')
  const format = useFormatter()
  const now = useNow()
  const summary = t('results', { count: comments.length, q: query })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        {/* Without results the empty state below says it: not twice. */}
        {comments.length > 0 && <p className="type-small text-muted-foreground">{summary}</p>}
        <Announce regionId={announcer} text={summary} />
        <Link
          href={allHref}
          scroll={false}
          className="inline-flex min-h-11 items-center type-action underline-offset-2 hover:underline md:min-h-6"
        >
          {t('all')}
        </Link>
      </div>
      {comments.length === 0 && (
        <EmptyState icon={<SearchXIcon />} title={summary} description={t('noneBody')} />
      )}
      {comments.length > 0 && (
        <ul className="flex flex-col gap-4">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-2.5">
              {comment.author && (
                <UserAvatar
                  name={comment.author.username}
                  imageUrl={comment.author.avatarUrl}
                  size="xs"
                />
              )}
              <div className="min-w-0 flex-1 wrap-anywhere">
                <p className="mb-0.75 flex flex-wrap items-center gap-x-1.25 type-meta text-muted-foreground">
                  {comment.author && (
                    <>
                      <Link
                        href={comment.author.path}
                        {...previewProps('user', comment.author.username)}
                        className="-my-1 inline-block py-1 font-bold text-foreground hover:underline"
                      >
                        {comment.author.handle}
                      </Link>
                      <span aria-hidden>·</span>
                    </>
                  )}
                  <time dateTime={comment.createdAt}>
                    {format.relativeTime(new Date(comment.createdAt), now)}
                  </time>
                </p>
                <p className="type-small">
                  {highlightMatches(markdownText(comment.body), query).map((part, index) =>
                    part.match ? (
                      <mark key={index} className="bg-transparent font-bold text-foreground">
                        {part.text}
                      </mark>
                    ) : (
                      part.text
                    ),
                  )}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
