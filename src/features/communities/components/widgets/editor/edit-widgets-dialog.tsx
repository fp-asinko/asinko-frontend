'use client'

import { ArrowLeftIcon, ChevronDownIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  useEffect,
  useId,
  useReducer,
  useRef,
  useState,
  useTransition,
  type RefObject,
} from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from '@/i18n/navigation'
import { WIDGET_LIMITS, WIDGET_TYPES } from '@/lib/api/contract/widgets'
import { cn } from '@/lib/utils'
import { saveWidgets } from '../../../actions/save-widgets.action'
import type { CommunityWidget } from '../../../communities.types'
import {
  draftsReducer,
  newDraft,
  toDraft,
  toInput,
  type WidgetDraft,
} from '../../../lib/widget-drafts'
import { ButtonsWidgetForm } from './buttons-widget-form'
import { CalendarWidgetForm } from './calendar-widget-form'
import { CommunitiesWidgetForm } from './communities-widget-form'
import { useWidgetError } from './form-parts'
import { ImagesWidgetForm } from './images-widget-form'
import { RulesWidgetForm } from './rules-widget-form'
import { TextWidgetForm } from './text-widget-form'
import { WidgetList } from './widget-list'

/** Phones: the whole screen, as "Edit profile". */
const SHEET =
  'inset-0 flex h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none p-0 pt-[env(safe-area-inset-top)] sm:max-w-none data-open:slide-in-from-bottom-10 data-open:zoom-in-100 data-closed:slide-out-to-bottom-10 data-closed:zoom-out-100'

/** Desktop: a window near the top, as Reddit's "Edit widgets"; its body scrolls. */
const MODAL =
  'top-[8dvh] flex max-h-[84dvh] w-[calc(100%-2rem)] max-w-140 -translate-y-0 flex-col gap-0 rounded-2xl p-0 sm:max-w-140'

const PILL =
  'inline-flex h-11 tap items-center justify-center rounded-full px-4 type-action font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:opacity-50 aria-disabled:active:scale-100 md:h-9'

const ICON =
  'inline-flex size-9 shrink-0 tap items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50'

type View = { kind: 'list' } | { kind: 'edit'; key: string; isNew: boolean }

/**
 * "Edit widgets", as Reddit's (specs/community-widgets CW-08 to CW-12): the list of a group's
 * widgets, each edited in a form inside the same window (with Back), added with "Add widget",
 * moved, deleted after asking. Nothing reaches the group until Save sends the whole list; then the
 * page renders again. Closing with changes asks first. A window in desktop, the full screen in
 * phones. Loaded on first use.
 */
export function EditWidgetsDialog({
  layout,
  open,
  onOpenChange,
  slug,
  communityId,
  widgets,
  onSaved,
  returnFocusTo,
}: {
  layout: 'sheet' | 'modal'
  open: boolean
  onOpenChange: (open: boolean) => void
  slug: string
  communityId: string
  widgets: CommunityWidget[]
  onSaved: () => void
  returnFocusTo?: RefObject<HTMLElement | null>
}) {
  const t = useTranslations('communities.widgets')
  const error = useWidgetError()
  const router = useRouter()
  const ids = useId()
  const formId = `${ids}-form`
  const [drafts, dispatch] = useReducer(draftsReducer, widgets, (saved) => saved.map(toDraft))
  const [view, setView] = useState<View>({ kind: 'list' })
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<'close' | 'delete' | null>(null)
  const [saving, startSaving] = useTransition()
  const modal = layout === 'modal'
  const editing = view.kind === 'edit' ? drafts.find((draft) => draft.key === view.key) : undefined
  const full = drafts.length >= WIDGET_LIMITS.widgets
  const blocked = saving || busy
  const addId = `${ids}-add`
  const titleRef = useRef<HTMLHeadingElement>(null)

  // Where the focus goes once the view changed (WCAG 2.4.3): into a form, its first field; back to
  // the list, the row's "Edit" (or "Add widget", or the title, when the row is gone). Set before the
  // change and read after it is drawn: a ref, not state.
  const focusNext = useRef<'form' | 'list' | { edit: string } | null>(null)
  useEffect(() => {
    const next = focusNext.current
    if (!next) return
    focusNext.current = null
    const target =
      next === 'form'
        ? document.getElementById(formId)?.querySelector<HTMLElement>('input, textarea, button')
        : typeof next === 'object'
          ? document.querySelector<HTMLElement>(`[data-edit-key="${next.edit}"]`)
          : null
    ;(target ?? document.getElementById(addId) ?? titleRef.current)?.focus()
  }, [view, drafts, formId, addId])

  function show(next: View) {
    focusNext.current = next.kind === 'edit' ? 'form' : 'list'
    setView(next)
  }

  function change(action: Parameters<typeof dispatch>[0]) {
    dispatch(action)
    setDirty(true)
  }

  function requestClose() {
    if (dirty) setConfirming('close')
    else onOpenChange(false)
  }

  /** Back from a form: a new widget never finished is dropped. */
  function back() {
    if (view.kind === 'edit' && view.isNew) dispatch({ type: 'remove', key: view.key })
    show({ kind: 'list' })
    if (view.kind === 'edit' && !view.isNew) focusNext.current = { edit: view.key }
  }

  function done(draft: WidgetDraft) {
    change({ type: 'update', draft })
    setErrors(({ [draft.key]: _, ...rest }) => rest)
    show({ kind: 'list' })
    focusNext.current = { edit: draft.key }
  }

  function save() {
    if (blocked) return
    setServerError(null)
    startSaving(async () => {
      const result = await saveWidgets({ slug, items: drafts.map(toInput) })
      if (result.ok) {
        onSaved()
        onOpenChange(false)
        router.refresh()
        return
      }
      // A widget refused, by its position in the list: marked there.
      const marked: Record<string, string> = {}
      for (const [index, messages] of Object.entries(result.fieldErrors ?? {})) {
        const draft = drafts[Number(index)]
        const message = error(messages?.[0])
        if (draft && message) marked[draft.key] = message
      }
      setErrors(marked)
      setServerError(error(result.error) ?? t('errors.general'))
    })
  }

  const typeName = editing ? t(`types.${editing.type}`) : ''

  return (
    <Dialog
      open={open}
      onOpenChange={(next) =>
        next ? onOpenChange(true) : view.kind === 'edit' ? back() : requestClose()
      }
    >
      <DialogContent
        showCloseButton={false}
        finalFocus={returnFocusTo}
        className={modal ? MODAL : SHEET}
      >
        <div className="flex h-14 shrink-0 items-center gap-2 border-b px-2">
          {view.kind === 'edit' ? (
            <button
              type="button"
              onClick={back}
              className={cn(ICON, 'w-auto gap-1.5 px-3 type-action')}
            >
              <ArrowLeftIcon aria-hidden className="size-4" />
              {t('editor.back')}
            </button>
          ) : (
            <button
              type="button"
              aria-label={t('editor.close')}
              onClick={requestClose}
              className={ICON}
            >
              <XIcon aria-hidden className="size-5" />
            </button>
          )}
          <DialogTitle
            ref={titleRef}
            tabIndex={-1}
            className="min-w-0 flex-1 truncate type-post-title outline-none"
          >
            {editing ? typeName : t('editor.title')}
          </DialogTitle>
          {view.kind === 'edit' && (
            <div className="pr-2">
              <button
                type="submit"
                form={formId}
                aria-disabled={busy || undefined}
                className={cn(PILL, 'bg-primary text-primary-foreground hover:bg-primary/85')}
              >
                {t('editor.done')}
              </button>
            </div>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pt-4 pb-6">
          {editing ? (
            <>
              {editing.type === 'TEXT' && (
                <TextWidgetForm draft={editing} formId={formId} onDone={done} />
              )}
              {editing.type === 'RULES' && (
                <RulesWidgetForm draft={editing} formId={formId} onDone={done} />
              )}
              {editing.type === 'BUTTONS' && (
                <ButtonsWidgetForm draft={editing} formId={formId} onDone={done} />
              )}
              {editing.type === 'COMMUNITIES' && (
                <CommunitiesWidgetForm draft={editing} formId={formId} onDone={done} />
              )}
              {editing.type === 'IMAGES' && (
                <ImagesWidgetForm
                  draft={editing}
                  formId={formId}
                  communityId={communityId}
                  onDone={done}
                  onBusy={setBusy}
                />
              )}
              {editing.type === 'CALENDAR' && (
                <CalendarWidgetForm draft={editing} formId={formId} onDone={done} />
              )}
              <button
                type="button"
                onClick={() => setConfirming('delete')}
                className={cn(PILL, 'mt-2 w-fit text-destructive hover:bg-destructive/10')}
              >
                {t('editor.delete')}
              </button>
            </>
          ) : (
            <WidgetList
              drafts={drafts}
              errors={errors}
              onEdit={(key) => show({ kind: 'edit', key, isNew: false })}
              onMove={(key, to) => change({ type: 'move', key, to })}
            />
          )}
          {view.kind === 'list' && serverError && (
            <p role="alert" className="type-small text-destructive">
              {serverError}
            </p>
          )}
        </div>

        {view.kind === 'list' && (
          <div className="flex shrink-0 flex-col gap-3 border-t px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between gap-2">
              <span className="type-meta text-muted-foreground tabular-nums">
                {t('editor.count', { count: drafts.length, max: WIDGET_LIMITS.widgets })}
              </span>
              {!full && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    id={addId}
                    className={cn(PILL, 'gap-1.5 bg-muted text-foreground hover:bg-muted-hover')}
                  >
                    {t('editor.add')}
                    <ChevronDownIcon aria-hidden className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" side="top" className="w-72">
                    {WIDGET_TYPES.map((type) => (
                      <DropdownMenuItem
                        key={type}
                        className="min-h-12 flex-col items-start gap-0.5 py-2"
                        onClick={() => {
                          const draft = newDraft(type)
                          change({ type: 'add', draft })
                          show({ kind: 'edit', key: draft.key, isNew: true })
                        }}
                      >
                        <span className="type-small font-bold">{t(`types.${type}`)}</span>
                        <span className="type-meta text-muted-foreground">
                          {t(`editor.descriptions.${type}`)}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={requestClose}
                className={cn(PILL, 'text-muted-foreground hover:bg-muted hover:text-foreground')}
              >
                {t('editor.cancel')}
              </button>
              <button
                type="button"
                aria-disabled={blocked || undefined}
                onClick={save}
                className={cn(PILL, 'bg-primary text-primary-foreground hover:bg-primary/85')}
              >
                {saving ? t('editor.saving') : t('editor.save')}
              </button>
            </div>
            <span role="status" className="sr-only">
              {saving ? t('editor.saving') : ''}
            </span>
          </div>
        )}

        <AlertDialog
          open={confirming !== null}
          onOpenChange={(next) => !next && setConfirming(null)}
        >
          <AlertDialogContent
            finalFocus={() =>
              confirming === 'delete' ? (document.getElementById(addId) ?? titleRef.current) : true
            }
          >
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirming === 'delete' ? t('editor.deleteTitle') : t('editor.discardTitle')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirming === 'delete' ? t('editor.deleteBody') : t('editor.discardBody')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('editor.keepEditing')}</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  if (confirming === 'delete' && editing) {
                    change({ type: 'remove', key: editing.key })
                    show({ kind: 'list' })
                  } else {
                    onOpenChange(false)
                  }
                  setConfirming(null)
                }}
              >
                {confirming === 'delete' ? t('editor.deleteConfirm') : t('editor.discardConfirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  )
}
