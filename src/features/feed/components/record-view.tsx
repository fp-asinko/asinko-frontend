'use client'

import { useEffect } from 'react'
import { recordRecent, type RecentItem } from '@/lib/recently-viewed'

/**
 * Notes the post being read in the browser's "Recently viewed" (specs/recently-viewed RV-03):
 * once per opening, with the numbers it has now. Draws nothing.
 */
export function RecordView({ item }: { item: Omit<RecentItem, 'viewedAt'> }) {
  const { id, href, label, title, kind, score, comments } = item
  useEffect(() => {
    recordRecent({ id, href, label, title, kind, score, comments })
  }, [id, href, label, title, kind, score, comments])
  return null
}
