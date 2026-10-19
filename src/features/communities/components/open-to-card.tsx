import { useTranslations } from 'next-intl'
import type { OpenTo } from '../open-to.constants'
import { EditProfilePrompt } from './edit-profile-button'

/**
 * What the person is open to, as LinkedIn's "Open to" card (specs/profile-showcase PS-10): a
 * bordered box with a gray pill per option, translated. On your own profile, a pencil opens "Edit
 * profile" there. Nothing chosen, no card.
 */
export function OpenToCard({ values, isSelf }: { values: readonly OpenTo[]; isSelf: boolean }) {
  const t = useTranslations('communities.openTo')
  if (values.length === 0) return null

  return (
    <section aria-labelledby="open-to-title" className="mt-3 rounded-lg border px-3.5 py-3">
      <div className="flex items-center justify-between gap-2">
        <h2 id="open-to-title" className="type-action">
          {t('title')}
        </h2>
        {isSelf && (
          // The 36px pencil in the 20px row: it reaches out without growing the card.
          <div className="-my-2 -mr-2">
            <EditProfilePrompt field="openTo" variant="edit">
              {t('edit')}
            </EditProfilePrompt>
          </div>
        )}
      </div>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {values.map((value) => (
          <li
            key={value}
            className="inline-flex h-7 items-center rounded-full bg-muted px-3 type-meta font-semibold"
          >
            {t(`options.${value}`)}
          </li>
        ))}
      </ul>
    </section>
  )
}
