import { getFormatter, getTranslations } from 'next-intl/server'
import { getThesisUpdates } from '../lib/thesis-updates-api'
import { PostMarkdown } from './post-markdown'
import { ThesisUpdateComposer } from './thesis-update-composer'

/**
 * The author's updates of a thesis (specs/thesis-arguments TA-09, TA-10), above its arguments: the
 * newest first, each with its date and its Markdown. Its author, while it is open, can add one. A
 * secondary section: if they fail, the thesis stays and says so here. Without any, and nobody to
 * write one, nothing shows.
 */
export async function ThesisUpdates({
  thesisId,
  canPublish,
}: {
  thesisId: string
  /** Its author, with the thesis open (TA-10): the page decides it on the server. */
  canPublish: boolean
}) {
  const [t, format, result] = await Promise.all([
    getTranslations('feed.thesis.updates'),
    getFormatter(),
    getThesisUpdates(thesisId),
  ])
  const updates = result.ok ? result.data : []
  if (result.ok && updates.length === 0 && !canPublish) return null

  return (
    <section
      aria-labelledby="updates-title"
      className="flex flex-col gap-4 border-t px-4 pt-5 pb-5 md:px-0"
    >
      <h2 id="updates-title" className="type-ui font-bold">
        {t('title')}
      </h2>
      {canPublish && <ThesisUpdateComposer thesisId={thesisId} />}
      {!result.ok && <p className="type-small text-muted-foreground">{t('failed')}</p>}
      {updates.length > 0 && (
        <ol className="flex flex-col gap-4">
          {updates.map((update) => (
            <li key={update.id} className="rounded-xl bg-surface px-4 py-3">
              <time dateTime={update.createdAt} className="type-meta text-muted-foreground">
                {format.dateTime(new Date(update.createdAt), {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </time>
              <div className="mt-1 type-comment wrap-anywhere">
                <PostMarkdown>{update.body}</PostMarkdown>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
