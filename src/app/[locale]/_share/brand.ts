import { LOGO_VIEWBOX } from '@/components/ui/asinko-logo'
import { asinkoLogoSvg } from '@/components/ui/asinko-logo-svg'
import { SHARE_COLORS } from '@/lib/share-image/colors'

/** The Asinko wordmark as an image for ImageResponse (specs/share-preview SP-01). */
export const LOGO_SRC = `data:image/svg+xml;base64,${Buffer.from(
  asinkoLogoSvg({ ink: SHARE_COLORS.foreground, dot: SHARE_COLORS.brandDot }),
).toString('base64')}`

/** The wordmark's width at a given height. */
export const logoWidth = (height: number) =>
  Math.round((height * LOGO_VIEWBOX.width) / LOGO_VIEWBOX.height)
