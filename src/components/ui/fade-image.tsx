'use client'

import Image, { type ImageProps } from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * An image that fades in once loaded (home-motion M-09). A brand atom, not shadcn. Used only for
 * images that arrive after the first paint, like the cards from "Load more" (D-M1): an image hidden while it loads does not count for LCP, so the first page shows its
 * images at once. Same props and contract as next/image.
 */
export function FadeImage({ className, onLoad, alt, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false)
  return (
    <Image
      {...props}
      alt={alt}
      onLoad={(event) => {
        setLoaded(true)
        onLoad?.(event)
      }}
      data-loaded={loaded || undefined}
      className={cn(
        'transition-opacity duration-200 ease-out',
        loaded ? 'opacity-100' : 'opacity-0',
        className,
      )}
    />
  )
}
