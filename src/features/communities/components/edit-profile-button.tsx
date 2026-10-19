'use client'

import dynamic from 'next/dynamic'
import { PencilIcon, PlusIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { createContext, use, useRef, useState, type ReactNode } from 'react'
import { cva } from 'class-variance-authority'
import { useRouter } from '@/i18n/navigation'
import type { EditableProfile, EditProfileField } from '../communities.types'

/** The window comes on first use: nobody else's profile pays for it (seo.md). */
const loadDialog = () => import('./edit-profile-dialog').then((module) => module.EditProfileDialog)
const EditProfileDialog = dynamic(loadDialog)

/** From md the window; under it the full screen, as the post editor. */
const DESKTOP = '(min-width: 768px)'

/** Opens "Edit profile", on a field when given (specs/profile-presentation PP-04). */
const OpenContext = createContext<((field?: EditProfileField) => void) | null>(null)

/**
 * "Edit profile" of your own profile (specs/profile-edit, specs/profile-presentation): holds the
 * window for its button and for the prompts of what is missing, which open it on their field.
 * Saved, the page refreshes to show the changes (PE-03) and it is announced. The focus goes back
 * to whatever opened it (WCAG 2.4.3).
 */
export function EditProfileProvider({
  profile,
  children,
}: {
  profile: EditableProfile
  children: ReactNode
}) {
  const t = useTranslations('communities.edit')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [layout, setLayout] = useState<'sheet' | 'modal'>('modal')
  const [field, setField] = useState<EditProfileField | null>(null)
  const [saved, setSaved] = useState(false)
  // Each opening starts from what is saved (a new key); 0: never opened, nothing loaded.
  const [opening, setOpening] = useState(0)
  const opener = useRef<HTMLElement | null>(null)

  function openOn(next?: EditProfileField) {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setLayout(window.matchMedia(DESKTOP).matches ? 'modal' : 'sheet')
    setField(next ?? null)
    setSaved(false)
    setOpening((count) => count + 1)
    setOpen(true)
  }

  return (
    <OpenContext value={openOn}>
      {children}
      <p role="status" className="sr-only">
        {saved ? t('saved') : ''}
      </p>
      {opening > 0 && (
        <EditProfileDialog
          key={opening}
          layout={layout}
          open={open}
          onOpenChange={setOpen}
          profile={profile}
          field={field}
          returnFocusTo={opener}
          onSaved={() => {
            setSaved(true)
            router.refresh()
          }}
        />
      )}
    </OpenContext>
  )
}

function useOpenEditProfile() {
  const open = use(OpenContext)
  if (!open) throw new Error('Inside EditProfileProvider only')
  return open
}

// Intent before the click: by the time it lands, the window is usually there.
const preload = { onPointerEnter: () => void loadDialog(), onFocus: () => void loadDialog() }

/** "Edit profile" (specs/profile-edit PE-01), where others see Follow: a gray outlined pill. */
export function EditProfileButton() {
  const t = useTranslations('communities.edit')
  const open = useOpenEditProfile()
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      {...preload}
      onClick={() => open()}
      className="inline-flex h-8 tap items-center gap-1.5 rounded-full border border-border-strong bg-background px-3.5 type-action outline-none hover:bg-surface focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <PencilIcon aria-hidden className="size-3.5" />
      {t('button')}
    </button>
  )
}

const prompt = cva(
  'inline-flex tap items-center outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
  {
    variants: {
      variant: {
        // What is missing, where it would go (PP-04): gray, with a "+".
        add: 'min-h-6 gap-1 rounded-md type-meta text-muted-foreground hover:text-foreground [&_svg]:size-3.5',
        // A step of "Complete your profile" (specs/profile-showcase PS-01): an outlined pill.
        pill: 'h-11 gap-1.5 rounded-full border border-input px-4 type-action hover:bg-muted md:h-9 [&_svg]:size-4',
        // Edit a section in place (PS-10): a pencil.
        edit: 'size-9 justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground [&_svg]:size-4',
      },
    },
  },
)

/**
 * Opens "Edit profile" on a field (specs/profile-presentation PP-04, specs/profile-showcase PS-02,
 * PS-10): what your profile is missing, in gray where it would go; a step of "Complete your
 * profile"; or the pencil of a section, which needs its name in words. Never on someone else's
 * profile.
 */
export function EditProfilePrompt(
  props: { field: EditProfileField } & (
    { variant?: 'add' | 'pill'; children: ReactNode } | { variant: 'edit'; children: string }
  ),
) {
  const { field, children, variant = 'add' } = props
  const open = useOpenEditProfile()
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-label={variant === 'edit' ? (children as string) : undefined}
      {...preload}
      onClick={() => open(field)}
      className={prompt({ variant })}
    >
      {variant === 'edit' ? (
        <PencilIcon aria-hidden />
      ) : (
        <>
          {variant === 'add' && <PlusIcon aria-hidden />}
          {children}
        </>
      )}
    </button>
  )
}
