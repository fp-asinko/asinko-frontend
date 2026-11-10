'use client'

import { SwordsIcon, ThumbsDownIcon, ThumbsUpIcon } from 'lucide-react'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { useId, useOptimistic, useState, useTransition } from 'react'
import { AgreeBar } from '@/components/molecules/agree-bar'
import { useAuthGate } from '@/components/organisms/auth-gate'
import { buttonVariants } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { submitPath } from '@/i18n/submit-path'
import { thesisPrice } from '@/lib/theses/price'
import { cn } from '@/lib/utils'
import { answerThesis } from '../actions/answer-thesis.action'
import type { ThesisAgreement } from '../feed.types'

type Answer = 'yes' | 'no'

/** The bet a No answers, as the invitation says it (AG-10): whose, which way, how much and when. */
export type AgreeBet = {
  /** How the author is mentioned: @maria. */
  handle: string
  direction: 'above' | 'below' | 'equals'
  price: number
  deadline: string
}

/**
 * Each answer's look (PO, 2026-11-05: big, as the prototype's Bull and Bear). Written whole: Tailwind
 * only builds what it finds. The words go in the text color; the green and the red, in the icon,
 * the edge and the fill, where 3:1 is enough (green text only on white, design-system.md).
 */
const ANSWERS = {
  yes: {
    Icon: ThumbsUpIcon,
    icon: 'text-bullish',
    chosen: 'border-bullish ring-bullish hover:border-bullish',
    fill: 'bg-bullish/15',
  },
  no: {
    Icon: ThumbsDownIcon,
    icon: 'text-bearish',
    chosen: 'border-bearish ring-bearish hover:border-bearish',
    fill: 'bg-bearish/15',
  },
} as const

/** The counts after `next` replaces the viewer's answer: what shows before the server answers. */
function counted(agreement: ThesisAgreement, next: Answer | null): ThesisAgreement {
  const { yes, no, viewerVote } = agreement
  return {
    ...agreement,
    yes: yes - (viewerVote === 'yes' ? 1 : 0) + (next === 'yes' ? 1 : 0),
    no: no - (viewerVote === 'no' ? 1 : 0) + (next === 'no' ? 1 : 0),
    viewerVote: next,
  }
}

/**
 * "Do you agree?" on an open thesis (specs/thesis-agree AG-01 to AG-14), a client leaf: Yes and
 * No, then the bar. The shares show only once answered (Q3), always to its author and to a guest.
 * Pressing the same answer takes it back, the other changes it (Q4). A No invites to bet the other
 * way (Q2): create a thesis on the same asset, answering this one. It shows while the No stands,
 * also on a later visit (AG-10).
 *
 * Closed, or to its author, the result alone (AG-02, AG-07). The card leaves out a closed one
 * without votes.
 */
export function ThesisAgree({
  thesisId,
  assetSymbol,
  bet,
  agreement,
  className,
}: {
  thesisId: string
  /** The asset the counter-thesis opens on (AG-11); null for a qualitative one (AG-13). */
  assetSymbol: string | null
  /** What the invitation names (AG-10); null without a target or an author. */
  bet: AgreeBet | null
  agreement: ThesisAgreement
  className?: string
}) {
  const t = useTranslations('feed.thesis.agree')
  const format = useFormatter()
  const locale = useLocale() as Locale
  const questionId = useId()
  const { signedIn, requireAccount, openGate } = useAuthGate()
  const [confirmed, setConfirmed] = useState(agreement)
  const [shown, setShown] = useOptimistic(confirmed)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState(false)

  const { canVote } = confirmed
  const revealed = !canVote || !signedIn || shown.viewerVote !== null
  const count = shown.yes + shown.no
  const share = (value: Answer) => (revealed && count > 0 ? shown[value] / count : 0)

  function answer(value: Answer) {
    // aria-disabled, not disabled, while saving: the focused button keeps the focus (WCAG 2.4.3).
    if (pending || !requireAccount('vote-poll')) return
    const next = shown.viewerVote === value ? null : value
    setError(false)
    startTransition(async () => {
      setShown(counted(shown, next))
      const result = await answerThesis({ thesisId, value: next })
      if (result.ok) setConfirmed(result.data)
      else if (result.error === 'api.errors.UNAUTHENTICATED') openGate('vote-poll')
      else setError(true)
    })
  }

  return (
    // Its own clicks: a tap between its buttons does not open the thesis (CardLink).
    <div data-card-own-click className={cn('flex flex-col gap-2.5', className)}>
      <div role="group" aria-labelledby={questionId} className="flex flex-col gap-2">
        <span id={questionId} className="text-center type-action text-muted-foreground">
          {t('question')}
        </span>
        {canVote && (
          <span className="grid grid-cols-2 gap-2">
            {(['no', 'yes'] as const).map((value) => {
              const mine = shown.viewerVote === value
              const { Icon, ...look } = ANSWERS[value]
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={mine}
                  aria-disabled={pending || undefined}
                  onClick={() => answer(value)}
                  className={cn(
                    'relative flex h-11 tap items-center justify-center gap-2 overflow-hidden rounded-lg border bg-background type-ui font-bold text-foreground outline-none hover:border-border-strong focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:active:scale-100',
                    // Chosen: its color's edge, 2px, and its icon filled: not the color alone.
                    mine && cn('ring-1 ring-inset', look.chosen),
                  )}
                >
                  {/* Its share fills it from the left once the result shows (AG-04), as a poll's
                      bars: 600 ms (design-system.md § Movimiento). */}
                  <span
                    aria-hidden
                    className={cn(
                      'absolute inset-0 origin-left transition-transform duration-600 ease-bars',
                      look.fill,
                    )}
                    style={{ transform: `scaleX(${share(value)})` }}
                  />
                  <span className="relative inline-flex items-center gap-2">
                    <Icon aria-hidden className={cn('size-4', look.icon, mine && 'fill-current')} />
                    {t(value)}
                    {/* Read in the words below, once. */}
                    {revealed && count > 0 && (
                      <span aria-hidden className="type-meta font-semibold tabular-nums">
                        {format.number(share(value), {
                          style: 'percent',
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          </span>
        )}
      </div>

      {/* Announced when answering (AG-14), the invitation too (AG-10); before it, nothing to read
          (Q3). */}
      <div aria-live="polite" className="flex flex-col gap-2.5">
        {/* With buttons, they carry the bar: the words alone, centered. */}
        {revealed && (
          <AgreeBar
            yes={shown.yes}
            no={shown.no}
            display={canVote ? 'words' : 'bar'}
            className={canVote ? 'text-center' : undefined}
          />
        )}

        {canVote && shown.viewerVote === 'no' && (
          // White with a hairline: the card turns `bg-surface` on hover, and a gray box would melt.
          // The question and its button side by side, centered: one thought (PO, 2026-11-09).
          <div className="flex animate-fade-up flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-lg border bg-background p-2 pl-3">
            <span className="flex min-w-0 items-center gap-2.5">
              {/* Taking the other side: the clash, in the No's red (an icon: 3:1 is enough). */}
              <span
                aria-hidden
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-bearish/15 text-bearish"
              >
                <SwordsIcon className="size-4" />
              </span>
              <span className="flex min-w-0 flex-col">
                {/* Its bet, named: disagreeing with someone, not with a card (PO, 2026-11-09). */}
                <span className="type-small font-semibold">
                  {bet && assetSymbol
                    ? t('invite.bet', {
                        author: bet.handle,
                        symbol: `$${assetSymbol}`,
                        direction: bet.direction,
                        price: thesisPrice(format, bet.price),
                        date: format.dateTime(new Date(bet.deadline), { dateStyle: 'medium' }),
                      })
                    : t('invite.title')}
                </span>
                <span className="type-meta text-muted-foreground">{t('invite.hint')}</span>
              </span>
            </span>
            <Link
              href={submitPath(locale, {
                community: assetSymbol,
                type: 'thesis',
                counter: assetSymbol ? thesisId : undefined,
              })}
              // 32px, as Yes and No (AG-14).
              className={cn(buttonVariants(), 'shrink-0 tap rounded-full px-3')}
            >
              {t('invite.action')}
            </Link>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="type-meta text-destructive">
          {t('error')}
        </p>
      )}
    </div>
  )
}
