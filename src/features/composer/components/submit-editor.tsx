'use client'

import dynamic from 'next/dynamic'
import { useLocale } from 'next-intl'
import { useRef, useState, type RefObject } from 'react'
import type { Locale } from '@/i18n/routing'
import { useRouter } from '@/i18n/navigation'
import { submitPath, type SubmitType } from '@/i18n/submit-path'
import { communityPath } from '@/lib/communities/paths'
import type { CommunityOption, SavedDraft, SuggestedAssets } from '../composer.types'
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
 * switching loses nothing, and each keeps its own place: the post's community and related ones,
 * the thesis's community (SU-13). Another community, other related ones (specs/related-aside)
 * or the format go into the URL (the page and its right column follow the open tab's, the forms
 * keep what is written); Cancel with something written asks first and, if confirmed, also drops the drafts;
 * publishing goes to the new post, or to the author's theses.
 */
export function SubmitEditor({
  type,
  community,
  storageKey,
  thesisStorageKey = null,
  thesisDrafts = true,
  related = [],
  suggested,
  preview,
}: {
  /** The preview's Server Action (specs/submit-tools ST-01). */
  preview?: PreviewAction
  type: CreateFormat
  community: CommunityOption | null
  storageKey: string | null
  /** Where the thesis draft is kept (thesisDraftKey). */
  thesisStorageKey?: string | null
  /** Whether a thesis's draft can be saved (P-038): "Coming soon" when not. */
  thesisDrafts?: boolean
  /** The related ones of the URL, as handles (specs/related-aside RA-04). */
  related?: string[]
  /** The assets beside the thesis's search: the viewer's interests, then the popular (FS-04). */
  suggested?: SuggestedAssets
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
  // Each tab its own place (SU-13): the URL shows the open one's. The thesis starts clean, with
  // only an asset of the URL (TC-02), unless the page was opened on it.
  const thesisCommunity = type === 'THESIS' || community?.handle.startsWith('$') ? community : null
  const places = useRef({
    post: { community: community?.slug ?? null, related: related.map(slugOf) },
    thesis: { community: thesisCommunity?.slug ?? null },
  })
  function follow(next: Partial<typeof where.current>) {
    where.current = { ...where.current, ...next }
    router.replace(submitPath(locale, where.current), { scroll: false })
  }
  const postWritten = useRef<(() => boolean) | null>(null)
  const thesisWritten = useRef<(() => boolean) | null>(null)
  const [discarding, setDiscarding] = useState(false)

  const postBox = useRef<HTMLDivElement>(null)
  const thesisBox = useRef<HTMLDivElement>(null)
  // The format asked from the thesis's tabs: the post's editor takes it (each ask is new).
  const [postFormat, setPostFormat] = useState<{ format: PostFormat } | null>(null)
  // A draft chosen in one editor's list that belongs to the other (specs/thesis-drafts TD-03).
  const [postDraft, setPostDraft] = useState<{ draft: SavedDraft } | null>(null)
  const [thesisDraft, setThesisDraft] = useState<{ draft: SavedDraft } | null>(null)

  /** The focus follows the swap to the chosen tab of the editor now shown (WCAG 2.4.3). */
  function focusTab(box: RefObject<HTMLDivElement | null>) {
    requestAnimationFrame(() =>
      box.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus(),
    )
  }
  function showThesis() {
    setThesis(true)
    setThesisOpened(true)
    follow({ type: 'thesis', ...places.current.thesis, related: [] })
    focusTab(thesisBox)
  }
  function showPost(format: PostFormat) {
    setThesis(false)
    setPostFormat({ format })
    follow({
      type: format === 'TEXT' ? undefined : (format.toLowerCase() as SubmitType),
      ...places.current.post,
    })
    focusTab(postBox)
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
      <div ref={postBox} hidden={thesis}>
        <PostEditor
          type={type === 'THESIS' ? 'TEXT' : type}
          community={community}
          storageKey={storageKey}
          draftRef={postWritten}
          onCancel={cancel}
          onPublished={(path) => router.push(path)}
          related={related}
          preview={preview}
          onCommunityChange={(next) => {
            places.current.post.community = next?.slug ?? null
            follow({ community: places.current.post.community })
          }}
          onRelatedChange={(handles) => {
            places.current.post.related = handles.map(slugOf)
            follow({ related: places.current.post.related })
          }}
          onThesis={showThesis}
          formatRequest={postFormat}
          draftRequest={postDraft}
          onOpenThesisDraft={(draft) => {
            showThesis()
            setThesisDraft({ draft })
          }}
        />
      </div>
      {thesisOpened && (
        <div ref={thesisBox} hidden={!thesis}>
          <ThesisEditor
            community={thesisCommunity}
            storageKey={thesisStorageKey}
            draftsReady={thesisDrafts}
            suggested={suggested}
            draftRef={thesisWritten}
            onCancel={cancel}
            onFormat={showPost}
            onCommunityChange={(next) => {
              places.current.thesis.community = next?.slug ?? null
              follow({ community: places.current.thesis.community })
            }}
            // To the author's theses, the new one first (specs/thesis-create TC-14).
            draftRequest={thesisDraft}
            onOpenPostDraft={(draft) => {
              if (draft.type === 'THESIS') return
              showPost(draft.type)
              setPostDraft({ draft })
            }}
            onPublished={(username) => router.push(`${communityPath('user', username)}?tab=theses`)}
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
