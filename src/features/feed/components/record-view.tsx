'use client'

import { useEffect } from 'react'
import { claimRecent, recordRecent, type RecentItem } from '@/lib/recently-viewed'

/**
 * Notes the post being read in the browser's "Recently viewed" (specs/recently-viewed RV-03):
 * once per opening, with the numbers it has now, in the list of who is reading (RV-10). Draws
 * nothing.
 */
export function RecordView({
  item,
  owner,
}: {
  item: Omit<RecentItem, 'viewedAt'>
  /** The viewer's id, or GUEST_OWNER. */
  owner: string
}) {
  const { id, href, label, title, kind, score, comments } = item
  useEffect(() => {
    claimRecent(owner)
    recordRecent({ id, href, label, title, kind, score, comments })
  }, [owner, id, href, label, title, kind, score, comments])
  return null
}
