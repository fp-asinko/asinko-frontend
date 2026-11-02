'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import dynamic from 'next/dynamic'
import { useFormatter, useNow, useTranslations } from 'next-intl'
import { useEffect, useId, useRef, useState, type RefObject } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { ChoiceGroup } from '@/components/molecules/choice-group'
import { Delta } from '@/components/molecules/delta'
import { LevelBars } from '@/components/molecules/level-bars'
import { EmojiButton } from '@/components/molecules/emoji-picker'
import { applyFormat, FormatToolbar, formatShortcut } from '@/components/molecules/format-toolbar'
import { MentionField } from '@/components/molecules/mention-assist'
import { useAuthGate } from '@/components/organisms/auth-gate'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Tabs } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { assetSymbolOf } from '@/lib/communities/paths'
import { searchMentions } from '@/lib/mentions/search-mentions.action'
import { cn } from '@/lib/utils'
import { createThesis } from '../actions/create-thesis.action'
import type { CommunityOption, SavedDraft } from '../composer.types'
import { useSavedDraft } from '../hooks/use-saved-draft'
import { DRAFT_LIMIT } from './drafts-dialog'
import { DraftsButton } from './drafts-button'
import {
  discardDraft,
  hasThesisText,
  useKeepThesisDraft,
  useStoredThesisDraft,
} from '../hooks/use-thesis-draft'
import { useAssetQuote } from '../hooks/use-asset-quote'
import { clearDraft } from '../hooks/use-local-draft'
import { dayAt, deadlineAt, quickDeadlines, thesisDeadlineRange } from '../lib/thesis-deadline'
import {
  CLAIM_MAX,
  CONVICTIONS,
  THESIS_DIRECTIONS,
  thesisFormSchema,
  type ThesisForm,
  type ThesisFormValues,
} from '../schemas/create-thesis.schema'
import { BodyTabs } from './body-tabs'
import { CommunityPicker } from './community-picker'
import { ACTIONS_BAR, BARE, FIELD_BOX, PILL } from './editor-styles'
import { FormatTabs, type CreateFormat } from './format-tabs'
import type { ThesisSummary } from './thesis-confirm'

// The confirmation, at the first Publish (specs/thesis-create TC-19).
const ThesisConfirm = dynamic(() => import('./thesis-confirm').then((mod) => mod.ThesisConfirm), {
  ssr: false,
})

const FIELDS = [
  'communityId',
  'assetSymbol',
  'claim',
  'direction',
  'targetPrice',
  'deadline',
  'conviction',
  'reasoning',
] as const
type FieldName = (typeof FIELDS)[number]

const DRAFT_ERRORS = ['limit', 'gone', 'invalid', 'general'] as const

/** A draft's error key (composer.drafts.errors.*), or the general one. */
function draftError(key: string) {
  const name = key.replace(/^composer\.drafts\.errors\./, '')
  return DRAFT_ERRORS.find((each) => each === name) ?? 'general'
}

/** The messages a field can show, from the schema or the action (composer.*). */
const ERROR_KEYS = [
  'errors.community',
  'errors.invalidCommunity',
  'errors.ownProfileOnly',
  'thesis.errors.asset',
  'thesis.errors.claimRequired',
  'thesis.errors.claimTooLong',
  'thesis.errors.direction',
  'thesis.errors.targetPrice',
  'thesis.errors.deadline',
  'thesis.errors.conviction',
  'thesis.errors.reasoningRequired',
] as const

/** A price as typed, or null: a comma works as the decimal point. */
function typedPrice(value: string): number | null {
  const number = Number(value.trim().replace(',', '.'))
  return value.trim() && Number.isFinite(number) && number > 0 ? number : null
}

/**
 * The thesis editor (specs/thesis-create § 3): where it goes, the asset, the claim, the target,
 * the deadline, the conviction and the reasoning, in one column. Publish waits until nothing is
 * missing; pressed early, every field says what it needs and follows the typing (TC-09). Then the
 * confirmation, with the disclaimer, sends it. What is written is kept in the browser (TC-10).
 */
export function ThesisEditor({
  community,
  storageKey,
  draftRef,
  onCancel,
  onFormat,
  onCommunityChange,
  onPublished,
  onOpenPostDraft,
  draftRequest = null,
}: {
  community: CommunityOption | null
  /** Where the draft is kept (thesisDraftKey); null keeps nothing. */
  storageKey: string | null
  /** Filled with a check of whether something is written, read when leaving. */
  draftRef: RefObject<(() => boolean) | null>
  onCancel: () => void
  /** A post's format chosen: the page shows the post's editor. */
  onFormat: (format: Exclude<CreateFormat, 'THESIS'>) => void
  /** Another community chosen: the page follows it in its URL. */
  onCommunityChange?: (community: CommunityOption | null) => void
  /** Published: the author's username, for their theses (TC-14). */
  onPublished: (username: string) => void
  /** A post's draft chosen in this editor's list: the page opens it in the post's editor. */
  onOpenPostDraft?: (draft: SavedDraft) => void
  /** A thesis's draft chosen in the post editor's list: this editor opens it (each ask is new). */
  draftRequest?: { draft: SavedDraft } | null
}) {
  const t = useTranslations('composer')
  const format = useFormatter()
  const now = useNow()
  const ids = useId()
  const { openGate } = useAuthGate()
  const stored = useStoredThesisDraft(storageKey)
  const [answered, setAnswered] = useState(false)
  const offered = stored && !answered ? stored : null
  const [chosen, setChosen] = useState<CommunityOption | null>(community)
  // An asset community of the URL is the thesis's asset too (TC-02).
  const [asset, setAsset] = useState<CommunityOption | null>(
    community?.handle.startsWith('$') ? community : null,
  )
  // Chosen by hand, the community no longer follows the asset (TC-03).
  const communityTouched = useRef(false)
  const [range] = useState(() => thesisDeadlineRange(new Date()))
  // The shortcuts' days, fixed for the visit, and whether the calendar is open (TC-33).
  const [quick] = useState(() => quickDeadlines(new Date()))
  const [customDate, setCustomDate] = useState(false)
  const [confirming, setConfirming] = useState<ThesisFormValues | null>(null)
  // The account's draft open in the form (specs/thesis-drafts TD-01, TD-03).
  const saved = useSavedDraft()
  const [pending, setPending] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)

  const form = useForm<ThesisForm, unknown, ThesisFormValues>({
    resolver: zodResolver(thesisFormSchema),
    defaultValues: {
      communityId: community?.id ?? '',
      assetSymbol: asset ? assetSymbolOf(asset) : '',
      claim: '',
      targetPrice: '',
      deadline: '',
      reasoning: '',
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })
  const { register, control, handleSubmit, setValue, setError, getValues, formState } = form
  const [claim = '', direction, targetPrice = '', deadline = '', conviction, reasoning = ''] =
    useWatch({
      control,
      name: ['claim', 'direction', 'targetPrice', 'deadline', 'conviction', 'reasoning'],
    })
  const price = typeof targetPrice === 'string' ? targetPrice : String(targetPrice ?? '')

  useEffect(() => {
    draftRef.current = () => {
      const values = getValues()
      return hasThesisText({
        claim: values.claim ?? '',
        targetPrice: String(values.targetPrice ?? ''),
        reasoning: values.reasoning ?? '',
      })
    }
    return () => {
      draftRef.current = null
    }
  }, [draftRef, getValues])

  useKeepThesisDraft(
    storageKey,
    offered
      ? null
      : {
          community: chosen,
          asset,
          claim,
          direction: direction ?? '',
          targetPrice: price,
          deadline,
          conviction: conviction ?? '',
          reasoning,
        },
  )
  const quote = useAssetQuote(asset ? assetSymbolOf(asset) : null)

  // The derived direction goes into the form, so it validates and is sent (TC-24).
  const derivedNow = (() => {
    const known = quote?.price ?? null
    const typed = typedPrice(price)
    if (known === null || typed === null) return known === null ? 'unknown' : undefined
    return typed > known ? 'ABOVE' : typed < known ? 'BELOW' : undefined
  })()
  useEffect(() => {
    if (derivedNow === 'unknown') return
    setValue('direction', derivedNow as ThesisForm['direction'], {
      shouldValidate: formState.isSubmitted,
    })
  }, [derivedNow, setValue, formState.isSubmitted])

  // On arrival the focus goes where the person starts: the asset, or the claim when it is there.
  useEffect(() => {
    document.getElementById(asset ? `${ids}-claim` : `${ids}-asset`)?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on arrival
  }, [])

  function chooseCommunity(next: CommunityOption | null) {
    setChosen(next)
    setValue('communityId', next?.id ?? '', { shouldValidate: formState.isSubmitted })
    onCommunityChange?.(next)
  }

  function chooseAsset(next: CommunityOption | null) {
    setAsset(next)
    setValue('assetSymbol', next ? assetSymbolOf(next) : '', {
      shouldValidate: formState.isSubmitted,
    })
    if (next && !communityTouched.current) chooseCommunity(next)
  }

  function recover() {
    if (!offered) return
    setCustomDate(false)
    form.reset({
      communityId: offered.community?.id ?? '',
      assetSymbol: offered.asset ? assetSymbolOf(offered.asset) : '',
      claim: offered.claim,
      direction: offered.direction || undefined,
      targetPrice: offered.targetPrice,
      deadline: offered.deadline,
      conviction: offered.conviction || undefined,
      reasoning: offered.reasoning,
    })
    setChosen(offered.community)
    setAsset(offered.asset)
    communityTouched.current = Boolean(
      offered.community && offered.community.id !== offered.asset?.id,
    )
    onCommunityChange?.(offered.community)
    setAnswered(true)
    document.getElementById(`${ids}-claim`)?.focus()
  }

  function discardStored() {
    if (storageKey) clearDraft(storageKey)
    setAnswered(true)
    document.getElementById(`${ids}-claim`)?.focus()
  }

  /** An asset of a saved draft, as the picker holds one: its symbol is all the draft keeps. */
  const assetOption = (symbol: string): CommunityOption => ({
    id: `asset:${symbol}`,
    slug: symbol,
    handle: '$' + symbol,
    name: '$' + symbol,
    own: false,
  })

  // What a draft of the account keeps: "Saved" holds while the form still says it (TD-01).
  const snapshot = JSON.stringify([
    chosen?.id,
    asset?.slug,
    claim,
    direction,
    price,
    deadline,
    conviction,
    reasoning,
  ])
  const savedNow = saved.savedAs === snapshot
  const unsaveable = !(claim.trim() || reasoning.trim() || price.trim() || asset) || saved.saving

  function saveDraft() {
    const target = typedPrice(price)
    saved.save(
      {
        type: 'THESIS',
        communityId: chosen?.id ?? '',
        title: claim,
        body: reasoning,
        thesis: {
          assetSymbol: asset ? assetSymbolOf(asset) : null,
          targetPrice: target,
          direction: direction ?? null,
          deadline: deadline ? deadlineAt(deadline) : null,
          conviction: conviction ?? null,
        },
      },
      snapshot,
    )
  }

  /** A thesis's draft of the account takes the form's place (TD-03). */
  function openSaved(draft: SavedDraft) {
    const kept = draft.thesis
    const day = kept?.deadline ? dayAt(kept.deadline) : null
    setCustomDate(false)
    form.reset({
      communityId: draft.community?.id ?? '',
      assetSymbol: kept?.assetSymbol ?? '',
      claim: draft.title,
      direction: kept?.direction ?? undefined,
      targetPrice: kept?.targetPrice != null ? String(kept.targetPrice) : '',
      deadline: day ?? '',
      conviction: kept?.conviction ?? undefined,
      reasoning: draft.body,
    })
    setChosen(draft.community)
    setAsset(kept?.assetSymbol ? assetOption(kept.assetSymbol) : null)
    communityTouched.current = Boolean(draft.community)
    setCustomDate(Boolean(day && !quick.some((each) => each.day === day)))
    saved.open(draft.id)
    onCommunityChange?.(draft.community)
    setAnswered(true)
    document.getElementById(`${ids}-claim`)?.focus()
  }

  // A thesis's draft opened from the post editor's list (TD-03).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the other editor's ask, as an event: the form takes the draft once
    if (draftRequest) openSaved(draftRequest.draft)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when a new one is asked
  }, [draftRequest])

  /** The field's control: the picker's chip, a group's first option, or the input. */
  function focusField(name: FieldName) {
    const element =
      document.getElementById(`${ids}-${name === 'assetSymbol' ? 'asset' : name}`) ??
      document.getElementById(`${ids}-${name}-quick`)
    const control =
      name === 'direction' || name === 'conviction' || element?.id.endsWith('-quick')
        ? element?.querySelector<HTMLElement>('[role="radio"]')
        : element
    control?.focus()
  }

  const fieldError = (name: FieldName) => {
    const message = formState.errors[name]?.message
    if (!message) return undefined
    const key = ERROR_KEYS.find((each) => `composer.${each}` === message) ?? 'thesis.errors.general'
    return [{ message: t(key, { max: CLAIM_MAX }) }]
  }
  const invalid = (name: FieldName) => Boolean(formState.errors[name])

  // Publish waits until nothing is missing (TC-09), and while sending.
  const complete = Boolean(
    chosen &&
    asset &&
    claim.trim() &&
    direction &&
    price.trim() &&
    deadline &&
    conviction &&
    reasoning.trim(),
  )

  async function publish() {
    if (!confirming) return
    const at = deadlineAt(confirming.deadline)
    setPending(true)
    setConfirmError(null)
    const result = at
      ? await createThesis(
          { ...confirming, deadline: at, disclaimerAccepted: true },
          saved.draftId ?? undefined,
        )
      : null
    setPending(false)
    if (result?.ok) {
      // Published: gone, and no save still pending brings it back as a draft.
      if (storageKey) discardDraft(storageKey)
      onPublished(result.data.username)
      return
    }
    if (result?.error === 'api.errors.UNAUTHENTICATED') {
      setConfirming(null)
      openGate('post')
      return
    }
    if (result?.fieldErrors?.disclaimerAccepted) {
      setConfirmError(t('thesis.errors.disclaimer'))
      return
    }
    const field = result ? FIELDS.find((name) => result.fieldErrors?.[name]?.[0]) : 'deadline'
    if (field) {
      // A field's error goes to the field, the confirmation closes and the focus goes there.
      setConfirming(null)
      setError(field, {
        message: result?.fieldErrors?.[field]?.[0] ?? 'composer.thesis.errors.deadline',
      })
      requestAnimationFrame(() => focusField(field))
      return
    }
    // Anything else: said in the confirmation, whose Publish is the retry.
    setConfirmError(
      result?.error === 'api.errors.RATE_LIMITED'
        ? t('thesis.errors.rateLimited')
        : t('thesis.errors.general'),
    )
  }

  // "Other date" once chosen, even on a shortcut's day; else the shortcut that holds the day, or
  // "Other date" for another one, as a draft's (TC-33).
  const shortcut = customDate
    ? 'custom'
    : (quick.find((each) => each.day === deadline)?.key ?? (deadline ? 'custom' : undefined))
  // The calendar beside the "Other date" pill, in the same row.
  const otherDate = shortcut === 'custom'
  const closesAt = deadline ? deadlineAt(deadline) : null
  const closes = closesAt ? new Date(closesAt) : null
  const reference = quote?.price ?? null
  const target = typedPrice(price)
  const change = reference !== null && target !== null ? (target - reference) / reference : null
  // With the current price, the target says the direction (TC-24); without it, the pills do.
  const derived = change === null ? undefined : change > 0 ? 'ABOVE' : change < 0 ? 'BELOW' : null
  const choosing = Boolean(asset) && quote === null

  const summary: ThesisSummary | null =
    confirming && asset ? { ...confirming, asset: asset.handle } : null

  const reasoningField = register('reasoning')
  const reasoningRef = useRef<HTMLTextAreaElement | null>(null)

  return (
    <form
      noValidate
      onSubmit={(event) => {
        // aria-disabled, not disabled: pressed with something missing, every field says what it
        // needs (WCAG 3.3.1); from then on the errors follow the typing.
        if (pending) return event.preventDefault()
        void handleSubmit((values) => {
          setConfirmError(null)
          setConfirming(values)
        })(event)
      }}
      className="flex flex-col"
    >
      <p role="status" className="sr-only">
        {offered &&
          t('draft.notice', { when: format.relativeTime(new Date(offered.savedAt), now) })}
      </p>
      {offered && (
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-surface px-4 py-3 type-small">
          <span aria-hidden className="flex-1">
            {t('draft.notice', { when: format.relativeTime(new Date(offered.savedAt), now) })}
          </span>
          <span className="flex gap-1">
            <button
              type="button"
              onClick={recover}
              className={cn(PILL, 'bg-muted hover:bg-muted-hover')}
            >
              {t('draft.recover')}
            </button>
            <button
              type="button"
              onClick={discardStored}
              className={cn(PILL, 'text-muted-foreground hover:bg-muted hover:text-foreground')}
            >
              {t('draft.discard')}
            </button>
          </span>
        </div>
      )}
      <Tabs
        value="THESIS"
        onValueChange={(next) => {
          if (next === 'TEXT' || next === 'LINK' || next === 'IMAGE' || next === 'THOUGHT') {
            onFormat(next)
          }
        }}
        className="flex flex-1 flex-col gap-0"
      >
        {/* 16px between rows: the form fits 1280×800 with the target in its own row (TC-36). */}
        <div className="flex stagger flex-col gap-4">
          <FormatTabs
            trailing={
              // The account's drafts, posts and theses together (specs/thesis-drafts TD-02).
              <DraftsButton
                written={() => draftRef.current?.() ?? false}
                onOpen={(draft) =>
                  draft.type === 'THESIS' ? openSaved(draft) : onOpenPostDraft?.(draft)
                }
                onDeleted={saved.forget}
                openedFocus={() => document.getElementById(`${ids}-claim`)}
              />
            }
          />

          {/* The asset and the claim, each the full width, one under the other (TC-30). */}
          <div className="flex flex-col gap-4">
            {/* The asset is its card (TC-29): the whole box chooses it. */}
            <Field data-invalid={invalid('assetSymbol') || undefined} className="gap-1">
              <FieldLabel htmlFor={`${ids}-asset`}>{t('thesis.asset.label')}</FieldLabel>
              <CommunityPicker
                id={`${ids}-asset`}
                only="assets"
                variant="card"
                value={asset}
                onChange={chooseAsset}
                invalid={invalid('assetSymbol')}
                describedBy={`${ids}-assetSymbol-error`}
                renderValue={(chosenAsset) => (
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block type-action font-bold">{chosenAsset.handle}</span>
                      <span className="block truncate type-meta text-muted-foreground">
                        {quote?.name ?? chosenAsset.name}
                      </span>
                    </span>
                    {reference !== null && (
                      <span className="shrink-0 text-right">
                        <span className="block type-action font-bold tabular-nums">
                          {format.number(reference, {
                            maximumFractionDigits: reference < 1 ? 6 : 2,
                          })}
                        </span>
                        <span className="block type-meta">
                          {quote?.stale ? (
                            <span className="text-muted-foreground">{t('thesis.asset.stale')}</span>
                          ) : (
                            quote?.changePct != null && <Delta value={quote.changePct} />
                          )}
                        </span>
                      </span>
                    )}
                  </span>
                )}
              />
              <FieldError
                id={`${ids}-assetSymbol-error`}
                errors={fieldError('assetSymbol')}
                className="type-meta"
              />
            </Field>

            <Field data-invalid={invalid('claim') || undefined} className="gap-1">
              <div className="flex items-baseline justify-between gap-2">
                <FieldLabel htmlFor={`${ids}-claim`}>{t('thesis.claim.label')}</FieldLabel>
                {/* The room left, beside its label: no line of its own (TC-31). */}
                <span
                  id={`${ids}-claim-count`}
                  className={cn(
                    'type-meta tabular-nums',
                    claim.length > CLAIM_MAX
                      ? 'font-bold text-destructive'
                      : 'text-muted-foreground',
                  )}
                >
                  {t('fields.counter', { count: claim.length, max: CLAIM_MAX })}
                </span>
              </div>
              <Input
                id={`${ids}-claim`}
                // An example with the asset and a target half again its price (TC-26).
                placeholder={
                  asset && reference !== null
                    ? t('thesis.claim.example', {
                        symbol: assetSymbolOf(asset),
                        target: format.number(reference * 1.5, {
                          maximumFractionDigits: reference * 1.5 < 1 ? 6 : 0,
                        }),
                      })
                    : t('thesis.claim.placeholder')
                }
                {...register('claim')}
                aria-invalid={invalid('claim') || undefined}
                aria-required
                aria-describedby={`${ids}-claim-count ${ids}-claim-error`}
                className={cn(FIELD_BOX, 'h-12 font-semibold')}
              />
              <FieldError
                id={`${ids}-claim-error`}
                errors={fieldError('claim')}
                className="type-meta"
              />
            </Field>
          </div>

          <Field data-invalid={invalid('deadline') || undefined} className="gap-1">
            {/* The day it closes beside the label: the shortcuts' row never grows (TC-33). */}
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span id={`${ids}-deadline-label`} className="type-small font-medium">
                {t('thesis.deadline.label')}
              </span>
              <p id={`${ids}-deadline-closes`} className="type-meta text-muted-foreground">
                {closes &&
                  t('thesis.deadline.closes', {
                    date: format.dateTime(closes, { dateStyle: 'medium' }),
                  })}
              </p>
            </div>
            {/* Shortcuts in one row, as most deadlines are "in 3 months"; "Other date" opens the
                calendar beside them, in the same row while it fits (TC-33). */}
            <div className="flex flex-wrap items-center gap-1.5">
              <ChoiceGroup
                id={`${ids}-deadline-quick`}
                size="sm"
                labelledBy={`${ids}-deadline-label`}
                describedBy={`${ids}-deadline-closes ${ids}-deadline-error`}
                options={[
                  ...quick.map(({ key }) => ({
                    value: key,
                    label: t(`thesis.deadline.quick.${key}`),
                  })),
                  { value: 'custom' as const, label: t('thesis.deadline.quick.custom') },
                ]}
                value={shortcut}
                onChange={(next) => {
                  if (next === 'custom') {
                    setCustomDate(true)
                    requestAnimationFrame(() => document.getElementById(`${ids}-deadline`)?.focus())
                    return
                  }
                  setCustomDate(false)
                  const day = quick.find((each) => each.key === next)?.day
                  if (day) setValue('deadline', day, { shouldValidate: formState.isSubmitted })
                }}
                invalid={invalid('deadline')}
                required
              />
              {otherDate && (
                <>
                  <FieldLabel htmlFor={`${ids}-deadline`} className="sr-only">
                    {t('thesis.deadline.label')}
                  </FieldLabel>
                  <Input
                    id={`${ids}-deadline`}
                    type="date"
                    min={range.min}
                    max={range.max}
                    {...register('deadline')}
                    aria-invalid={invalid('deadline') || undefined}
                    aria-required
                    aria-describedby={`${ids}-deadline-error`}
                    className={cn(FIELD_BOX, 'h-8 w-36 shrink-0 rounded-full px-3')}
                  />
                </>
              )}
            </div>
            <FieldError
              id={`${ids}-deadline-error`}
              errors={fieldError('deadline')}
              className="type-meta"
            />
          </Field>

          {/* The target in its own row, below the deadline (TC-30). */}
          <Field
            data-invalid={invalid('direction') || invalid('targetPrice') || undefined}
            className="gap-1"
          >
            <FieldLabel htmlFor={`${ids}-targetPrice`}>{t('thesis.target.price')}</FieldLabel>
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
              <Input
                id={`${ids}-targetPrice`}
                inputMode="decimal"
                autoComplete="off"
                // Without an asset there is nothing to aim at yet (TC-34).
                disabled={!asset}
                placeholder={
                  !asset
                    ? t('thesis.target.needsAsset')
                    : reference !== null
                      ? format.number(reference * 1.5, {
                          maximumFractionDigits: reference * 1.5 < 1 ? 6 : 0,
                        })
                      : undefined
                }
                {...register('targetPrice')}
                aria-invalid={invalid('targetPrice') || invalid('direction') || undefined}
                aria-required
                aria-describedby={`${ids}-direction-said ${ids}-targetPrice-error ${ids}-direction-error`}
                className={cn(FIELD_BOX, 'h-11 tabular-nums disabled:opacity-60 sm:w-56')}
              />
              {/* Which way it bets, from the target (TC-24). */}
              <p
                id={`${ids}-direction-said`}
                // Hidden while empty: it would add its gap below the price.
                className="px-1 type-meta text-muted-foreground empty:hidden"
              >
                {derived &&
                  change !== null &&
                  t('thesis.target.direction', {
                    direction: derived,
                    change: format.number(change, {
                      style: 'percent',
                      maximumFractionDigits: 1,
                      signDisplay: 'exceptZero',
                    }),
                  })}
              </p>
            </div>
            {/* Without the current price, the direction is chosen. */}
            {choosing && (
              <>
                <span id={`${ids}-target-label`} className="sr-only">
                  {t('thesis.target.label')}
                </span>
                <Controller
                  control={control}
                  name="direction"
                  render={({ field }) => (
                    <ChoiceGroup
                      id={`${ids}-direction`}
                      labelledBy={`${ids}-target-label`}
                      describedBy={`${ids}-direction-error`}
                      options={THESIS_DIRECTIONS.map((value) => ({
                        value,
                        label: t(`thesis.target.${value === 'ABOVE' ? 'above' : 'below'}`),
                      }))}
                      value={field.value}
                      onChange={field.onChange}
                      invalid={invalid('direction')}
                      required
                    />
                  )}
                />
              </>
            )}
            <FieldError
              id={`${ids}-targetPrice-error`}
              errors={fieldError('targetPrice')}
              className="type-meta"
            />
            {/* A missing direction is said where it can be fixed: a target equal to the price,
                or the pills. Without an asset, the asset's error says what to do. */}
            <FieldError
              id={`${ids}-direction-error`}
              errors={
                derived === null
                  ? [{ message: t('thesis.errors.samePrice') }]
                  : choosing
                    ? fieldError('direction')
                    : undefined
              }
              className="type-meta"
            />
          </Field>

          {/* The conviction in its own row, with what it weighs (TC-25, TC-30). */}
          <Field data-invalid={invalid('conviction') || undefined} className="gap-1">
            <span id={`${ids}-conviction-label`} className="type-small font-medium">
              {t('thesis.conviction.label')}
            </span>
            {/* Four rising bars, as the prototype's (TC-25), and what it weighs beside them from sm. */}
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:gap-4">
              <Controller
                control={control}
                name="conviction"
                render={({ field }) => (
                  <LevelBars
                    id={`${ids}-conviction`}
                    labelledBy={`${ids}-conviction-label`}
                    describedBy={`${ids}-conviction-help ${ids}-conviction-error`}
                    levels={CONVICTIONS.map((value) => ({
                      value,
                      label: t(`thesis.conviction.${value}`),
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    prompt={t('thesis.conviction.prompt')}
                    invalid={invalid('conviction')}
                    required
                  />
                )}
              />
              <p
                id={`${ids}-conviction-help`}
                className="px-1 type-meta text-muted-foreground sm:pb-0.5"
              >
                {t('thesis.conviction.help')}
              </p>
            </div>
            <FieldError
              id={`${ids}-conviction-error`}
              errors={fieldError('conviction')}
              className="type-meta"
            />
          </Field>

          <Field data-invalid={invalid('reasoning') || undefined} className="gap-1">
            <FieldLabel htmlFor={`${ids}-reasoning`}>{t('thesis.reasoning.label')}</FieldLabel>
            {/* The box of a post's body, with its format toolbar and emojis (TC-08). */}
            <BodyTabs
              draft={() => null}
              toolbar={
                <div className="flex items-center gap-0.5">
                  <FormatToolbar fieldRef={reasoningRef} />
                  <EmojiButton fieldRef={reasoningRef} />
                </div>
              }
            >
              <div className="relative">
                <Textarea
                  id={`${ids}-reasoning`}
                  placeholder={t('thesis.reasoning.placeholder')}
                  {...reasoningField}
                  ref={(element) => {
                    reasoningField.ref(element)
                    reasoningRef.current = element
                  }}
                  onKeyDown={(event) => {
                    const kind = formatShortcut(event)
                    if (!kind) return
                    event.preventDefault()
                    applyFormat(event.currentTarget, kind)
                  }}
                  aria-invalid={invalid('reasoning') || undefined}
                  aria-required
                  aria-describedby={`${ids}-reasoning-error`}
                  // Two lines to start, growing with the text (TC-32).
                  className={cn(
                    BARE,
                    'field-sizing-content max-h-96 min-h-12 resize-none text-base leading-[1.55] md:text-base',
                  )}
                />
                <MentionField fieldRef={reasoningRef} search={searchMentions} />
              </div>
            </BodyTabs>
            <FieldError
              id={`${ids}-reasoning-error`}
              errors={fieldError('reasoning')}
              className="type-meta"
            />
          </Field>
        </div>

        {/* Cancel and Publish, on the right, as the post's: sticky over the bottom bar in phones. */}
        {saved.error && (
          <p role="alert" className="mt-3 type-small text-destructive">
            {t(`drafts.errors.${draftError(saved.error)}`, { max: DRAFT_LIMIT })}
          </p>
        )}

        <div data-sticky-actions className={cn(ACTIONS_BAR, 'justify-between gap-3')}>
          {/* Where it goes, on the actions' row (TC-28): the asset's community, unless changed. */}
          <Field data-invalid={invalid('communityId') || undefined} className="w-auto gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <FieldLabel
                htmlFor={`${ids}-communityId`}
                className="type-small text-muted-foreground"
              >
                {t('thesis.publishIn')}
              </FieldLabel>
              <CommunityPicker
                id={`${ids}-communityId`}
                value={chosen}
                onChange={(next) => {
                  communityTouched.current = true
                  chooseCommunity(next)
                }}
                invalid={invalid('communityId')}
                describedBy={`${ids}-communityId-error`}
              />
            </div>
            <FieldError
              id={`${ids}-communityId-error`}
              errors={fieldError('communityId')}
              className="type-meta"
            />
          </Field>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className={cn(PILL, 'text-muted-foreground hover:bg-muted hover:text-foreground')}
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              aria-disabled={unsaveable || undefined}
              onClick={() => {
                if (!unsaveable) saveDraft()
              }}
              className={cn(PILL, 'bg-muted text-foreground hover:bg-muted-hover')}
            >
              {saved.saving
                ? t('drafts.saving')
                : savedNow
                  ? t('drafts.savedShort')
                  : t('drafts.save')}
            </button>
            <button
              type="submit"
              aria-disabled={!complete || pending || undefined}
              className={cn(PILL, 'bg-primary text-primary-foreground hover:bg-primary/85')}
            >
              {t('submit')}
            </button>
          </div>
        </div>
      </Tabs>

      {confirming && (
        <ThesisConfirm
          summary={summary}
          pending={pending}
          error={confirmError}
          onBack={() => setConfirming(null)}
          onConfirm={() => void publish()}
        />
      )}
    </form>
  )
}
