// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { brandImagePath, postImagePath, shareImage } from './share-metadata'

describe('shareImage (specs/share-preview SP-01, SP-04, SP-05)', () => {
  it('names the image for Open Graph and the large card on X, with its size and alt', () => {
    const image = shareImage(postImagePath('es', 'p1'), 'The Fed cuts')
    const expected = {
      url: '/es/post/p1/opengraph-image/card',
      alt: 'The Fed cuts',
      type: 'image/png',
      width: 1200,
      height: 630,
    }
    expect(image.openGraph.images).toEqual([expected])
    expect(image.twitter).toEqual({ card: 'summary_large_image', images: [expected] })
  })

  it("points to the brand's image of a language", () => {
    expect(brandImagePath('pt')).toBe('/pt/opengraph-image/brand')
  })
})
