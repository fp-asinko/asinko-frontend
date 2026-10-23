'use client'

import { useFormatter, useTranslations } from 'next-intl'
import { createContext, use } from 'react'
import { countFormat } from '../lib/count-format'

/** Comments sent from this card in this visit, and the way to count one more (specs/card-comment). */
export const AddedComments = createContext<{ added: number; add: () => void }>({
  added: 0,
  add: () => {},
})

/**
 * A card's comment count (P-006): compact for the eye, the full sentence for screen readers. It
 * goes up with each comment sent from the card (CC-03), without asking the server again.
 */
export function CommentCount({ base }: { base: number }) {
  const t = useTranslations('feed.card')
  const format = useFormatter()
  const count = base + use(AddedComments).added

  return (
    <>
      <span aria-hidden>{format.number(count, countFormat(count))}</span>
      <span className="sr-only">{t('comments', { count })}</span>
    </>
  )
}
