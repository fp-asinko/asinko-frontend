import { getTranslations } from 'next-intl/server'
import { EmptyState } from '@/components/organisms/empty-state'
import type { ProfileDetails } from '../communities.types'
import { getUserTheses } from '../lib/theses-api'
import { TrackRecord } from './community-stats'
import { ThesesLoadMore } from './theses-load-more'
import { ThesisListItems } from './thesis-list-items'

/**
 * A person's "Theses" tab (specs/profile-track-record PT-05, PT-06): the first page from the
 * server, then "Load more", under the person's track record (PT-02, since the PO's change of
 * 2026-10-09). A secondary section: if it fails, the header stays and this says so.
 */
export async function ThesesList({
  userId,
  handle,
  isSelf,
  record,
}: {
  userId: string
  /** Correct, incorrect and cancelled: shown over the list. */
  record: Pick<ProfileDetails, 'correctCount' | 'incorrectCount' | 'cancelledCount'>
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
      <TrackRecord profile={record} className="px-4 pt-3 pb-1 md:px-0" />
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
