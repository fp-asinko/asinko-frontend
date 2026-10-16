'use client'

import { useEffect } from 'react'
import { useCompose } from '@/components/organisms/compose'

/**
 * Tells the editor which community this page is about, while it is open (PC-06): the pages of a
 * group, an asset and your own profile render it. No markup.
 */
export function ComposeScope({
  id,
  slug,
  handle,
  name,
  own = false,
}: {
  id: string
  slug: string
  handle: string
  name: string
  own?: boolean
}) {
  const { setScope } = useCompose()
  useEffect(() => {
    setScope({ id, slug, handle, name, own })
    return () => setScope(null)
  }, [setScope, id, slug, handle, name, own])
  return null
}
