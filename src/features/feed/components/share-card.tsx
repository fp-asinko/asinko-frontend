import { LOGO_VIEWBOX } from '@/components/ui/asinko-logo'
import { SHARE_COLORS as C, SHARE_IDENTITY } from '@/lib/share-image/colors'
import { identityIndex } from '@/lib/identity-color'

/** What a post's share image shows (specs/share-preview SP-01): already translated and cut. */
export type ShareCardData = {
  /** The Asinko wordmark as an image (data: URI). */
  logoSrc: string
  title: string
  /** Where it was posted; null when unresolved. */
  community: { handle: string; colorKey: string; person: boolean } | null
  /** @maria, or null for a system post. */
  author: string | null
  /** "128 votes · 6 comments", formatted in the link's language. */
  stats: string
}

/**
 * A post's image for other apps (specs/share-preview SP-01, SP-03): the logo, the community with
 * its identity color, the title and who wrote it, on the light theme. Drawn by ImageResponse, which
 * reads only inline styles and needs `display: flex` on every box with more than one child. The
 * user's text goes in as text: nothing is parsed (SP-07).
 */
export function ShareCard({ logoSrc, title, community, author, stats }: ShareCardData) {
  const hue = community ? SHARE_IDENTITY[identityIndex(community.colorKey)]! : null
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px 72px',
        background: C.background,
        color: C.foreground,
        fontFamily: 'Figtree',
        borderBottom: `12px solid ${C.foreground}`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse draws <img>, not next/image */}
      <img
        src={logoSrc}
        alt=""
        width={Math.round((44 * LOGO_VIEWBOX.width) / LOGO_VIEWBOX.height)}
        height={44}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {community && hue && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 64,
                height: 64,
                borderRadius: community.person ? 32 : 14,
                backgroundImage: `linear-gradient(135deg, ${hue[0]}, ${hue[1]})`,
                color: C.avatarForeground,
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              {community.handle
                .replace(/^[@#$]/, '')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div style={{ display: 'flex', fontSize: 32, fontWeight: 700 }}>{community.handle}</div>
          </div>
        )}
        <div
          style={{
            display: 'flex',
            fontSize: 60,
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: -1,
          }}
        >
          {title}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          fontSize: 28,
          color: C.mutedForeground,
        }}
      >
        {author && <div style={{ display: 'flex', fontWeight: 700 }}>{author}</div>}
        {author && <div style={{ display: 'flex' }}>·</div>}
        <div style={{ display: 'flex' }}>{stats}</div>
      </div>
    </div>
  )
}
