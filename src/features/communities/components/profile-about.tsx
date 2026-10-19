import { useTranslations } from 'next-intl'

/** Past this, or past three lines, it is clamped (as a card's body, specs/feed-cards). */
const LONG_ABOUT = 200

/**
 * The person's "About" (specs/profile-showcase PS-04): their own words, plain, with their line
 * breaks. A long one shows three lines and "See more", which opens it without JavaScript (a
 * `<details>`, as a post card's body) and from the keyboard.
 */
export function ProfileAbout({ text }: { text: string }) {
  const t = useTranslations('communities.about')
  const long = text.length > LONG_ABOUT || text.split('\n').length > 3
  const body = (
    // The user's own text: long words wrap at 360px and its line breaks stay (PE-07).
    <p className="type-ui wrap-anywhere whitespace-pre-line text-muted-foreground">{text}</p>
  )

  if (!long) return <div className="mt-2">{body}</div>
  return (
    <div className="group/about mt-2">
      <div className="line-clamp-3 group-has-[details[open]]/about:line-clamp-none">{body}</div>
      <details className="group/more mt-1">
        <summary className="inline-flex min-h-6 w-fit cursor-pointer list-none items-center rounded-sm type-action text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
          <span className="group-open/more:hidden">{t('seeMore')}</span>
          <span className="hidden group-open/more:inline">{t('seeLess')}</span>
        </summary>
      </details>
    </div>
  )
}
