import { GlobeIcon } from 'lucide-react'
import type { LinkSite } from '@/lib/profile-links'
import { Brand, InstagramMark, XMark, type BrandProps } from './brand-marks'

/*
 * Marks for the links of a profile (specs/profile-presentation PP-03): YouTube, GitHub, Substack and
 * TradingView from Simple Icons (CC0); LinkedIn, no longer there at the brand's request, drawn as
 * its plain "in". One color (currentColor), as the rest of the UI. The marks belong to their
 * companies: used only to say where a link goes. Decorative: the link says its host.
 */

/** LinkedIn's "in" in a rounded square, cut out (even-odd). */
export function LinkedInMark(props: BrandProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false" {...props}>
      <path
        fillRule="evenodd"
        d="M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm3.5 3.8a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM6.2 9.8v8.4h2.6V9.8Zm4.3 0v8.4h2.6v-4.3c0-1.2.6-1.9 1.6-1.9s1.4.7 1.4 1.9v4.3h2.6v-4.8c0-2.4-1.2-3.8-3.2-3.8-1.1 0-1.9.5-2.4 1.2v-1Z"
      />
    </svg>
  )
}

export function YouTubeMark(props: BrandProps) {
  return (
    <Brand
      d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
      {...props}
    />
  )
}

export function GitHubMark(props: BrandProps) {
  return (
    <Brand
      d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
      {...props}
    />
  )
}

export function SubstackMark(props: BrandProps) {
  return (
    <Brand
      d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"
      {...props}
    />
  )
}

export function TradingViewMark(props: BrandProps) {
  return (
    <Brand
      d="M15.8654 8.2789c0 1.3541-1.0978 2.4519-2.452 2.4519-1.354 0-2.4519-1.0978-2.4519-2.452 0-1.354 1.0978-2.4518 2.452-2.4518 1.3541 0 2.4519 1.0977 2.4519 2.4519zM9.75 6H0v4.9038h4.8462v7.2692H9.75Zm8.5962 0H24l-5.1058 12.173h-5.6538z"
      {...props}
    />
  )
}

const MARKS = {
  x: XMark,
  linkedin: LinkedInMark,
  youtube: YouTubeMark,
  instagram: InstagramMark,
  github: GitHubMark,
  substack: SubstackMark,
  tradingview: TradingViewMark,
} as const

/** The mark of a link's site; a globe for any other. */
export function LinkMark({ site, ...props }: BrandProps & { site: LinkSite }) {
  if (site === 'web') return <GlobeIcon aria-hidden focusable="false" {...props} />
  const Mark = MARKS[site]
  return <Mark {...props} />
}
