'use client'

import dynamic from 'next/dynamic'
import { useLocale } from 'next-intl'
import { useRef, useState } from 'react'
import type { Locale } from '@/i18n/routing'
import { useRouter } from '@/i18n/navigation'
import { submitPath, type SubmitType } from '@/i18n/submit-path'
import type { CommunityOption } from '../composer.types'
import { discardDraft } from '../hooks/use-local-draft'
import { DiscardDialog } from './discard-dialog'
import type { PreviewAction } from './body-tabs'
import type { CreateFormat } from './format-tabs'
import { PostEditor } from './post-editor'
import { EditorSkeleton } from './submit-editor-skeleton'

// The thesis editor, at the first time its tab is chosen (specs/thesis-create TC-19).
const ThesisEditor = dynamic(() => import('./thesis-editor').then((mod) => mod.ThesisEditor), {
  ssr: false,
  loading: EditorSkeleton,
})

/** A handle's slug: $BTC is BTC and #macro is macro. */
const slugOf = (handle: string) => handle.slice(1)

type PostFormat = Exclude<CreateFormat, 'THESIS'>

/**
 * The editors on their page (specs/submit-page SU-03 to SU-05, specs/thesis-create § 2): the
 * post's and, from its tab, the thesis's. Both stay mounted once opened, the other one hidden:
 * switching loses nothing. Another community, other related ones (specs/related-aside) or the
 * format go into the URL (the page and its right column follow them, the forms keep what is
 * written); Cancel with something written asks first and, if confirmed, also drops the drafts;
 * publishing goes to the new post, or to the author's theses.
 */
export function SubmitEditor({
  type,
  community,
  storageKey,
  thesisStorageKey = null,
  related = [],
  preview,
}: {
  /** The preview's Server Action (specs/submit-tools ST-01). */
  preview?: PreviewAction
  type: CreateFormat
  community: CommunityOption | null
  storageKey: string | null
  /** Where the thesis draft is kept (thesisDraftKey). */
  thesisStorageKey?: string | null
  /** The related ones of the URL, as handles (specs/related-aside RA-04). */
  related?: string[]
}) {
  const router = useRouter()
  const locale = useLocale() as Locale
  const [thesis, setThesis] = useState(type === 'THESIS')
  // Mounted at the first visit to its tab, and kept.
  const [thesisOpened, setThesisOpened] = useState(type === 'THESIS')
  // The URL carries all three: changing one keeps the others (RA-04).
  const where = useRef<{
    community: string | null
    related: string[]
    type: SubmitType | undefined
  }>({
    community: community?.slug ?? null,
    related: related.map(slugOf),
    type: type === 'TEXT' ? undefined : (type.toLowerCase() as SubmitType),
  })
  function follow(next: Partial<typeof where.current>) {
    where.current = { ...where.current, ...next }
    router.replace(submitPath(locale, where.current), { scroll: false })
  }
  const postWritten = useRef<(() => boolean) | null>(null)
  const thesisWritten = useRef<(() => boolean) | null>(null)
  const [discarding, setDiscarding] = useState(false)

  function showThesis() {
    setThesis(true)
    setThesisOpened(true)
    follow({ type: 'thesis' })
  }
  function showPost(format: PostFormat) {
    setThesis(false)
    follow({ type: format === 'TEXT' ? undefined : (format.toLowerCase() as SubmitType) })
  }

  // Back to where the person came from in the site; the Home when the page was opened directly or
  // from another site.
  function leave() {
    const fromSite = document.referrer && new URL(document.referrer).origin === location.origin
    if (fromSite && window.history.length > 1) router.back()
    else router.push('/')
  }
  function cancel() {
    const written = postWritten.current?.() || thesisWritten.current?.()
    if (written) setDiscarding(true)
    else leave()
  }

  return (
    <>
      <div hidden={thesis}>
        <PostEditor
          type={type === 'THESIS' ? 'TEXT' : type}
          community={community}
          storageKey={storageKey}
          draftRef={postWritten}
          onCancel={cancel}
          onPublished={(path) => router.push(path)}
          related={related}
          preview={preview}
          onCommunityChange={(next) => follow({ community: next?.slug ?? null })}
          onRelatedChange={(handles) => follow({ related: handles.map(slugOf) })}
          onThesis={showThesis}
        />
      </div>
      {thesisOpened && (
        <div hidden={!thesis}>
          <ThesisEditor
            community={community}
            storageKey={thesisStorageKey}
            draftRef={thesisWritten}
            onCancel={cancel}
            onFormat={showPost}
            onCommunityChange={(next) => follow({ community: next?.slug ?? null })}
          />
        </div>
      )}
      <DiscardDialog
        open={discarding}
        onOpenChange={setDiscarding}
        onDiscard={() => {
          if (storageKey) discardDraft(storageKey)
          if (thesisStorageKey) discardDraft(thesisStorageKey)
          leave()
        }}
      />
    </>
  )
}
