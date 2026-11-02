'use client'

import type { RefObject } from 'react'
import { Tabs } from '@/components/ui/tabs'
import type { CommunityOption } from '../composer.types'
import { FormatTabs, type CreateFormat } from './format-tabs'

/**
 * The thesis editor of the page to create (specs/thesis-create § 3): the formats on top, with
 * Thesis chosen; any other goes back to the post's editor.
 */
export function ThesisEditor({
  onFormat,
}: {
  community: CommunityOption | null
  /** Where the draft is kept (thesisDraftKey); null keeps nothing. */
  storageKey: string | null
  /** Filled with a check of whether something is written, read when leaving. */
  draftRef: RefObject<(() => boolean) | null>
  onCancel: () => void
  /** A post's format chosen: the page shows the post's editor. */
  onFormat: (format: Exclude<CreateFormat, 'THESIS'>) => void
  /** Another community chosen: the page follows it in its URL. */
  onCommunityChange?: (community: CommunityOption | null) => void
}) {
  return (
    <Tabs
      value="THESIS"
      onValueChange={(next) => {
        if (next === 'TEXT' || next === 'LINK' || next === 'IMAGE' || next === 'THOUGHT') {
          onFormat(next)
        }
      }}
      className="flex flex-1 flex-col gap-0"
    >
      <FormatTabs />
    </Tabs>
  )
}
