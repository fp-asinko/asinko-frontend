'use client'

import { useLocale } from 'next-intl'
import { useRef, useState } from 'react'
import type { Locale } from '@/i18n/routing'
import { useRouter } from '@/i18n/navigation'
import { submitPath } from '@/i18n/submit-path'
import type { CommunityOption } from '../composer.types'
import { clearDraft } from '../hooks/use-post-draft'
import { DiscardDialog } from './discard-dialog'
import type { PreviewAction } from './body-tabs'
import { PostEditor } from './post-editor'

/** A handle's slug: $BTC is BTC and #macro is macro. */
const slugOf = (handle: string) => handle.slice(1)

/**
 * The editor on its page (specs/submit-page SU-03 to SU-05): another community, or other related
 * ones (specs/related-aside), go into the URL (the page and its right column follow them, the form
 * keeps what is written); Cancel with something written asks first and, if confirmed, also drops
 * the draft; publishing goes to the new post.
 */

export function SubmitEditor({
  type,
  community,
  storageKey,
  related = [],
  preview,
}: {
  /** The preview's Server Action (specs/submit-tools ST-01). */
  preview?: PreviewAction
  type: 'TEXT' | 'LINK' | 'IMAGE'
  community: CommunityOption | null
  storageKey: string | null
  /** The related ones of the URL, as handles (specs/related-aside RA-04). */
  related?: string[]
}) {
  const router = useRouter()
  const locale = useLocale() as Locale
  // The URL carries both: changing one keeps the other (RA-04).
  const where = useRef({ community: community?.slug ?? null, related: related.map(slugOf) })
  function follow(next: Partial<typeof where.current>) {
    where.current = { ...where.current, ...next }
    router.replace(submitPath(locale, where.current), { scroll: false })
  }
  const written = useRef<(() => boolean) | null>(null)
  const [discarding, setDiscarding] = useState(false)

  // Back to where the person came from in the site; the Home when the page was opened directly or
  // from another site.
  function leave() {
    const fromSite = document.referrer && new URL(document.referrer).origin === location.origin
    if (fromSite && window.history.length > 1) router.back()
    else router.push('/')
  }

  return (
    <>
      <PostEditor
        type={type}
        community={community}
        storageKey={storageKey}
        draftRef={written}
        onCancel={() => (written.current?.() ? setDiscarding(true) : leave())}
        onPublished={(path) => router.push(path)}
        related={related}
        preview={preview}
        onCommunityChange={(next) => follow({ community: next?.slug ?? null })}
        onRelatedChange={(handles) => follow({ related: handles.map(slugOf) })}
      />
      <DiscardDialog
        open={discarding}
        onOpenChange={setDiscarding}
        onDiscard={() => {
          if (storageKey) clearDraft(storageKey)
          leave()
        }}
      />
    </>
  )
}
