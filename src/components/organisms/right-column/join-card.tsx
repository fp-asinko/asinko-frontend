import { useTranslations } from 'next-intl'
import { useId } from 'react'
import { GateButtons } from '@/components/organisms/auth-gate'

/** "New to Asinko?" above the season tokens, only without a session (G-03, Q3). */
export function JoinCard() {
  const t = useTranslations('authGate.joinCard')
  const titleId = useId()

  return (
    <section aria-labelledby={titleId} className="m-3.5 rounded-lg border bg-surface px-4 py-3.5">
      <h2 id={titleId} className="type-ui font-bold">
        {t('title')}
      </h2>
      <p className="mt-1 type-meta text-muted-foreground">{t('body')}</p>
      <GateButtons className="mt-3" />
    </section>
  )
}
