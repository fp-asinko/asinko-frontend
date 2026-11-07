import { LightbulbIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

const TIPS = ['name', 'description', 'rules'] as const

/**
 * "Tips for a good group" under the preview (specs/community-create CG-23): a clear name, who it is
 * for, and short rules. Only text, from the server.
 */
export async function GroupTips() {
  const t = await getTranslations('createGroup.tips')
  return (
    <section aria-labelledby="group-tips-title" className="rounded-xl border px-3.5 py-3">
      <h2 id="group-tips-title" className="flex items-center gap-1.5 type-action">
        <LightbulbIcon aria-hidden className="size-4 text-muted-foreground" />
        {t('title')}
      </h2>
      <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 type-small text-muted-foreground">
        {TIPS.map((tip) => (
          <li key={tip}>{t(tip)}</li>
        ))}
      </ul>
    </section>
  )
}
