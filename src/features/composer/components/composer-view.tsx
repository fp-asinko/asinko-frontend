'use client'

import { createPortal } from 'react-dom'
import { ComposerSheet } from './composer-sheet'
import type { ComposeSession } from './composer-root'
import { InlineComposer } from './inline-composer'

/**
 * The open editor where it belongs (specs/post-create-detail § 2): inside the page's box in
 * desktop, or the full screen in mobile. One deferred module for both, so the first load carries
 * a single loader.
 */
export function ComposerView({
  mode,
  slot,
  session,
  sheetUsed,
  onClose,
}: {
  mode: 'closed' | 'inline' | 'sheet'
  slot: HTMLElement | null
  session: ComposeSession
  /** The full screen stays mounted once used, so closing can animate. */
  sheetUsed: boolean
  onClose: () => void
}) {
  return (
    <>
      {mode === 'inline' &&
        slot &&
        createPortal(
          <InlineComposer key={session.key} session={session} onClose={onClose} />,
          slot,
        )}
      {sheetUsed && <ComposerSheet open={mode === 'sheet'} onClose={onClose} session={session} />}
    </>
  )
}
