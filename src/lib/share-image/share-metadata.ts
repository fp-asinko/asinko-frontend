import type { Metadata } from 'next'
import { SHARE_CONTENT_TYPE, SHARE_SIZE } from './share-size'

/**
 * The share image of a page that sets its own openGraph (specs/share-preview SP-01, SP-04): Next
 * replaces the layout's openGraph whole, so an image from a parent segment would be lost. `path`
 * is the image route: /en/opengraph-image/brand, /en/post/{id}/opengraph-image/card.
 */
export function shareImage(
  path: string,
  alt: string,
): { openGraph: Pick<NonNullable<Metadata['openGraph']>, 'images'>; twitter: Metadata['twitter'] } {
  const image = { url: path, alt, type: SHARE_CONTENT_TYPE, ...SHARE_SIZE }
  return {
    openGraph: { images: [image] },
    twitter: { card: 'summary_large_image', images: [image] },
  }
}

/** The brand's image of a language (SP-04). */
export const brandImagePath = (locale: string) => `/${locale}/opengraph-image/brand`

/** A post's own image, without the locale (SP-01): what the share window shows (specs/share-menu). */
export const postImageRoute = (id: string) => `/post/${id}/opengraph-image/card`

/** A post's own image in a language (SP-01). */
export const postImagePath = (locale: string, id: string) => `/${locale}${postImageRoute(id)}`
