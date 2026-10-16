'use client'

import { useLocale } from 'next-intl'
import { useRef, useState } from 'react'
import type { Locale } from '@/i18n/routing'
import { useRouter } from '@/i18n/navigation'
import { submitPath } from '@/i18n/submit-path'
import type { CommunityOption } from '../composer.types'
import { clearDraft } from '../hooks/use-post-draft'
import { DiscardDialog } from './discard-dialog'
import { PostEditor } from './post-editor'

/**
 * The editor on its page (specs/submit-page SU-03 to SU-05): another community goes into the URL
 * (the page and its right column follow it, the form keeps what is written); Cancel with something
 * written asks first and, if confirmed, also drops the draft; publishing goes to the new post.
 */
export function SubmitEditor({
  type,
  community,
  storageKey,
}: {
  type: 'TEXT' | 'LINK' | 'IMAGE'
  community: CommunityOption | null
  storageKey: string | null
}) {
  const router = useRouter()
  const locale = useLocale() as Locale
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
        onCommunityChange={(next) =>
          router.replace(submitPath(locale, { community: next?.slug }), { scroll: false })
        }
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
