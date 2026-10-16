'use client'

import { XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useId, useRef } from 'react'
import { RELATED_MAX } from '../schemas/create-post.schema'
import { CommunityPicker } from './community-picker'

/**
 * The related communities and assets of a post (specs/related-tags), beside the main community:
 * a gray pill for each, with a × to take it out, and a "+" that opens the same picker while there
 * are fewer than three. It holds handles ($GGAL, #macro): on Publish they go as mentions on a last
 * line of the body (RT-04). Taking one out leaves the focus on the one before, or on "+" (RT-07).
 */
export function RelatedPicker({
  main,
  value,
  onChange,
}: {
  /** The main community's handle: not offered again. */
  main: string
  value: readonly string[]
  onChange: (handles: string[]) => void
}) {
  const t = useTranslations('composer.related')
  const ids = useId()
  const focusNext = useRef<string | null>(null)
  const removeId = (index: number) => `${ids}-remove-${index}`
  const addId = `${ids}-add`

  // After a change the focus goes where the person goes on: set before the list re-renders.
  useEffect(() => {
    if (!focusNext.current) return
    document.getElementById(focusNext.current)?.focus()
    focusNext.current = null
  }, [value])

  function remove(index: number) {
    focusNext.current = index > 0 ? removeId(index - 1) : addId
    onChange(value.filter((_, each) => each !== index))
  }

  return (
    <>
      {value.length > 0 && (
        // eslint-disable-next-line jsx-a11y/no-redundant-roles -- Safari drops the list role with list-style none and display contents
        <ul role="list" aria-label={t('label')} className="contents">
          {value.map((handle, index) => (
            <li
              key={handle}
              // A slug can be 64 characters without a space: it truncates at 360px (its × says it whole).
              className="inline-flex h-8 max-w-full min-w-0 items-center gap-0.5 rounded-full bg-muted pr-1 pl-3 type-meta font-bold"
            >
              <span className="truncate">{handle}</span>
              <button
                id={removeId(index)}
                type="button"
                aria-label={t('remove', { handle })}
                onClick={() => remove(index)}
                // 24px target (WCAG 2.5.8) inside the 32px pill.
                className="inline-flex size-6 tap items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted-hover hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-3.5"
              >
                <XIcon aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      {value.length < RELATED_MAX && (
        <CommunityPicker
          id={addId}
          variant="add"
          value={null}
          exclude={[main, ...value]}
          onChange={(next) => {
            if (!next) return
            // The last one hides "+": the focus goes to its ×.
            if (value.length + 1 === RELATED_MAX) focusNext.current = removeId(value.length)
            onChange([...value, next.handle])
          }}
        />
      )}
    </>
  )
}
