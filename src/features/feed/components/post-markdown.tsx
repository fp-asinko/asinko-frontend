import 'server-only'
import type { ComponentProps, ReactNode } from 'react'
import Markdown, { type Components } from 'react-markdown'
import { Link } from '@/i18n/navigation'
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

function Anchor({ href, children }: ComponentProps<'a'>) {
  const mention = parseMention(href)
  if (mention?.type === 'community') {
    return (
      <Link
        href={{ pathname: '/', query: { comunidad: mention.slug } }}
        className={`${mentionClass} underline underline-offset-2 hover:decoration-2`}
      >
        {children}
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
      <span className="text-muted-foreground"> ({domain})</span>
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
    <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-[0.9em]">{children}</code>
  ),
}

export function PostMarkdown({ children }: { children: string }) {
  return (
    <div className="flex flex-col gap-2">
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
