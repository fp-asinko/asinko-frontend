'use client'

import { useEffect, useState } from 'react'
import { findSimilarGroups } from '../actions/find-similar-groups.action'
import type { SimilarGroup } from '../lib/similar-groups'
import { NAME_MIN } from '../schemas/create-group.schema'

/** After the last key, as the handle's check. */
export const SIMILAR_DELAY_MS = 400

/**
 * The existing groups that look like the name being typed (specs/community-create CG-22), asked
 * once per pause. An answer for a name no longer in the field is dropped.
 */
export function useSimilarGroups(name: string): SimilarGroup[] {
  const query = name.trim()
  const [found, setFound] = useState<{ query: string; groups: SimilarGroup[] }>({
    query: '',
    groups: [],
  })

  useEffect(() => {
    if (query.length < NAME_MIN) return
    let gone = false
    const timer = setTimeout(() => {
      void findSimilarGroups(query).then((groups) => {
        if (!gone) setFound({ query, groups })
      })
    }, SIMILAR_DELAY_MS)
    return () => {
      gone = true
      clearTimeout(timer)
    }
  }, [query])

  return found.query === query ? found.groups : []
}
