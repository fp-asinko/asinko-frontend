'use client'

import { createPortal } from 'react-dom'
import type { ComposeMode, ComposeSession } from './composer-root'
import { ComposerWindow } from './composer-window'
import { InlineComposer } from './inline-composer'

/**
 * The open editor where it belongs (specs/post-create-detail § 2): inside the page's box, or in a
 * window (the full screen in mobile, a modal in desktop). One deferred module for all of them, so
 * the first load carries a single loader.
 */
export function ComposerView({
  mode,
  windowLayout,
  slot,
  session,
  dialogUsed,
  onShown,
  onClose,
}: {
  mode: ComposeMode
  /** The window's last shape: it keeps it while closing. */
  windowLayout: 'sheet' | 'modal'
  slot: HTMLElement | null
  session: ComposeSession
  /** The window stays mounted once used, so closing it can animate. */
  dialogUsed: boolean
  /** The editor is drawn in the box: it may take the prompt's place. */
  onShown: (key: number) => void
  onClose: () => void
}) {
  return (
    <>
      {mode === 'inline' &&
        slot &&
        createPortal(
          <InlineComposer
            key={session.key}
            session={session}
            onShown={() => onShown(session.key)}
            onClose={onClose}
          />,
          slot,
        )}
      {dialogUsed && (
        <ComposerWindow
          layout={windowLayout}
          open={mode === windowLayout}
          onClose={onClose}
          session={session}
        />
      )}
    </>
  )
}
