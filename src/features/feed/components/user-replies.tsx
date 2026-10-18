import { CloudOffIcon, MessageCircleIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { EmptyState } from '@/components/organisms/empty-state'
import { getUserComments } from '../lib/user-comments-api'
import { RepliesLoadMore } from './replies-load-more'
import { ReplyListItems } from './reply-list-items'

/**
 * A person's "Replies" tab (specs/backend-adoption BK-03, BK-04): their comments, newest first,
 * the first page from the server, then "Load more". A secondary section: if it fails, the header
 * stays and this says so.
 */
export async function UserReplies({
  userId,
  handle,
  isSelf,
}: {
  userId: string
  /** @maria: for the empty state. */
  handle: string
  isSelf: boolean
}) {
  const t = await getTranslations('feed.replies')
  const result = await getUserComments(userId)

  return (
    <section aria-labelledby="replies-title">
      <h2 id="replies-title" className="sr-only">
        {t('title')}
      </h2>
      {!result.ok ? (
        <EmptyState icon={<CloudOffIcon />} title={t('error')} description={t('errorBody')} />
      ) : result.data.items.length === 0 ? (
        <EmptyState
          icon={<MessageCircleIcon />}
          title={isSelf ? t('emptySelf') : t('empty', { handle })}
        />
      ) : (
        <>
          <ul className="divide-y">
            <ReplyListItems replies={result.data.items} />
          </ul>
          {result.data.nextCursor && (
            <RepliesLoadMore userId={userId} cursor={result.data.nextCursor} />
          )}
        </>
      )}
    </section>
  )
}
