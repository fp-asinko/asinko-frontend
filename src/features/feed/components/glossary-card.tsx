import { BookOpenTextIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { GlossaryItem } from '../feed.types'

/**
 * A glossary term in the Home's feeds, where the backend put it (specs/glossary GL-01, GL-02), as
 * the prototype's: its group and the GLOSSARY mark on top, the term large, what it means and an
 * example in a gray box with a rule on its left. The platform's own content: no votes, comments
 * nor page. Named "Glossary: term", so a screen reader hears what it is first (GL-04). A Server
 * Component: no JavaScript (GL-06).
 */
export function GlossaryCard({ term }: { term: GlossaryItem }) {
  const t = useTranslations('glossary')

  return (
    <article
      aria-label={t('region', { term: term.term })}
      // The text where a post's is: 12px inside, 4px clear of the lines between cards (PostCard).
      className="px-4 py-4.5 wrap-anywhere md:my-1 md:px-3 md:py-5.5"
    >
      <div className="mb-2 flex min-h-6 items-center justify-between gap-3">
        <p className="min-w-0 truncate type-meta text-muted-foreground">{term.category}</p>
        {/* The mark of a poll or a thought (feed-cards). */}
        <span className="inline-flex shrink-0 items-center gap-1.25 type-action font-extrabold uppercase">
          <BookOpenTextIcon aria-hidden className="size-3.5" />
          {t('label')}
        </span>
      </div>
      <h2 className="text-2xl leading-tight font-extrabold tracking-tight">{term.term}</h2>
      <p className="mt-2.5 type-post-body">{term.definition}</p>
      {term.example && (
        <div className="mt-3.5 rounded-lg border-l-3 border-border-strong bg-surface px-4 py-3">
          <p className="type-section text-muted-foreground">{t('example')}</p>
          <p className="mt-1 type-post-body italic">{term.example}</p>
        </div>
      )}
    </article>
  )
}
