import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

/**
 * A thesis's claim, after its ticket (specs/thesis-ticket TK-09): in a card, second, in gray and
 * two lines at most, yet still the card's title and the link to its page for the keyboard and
 * screen readers. On its page it is the h1, whole.
 */
export function ThesisClaim({
  claim,
  titleId,
  heading = 'h2',
  href,
}: {
  claim: string
  /** The card's article is labelled by it. */
  titleId: string
  heading?: 'h1' | 'h2' | 'h3'
  /** Its page, when the card opens it. */
  href?: string
}) {
  const Title = heading
  const page = heading === 'h1'
  return (
    <Title
      id={titleId}
      className={cn(
        'mt-3',
        page ? 'type-post-title' : 'line-clamp-2 type-post-body text-muted-foreground',
      )}
    >
      {href ? (
        // A 24px target on the line (WCAG 2.5.8), as a post's title.
        <Link
          href={href}
          className="-mb-0.5 inline-block rounded-sm pb-0.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {claim}
        </Link>
      ) : (
        claim
      )}
    </Title>
  )
}
