import { getTranslations } from 'next-intl/server'
import { EmptyState } from '@/components/organisms/empty-state'
import { getUserTheses } from '../lib/theses-api'
import { ThesesLoadMore } from './theses-load-more'
import { ThesisListItems } from './thesis-list-items'

/**
 * A person's "Theses" tab (specs/profile-track-record PT-05, PT-06): the first page from the
 * server, then "Load more". A secondary section: if it fails, the header stays and this says so.
 */
export async function ThesesList({
  userId,
  handle,
  isSelf,
}: {
  userId: string
  /** @maria: for the empty state. */
  handle: string
  isSelf: boolean
}) {
  const t = await getTranslations('communities.theses')
  const result = await getUserTheses(userId)

  return (
    <section aria-labelledby="theses-title">
      <h2 id="theses-title" className="sr-only">
        {t('title')}
      </h2>
      {/* Content that arrives streamed, not a change to announce: plain text, as the feed's. */}
      {!result.ok ? (
        <EmptyState message={t('error')} />
      ) : result.data.items.length === 0 ? (
        <EmptyState message={isSelf ? t('emptySelf') : t('empty', { handle })} />
      ) : (
        <>
          <ul className="divide-y">
            <ThesisListItems theses={result.data.items} />
          </ul>
          {result.data.nextCursor && (
            <ThesesLoadMore userId={userId} cursor={result.data.nextCursor} />
          )}
        </>
      )}
    </section>
  )
}
