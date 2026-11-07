import { CheckIcon, ImageIcon, NotebookPenIcon, PencilLineIcon, ScrollTextIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { EditGroupField } from '../../communities.types'
import { groupChecklistCookie } from '../../lib/checklist-cookie'
import type { GroupStep } from '../../lib/group-steps'
import { HideableChecklist, HideChecklistButton } from '../hideable-checklist'
import { EditGroupPrompt, STEP_PILL } from './edit-group-button'

const ICONS = {
  images: ImageIcon,
  description: NotebookPenIcon,
  rules: ScrollTextIcon,
  post: PencilLineIcon,
} as const

/** Where each step is done in "Edit group"; the first post is done in its own page. */
const FIELDS: Record<Exclude<GroupStep['id'], 'post'>, EditGroupField> = {
  images: 'images',
  description: 'description',
  rules: 'rules',
}

/**
 * "Get your group started", only for its moderators (specs/community-edit CE-07, CE-08): the four
 * steps, each done with ✓, each pending with what does it ("Edit group" on its field, or the page
 * to post in the group). ✕ hides it for this group in this browser, leaving Undo. All done,
 * nothing. Drawn by the server: only its buttons are the client's.
 */
export function GroupChecklist({
  groupId,
  slug,
  steps,
}: {
  groupId: string
  slug: string
  steps: GroupStep[]
}) {
  const t = useTranslations('communities.groupChecklist')
  const done = steps.filter((step) => step.done).length
  if (done === steps.length) return null

  return (
    <HideableChecklist
      hiddenText={t('hidden')}
      undoLabel={t('undo')}
      cookie={groupChecklistCookie(groupId)}
    >
      <section aria-labelledby="group-checklist-title" className="border-b px-4 py-4 sm:px-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="group-checklist-title" className="type-post-title">
              {t('title')}
            </h2>
            <p className="mt-0.5 type-meta text-muted-foreground">
              {t('progress', { done, total: steps.length })}
            </p>
          </div>
          <HideChecklistButton label={t('hide')} />
        </div>
        <ol className="mt-3 flex flex-col gap-2">
          {steps.map((step) => {
            const Icon = ICONS[step.id]
            const label = t(`steps.${step.id}`)
            return (
              <li key={step.id} className="flex min-h-9 items-center gap-2">
                {step.done ? (
                  <span className="inline-flex items-center gap-2 type-small text-muted-foreground">
                    <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <CheckIcon aria-hidden className="size-3" strokeWidth={3} />
                    </span>
                    <span className="line-through">{label}</span>
                    <span className="sr-only">{t('done')}</span>
                  </span>
                ) : step.id === 'post' ? (
                  <Link
                    href={`/submit?community=${encodeURIComponent(slug)}`}
                    className={STEP_PILL}
                  >
                    <Icon aria-hidden />
                    {label}
                  </Link>
                ) : (
                  <EditGroupPrompt field={FIELDS[step.id]}>
                    <Icon aria-hidden />
                    {label}
                  </EditGroupPrompt>
                )}
              </li>
            )
          })}
        </ol>
      </section>
    </HideableChecklist>
  )
}
