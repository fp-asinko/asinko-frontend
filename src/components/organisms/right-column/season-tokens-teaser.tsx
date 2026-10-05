import { HexagonIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useId } from 'react'

/**
 * Season tokens, as in the prototype but not yet a product (phase 4, legal validation pending):
 * what they are and a "Coming soon" seal, never a balance (RC-02, Q1 of specs/right-column). Not
 * interactive, so it is plain text and not a ComingSoon control.
 */
export function SeasonTokensTeaser() {
  const t = useTranslations('rightColumn.tokens')
  const titleId = useId()

  return (
    <section aria-labelledby={titleId} className="m-3.5 rounded-lg border bg-surface px-4 py-3.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 id={titleId} className="flex items-center gap-1.5 type-section">
          <HexagonIcon aria-hidden className="size-4" />
          {t('title')}
        </h2>
        <span className="rounded-full bg-muted px-2 type-meta font-semibold text-muted-foreground">
          {t('badge')}
        </span>
      </div>
      <p className="type-meta text-muted-foreground">
        {t.rich('body', {
          strong: (chunks) => <strong className="font-bold text-foreground">{chunks}</strong>,
        })}
      </p>
    </section>
  )
}
