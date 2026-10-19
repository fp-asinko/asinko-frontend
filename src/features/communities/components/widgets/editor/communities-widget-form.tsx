'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useId, useRef, useState, useTransition } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { WIDGET_LIMITS as L } from '@/lib/api/contract/widgets'
import { cn } from '@/lib/utils'
import { findWidgetCommunities } from '../../../actions/find-widget-communities.action'
import type { DraftCommunity, WidgetDraft } from '../../../lib/widget-drafts'
import { communitiesWidgetSchema } from '../../../schemas/widget.schema'
import { CountedField, FIELD } from '../../edit-profile-fields'
import { ListError, useWidgetError } from './form-parts'

type Draft = Extract<WidgetDraft, { type: 'COMMUNITIES' }>

/** The form keeps each chosen community whole (for its row); the widget's schema checks the ids. */
const formSchema = z
  .object({
    title: communitiesWidgetSchema.shape.title,
    communities: z.array(
      z.object({
        id: z.uuid(),
        slug: z.string(),
        handle: z.string(),
        avatarUrl: z.string().nullable(),
      }),
    ),
  })
  .superRefine(({ communities }, context) => {
    const ids = communitiesWidgetSchema.shape.communityIds.safeParse(communities.map((c) => c.id))
    if (!ids.success) {
      context.addIssue({
        code: 'custom',
        path: ['communities'],
        message: ids.error.issues[0]?.message ?? 'communities.widgets.errors.atLeastOne',
      })
    }
  })

/** A pause before searching while the moderator types. */
const SEARCH_DELAY = 250

/**
 * A "Communities" widget's form (CW-06, CW-10): its title and up to 10 groups or assets, searched
 * by name and added with "+", each taken out with its ×.
 */
export function CommunitiesWidgetForm({
  draft,
  formId,
  onDone,
}: {
  draft: Draft
  formId: string
  onDone: (draft: Draft) => void
}) {
  const t = useTranslations('communities.widgets.editor.fields')
  const error = useWidgetError()
  const ids = useId()
  const form = useForm<z.input<typeof formSchema>, unknown, z.output<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: draft.title, communities: draft.communities },
  })
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'communities',
    keyName: 'key',
  })
  const [title = ''] = useWatch({ control: form.control, name: ['title'] })
  const { errors } = form.formState
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<DraftCommunity[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [searching, startTransition] = useTransition()
  const searchId = `${ids}-search`
  const removeId = (id: string) => `${ids}-remove-${id}`
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const chosen = new Set(fields.map((field) => field.id))

  useEffect(() => () => clearTimeout(timer.current), [])

  function onSearch(next: string) {
    setSearch(next)
    clearTimeout(timer.current)
    if (!next.trim()) {
      setResults(null)
      setFailed(false)
      return
    }
    timer.current = setTimeout(() => {
      startTransition(async () => {
        const result = await findWidgetCommunities(next)
        setFailed(!result.ok)
        setResults(result.ok ? result.data : null)
      })
    }, SEARCH_DELAY)
  }

  /** The focus goes on after the list changes (WCAG 2.4.3): drawn first, then focused. */
  function focusLater(id: string) {
    requestAnimationFrame(() => document.getElementById(id)?.focus())
  }

  function add(community: DraftCommunity) {
    append(community)
    // The search, to add another; at the limit it goes, and the new one's × takes it.
    focusLater(fields.length + 1 >= L.communities ? removeId(community.id) : searchId)
  }

  function take(index: number) {
    remove(index)
    const next = fields[index + 1] ?? fields[index - 1]
    focusLater(next ? removeId(next.id) : searchId)
  }

  const full = fields.length >= L.communities

  return (
    <form
      id={formId}
      noValidate
      onSubmit={form.handleSubmit((values) =>
        onDone({ ...draft, title: values.title, communities: values.communities }),
      )}
      className="flex flex-col gap-4"
    >
      <CountedField
        id={`${ids}-title`}
        label={t('title')}
        max={L.title}
        value={title}
        field={form.register('title')}
        error={error(errors.title?.message)}
      />
      {fields.length > 0 && (
        <section aria-labelledby={`${ids}-chosen`} className="flex flex-col gap-1.5">
          <h3 id={`${ids}-chosen`} className="type-action">
            {t('chosen')}
          </h3>
          <ul className="flex flex-wrap gap-1.5">
            {fields.map((community, index) => (
              <li
                key={community.key}
                className="inline-flex h-8 max-w-full min-w-0 items-center gap-1 rounded-full bg-muted pr-1 pl-3 type-meta font-bold"
              >
                <span className="min-w-0 truncate">{community.handle}</span>
                <button
                  type="button"
                  aria-label={t('removeCommunity', { handle: community.handle })}
                  id={removeId(community.id)}
                  onClick={() => take(index)}
                  className="inline-flex size-6 tap items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted-hover hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <XIcon aria-hidden className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {!full && (
        <Field className="gap-1.5">
          <FieldLabel htmlFor={`${ids}-search`} className="type-action">
            {t('search')}
          </FieldLabel>
          <Input
            id={searchId}
            type="search"
            value={search}
            onChange={(event) => onSearch(event.currentTarget.value)}
            aria-describedby={`${ids}-results`}
            className={cn('h-10 text-base', FIELD)}
          />
          <div id={`${ids}-results`} role="status" className="type-meta text-muted-foreground">
            {searching
              ? t('searching')
              : failed
                ? t('searchError')
                : results?.length === 0
                  ? t('noResults')
                  : ''}
          </div>
          {results && results.length > 0 && (
            <ul className="flex flex-col gap-1">
              {results.map((community) => {
                const already = chosen.has(community.id)
                return (
                  <li key={community.id} className="flex items-center gap-2">
                    <UserAvatar
                      name={community.handle}
                      colorKey={community.slug}
                      imageUrl={community.avatarUrl}
                      size="sm"
                      className="rounded-md"
                    />
                    <span className="min-w-0 flex-1 truncate type-small font-bold">
                      {community.handle}
                    </span>
                    {!already && (
                      <button
                        type="button"
                        aria-label={t('addCommunity', { handle: community.handle })}
                        onClick={() => add(community)}
                        className="inline-flex size-9 tap items-center justify-center rounded-full bg-muted outline-none hover:bg-muted-hover focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <PlusIcon aria-hidden className="size-4" />
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Field>
      )}
      <ListError
        message={error(errors.communities?.message ?? errors.communities?.root?.message)}
      />
    </form>
  )
}
