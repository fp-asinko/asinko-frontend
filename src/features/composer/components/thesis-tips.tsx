import { getTranslations } from 'next-intl/server'

const TIPS = ['claim', 'deadline', 'resolution', 'final', 'conviction', 'reference'] as const

/**
 * How a thesis works (specs/thesis-create TC-31): what the form's fields used to explain under
 * each one, in a list. The right column shows it; without one, the page folds it under its title.
 */
export async function ThesisTipsList() {
  const t = await getTranslations('submitPage.thesisTips')
  return (
    <ul className="flex list-disc flex-col gap-2 pl-4 type-small text-muted-foreground">
      {TIPS.map((tip) => (
        <li key={tip}>{t(tip)}</li>
      ))}
    </ul>
  )
}
