import 'server-only'
import { useTranslations } from 'next-intl'
import type { ComponentProps, ReactNode } from 'react'
import Markdown, { type Components } from 'react-markdown'
import { Link } from '@/i18n/navigation'
import { communityPath } from '@/lib/communities/paths'
import { previewProps } from '@/lib/communities/preview'
import { cn } from '@/lib/utils'
import { MENTION_SCHEME, parseMention } from '../lib/mentions'

/**
 * Markdown of user content (H-14, D-H1). Rendered on the server only, so react-markdown never
 * reaches the browser. Safe by construction (security.md § 1):
 * - Raw HTML is never rendered (no rehype-raw; skipHtml drops it).
 * - Only a whitelist of elements; anything else is unwrapped to its text.
 * - Links only http(s) or our own asinko: mentions; any other scheme is dropped.
 */
const ALLOWED = ['p', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'code', 'blockquote', 'br']
const HEADINGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']

function urlTransform(url: string): string {
  if (url.startsWith(MENTION_SCHEME)) return url
  try {
    const { protocol } = new URL(url)
    return protocol === 'https:' || protocol === 'http:' ? url : ''
  } catch {
    return ''
  }
}

function domainOf(href: string) {
  try {
    return new URL(href).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

const mentionClass = 'font-extrabold text-foreground'

/**
 * A person or a group is said by its name alone ("jordan", "acciones"): the bold already says it
 * is a mention, and its card says the rest (PO, 2026-10-17). An asset keeps its $, as a ticker is
 * written in finance ($BTC). Only the text of the link: the author wrote it with the symbol.
 */
function withoutSymbol(children: ReactNode): ReactNode {
  return typeof children === 'string' && /^[@#]/.test(children) ? children.slice(1) : children
}

function Anchor({ href, children }: ComponentProps<'a'>) {
  const t = useTranslations('feed.card')
  const mention = parseMention(href)
  if (mention?.type === 'community' || mention?.type === 'asset' || mention?.type === 'user') {
    const kind = mention.type === 'user' ? 'user' : mention.type === 'asset' ? 'asset' : 'group'
    const slug = mention.type === 'user' ? mention.username : mention.slug
    return (
      <Link
        href={communityPath(kind, slug)}
        // Its hover card (specs/mention-preview MP-01).
        {...previewProps(kind, slug)}
        // The underline only on hover, as X and Reddit: in a paragraph the bold is enough.
        className={`${mentionClass} underline-offset-2 hover:underline`}
      >
        {mention.type === 'asset' ? children : withoutSymbol(children)}
      </Link>
    )
  }
  if (mention) return <strong className={mentionClass}>{children}</strong>

  const domain = href ? domainOf(href) : null
  // A dropped scheme (javascript:, data:…) arrives here as an empty href: plain text.
  if (!href || !domain) return <>{children}</>
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow ugc"
      className="underline underline-offset-2"
    >
      {children}
      <span className="text-muted-foreground"> {t('linkDomain', { domain })}</span>
      <span className="sr-only">{t('newTab')}</span>
    </a>
  )
}

/** Headings become bold paragraphs: the card already has its title. */
function Heading({ children }: { children?: ReactNode }) {
  return (
    <p>
      <strong>{children}</strong>
    </p>
  )
}

const components: Components = {
  a: Anchor,
  ...Object.fromEntries(HEADINGS.map((tag) => [tag, Heading])),
  ul: ({ children }) => <ul className="list-disc pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5">{children}</ol>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-border-strong pl-3 text-muted-foreground">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded-sm bg-muted px-1 py-0.5 font-mono">{children}</code>
  ),
}

/** `className` adjusts the room between paragraphs: more on the post's own page. */
export function PostMarkdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Markdown
        allowedElements={[...ALLOWED, ...HEADINGS]}
        unwrapDisallowed
        skipHtml
        urlTransform={urlTransform}
        components={components}
      >
        {children}
      </Markdown>
    </div>
  )
}
