'use client'

import { useEffect } from 'react'
import { REVEAL_EVENT } from './comment-fold'

const HASH = /^#(comment-[\w-]+)$/

/**
 * A shared comment's link (#comment-{id}, specs/comment-threads CT-12): opens the closed threads
 * around it, takes it into view and tints it for a moment. After the tree in the page, so its
 * folds are listening already. The hash is input from a URL: only the comment pattern is used.
 */
export function CommentAnchor() {
  useEffect(() => {
    function reveal() {
      const id = HASH.exec(window.location.hash)?.[1]
      if (!id) return
      window.dispatchEvent(new CustomEvent(REVEAL_EVENT, { detail: id }))
      // The folds open in the next render: wait for it before scrolling.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          const comment = document.getElementById(id)
          if (!comment) return
          comment.scrollIntoView({ block: 'start' })
          comment.focus({ preventScroll: true })
          comment.dataset.flash = ''
          comment.addEventListener('animationend', () => delete comment.dataset.flash, {
            once: true,
          })
        }),
      )
    }
    reveal()
    window.addEventListener('hashchange', reveal)
    return () => window.removeEventListener('hashchange', reveal)
  }, [])
  return null
}
