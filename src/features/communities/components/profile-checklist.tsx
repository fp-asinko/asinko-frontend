import {
  CameraIcon,
  EyeIcon,
  HandshakeIcon,
  ImageIcon,
  LinkIcon,
  MapPinIcon,
  NotebookPenIcon,
  PinIcon,
  TypeIcon,
  XIcon,
  type LucideIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { hideChecklist } from '../actions/hide-checklist.action'
import type { ProfileStep } from '../lib/profile-steps'
import { EditProfilePrompt } from './edit-profile-button'

const ICONS: Record<ProfileStep['id'], LucideIcon> = {
  avatar: CameraIcon,
  headline: TypeIcon,
  bio: NotebookPenIcon,
  location: MapPinIcon,
  links: LinkIcon,
  openTo: HandshakeIcon,
  banner: ImageIcon,
  featured: PinIcon,
}

/** How many suggestions show at once, as LinkedIn's "Suggested for you". */
const SHOWN = 2

/**
 * "Complete your profile", only for you (specs/profile-showcase PS-01 to PS-03), as LinkedIn's
 * "Suggested for you": how many of the eight steps are done, with a bar, and the next two as
 * cards, each with what to do. A field's step opens "Edit profile" there; featuring leads to your
 * posts, where "⋯" does it. "Hide" closes it in this browser (a form: no JavaScript of its own).
 * All done, nothing.
 */
export function ProfileChecklist({
  steps,
  postsPath,
}: {
  steps: ProfileStep[]
  postsPath: string
}) {
  const t = useTranslations('communities.checklist')
  const done = steps.filter((step) => step.done).length
  const next = steps.filter((step) => !step.done).slice(0, SHOWN)
  if (next.length === 0) return null

  return (
    <section aria-labelledby="checklist-title" className="border-b px-4 py-4 sm:px-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="checklist-title" className="type-post-title">
            {t('title')}
          </h2>
          <p className="mt-0.5 flex items-center gap-1 type-meta text-muted-foreground">
            <EyeIcon aria-hidden className="size-3.5" />
            {t('onlyYou')}
          </p>
        </div>
        <form action={hideChecklist}>
          <button
            type="submit"
            aria-label={t('hide')}
            className="-mt-1.5 -mr-1.5 inline-flex size-9 tap items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <XIcon aria-hidden className="size-4.5" />
          </button>
        </form>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div
          role="progressbar"
          aria-label={t('progressLabel')}
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-valuenow={done}
          aria-valuetext={t('progress', { done, total: steps.length })}
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${(done / steps.length) * 100}%` }}
          />
        </div>
        <span aria-hidden className="shrink-0 type-meta text-muted-foreground tabular-nums">
          {t('progress', { done, total: steps.length })}
        </span>
      </div>

      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {next.map((step) => {
          const Icon = ICONS[step.id]
          return (
            <li key={step.id} className="flex flex-col gap-3 rounded-lg border p-3.5">
              <div className="flex gap-3">
                <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-4.5"
                >
                  <Icon />
                </span>
                <div className="min-w-0">
                  <h3 className="type-small font-bold">{t(`steps.${step.id}.title`)}</h3>
                  <p className="mt-0.5 type-meta text-muted-foreground">
                    {t(`steps.${step.id}.body`)}
                  </p>
                </div>
              </div>
              <div className="mt-auto">
                {step.field ? (
                  <EditProfilePrompt field={step.field} variant="pill">
                    {t(`steps.${step.id}.action`)}
                  </EditProfilePrompt>
                ) : (
                  <Link
                    href={postsPath}
                    className="inline-flex h-11 tap items-center rounded-full border border-input px-4 type-action outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 md:h-9"
                  >
                    {t(`steps.${step.id}.action`)}
                  </Link>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
