import { SHARE_COLORS as C } from '@/lib/share-image/colors'
import { LOGO_SRC, logoWidth } from './brand'

/**
 * The brand's share image (specs/share-preview SP-04, SP-06): the wordmark and the tagline, on the
 * light theme. For every page without its own, and for a post that cannot be shown.
 */
export function GenericShareCard({ tagline }: { tagline: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 40,
        padding: '72px 96px',
        background: C.background,
        color: C.foreground,
        fontFamily: 'Figtree',
        borderBottom: `12px solid ${C.foreground}`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse draws <img>, not next/image */}
      <img src={LOGO_SRC} alt="" width={logoWidth(96)} height={96} />
      <div
        style={{
          display: 'flex',
          maxWidth: 900,
          fontSize: 48,
          fontWeight: 700,
          lineHeight: 1.2,
          color: C.mutedForeground,
        }}
      >
        {tagline}
      </div>
    </div>
  )
}
