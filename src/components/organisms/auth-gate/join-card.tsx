import { useTranslations } from 'next-intl'
import { useId } from 'react'
import { ComingSoon } from '@/components/molecules/coming-soon'
import { EmailSignUpButton } from './gate-buttons'
import { SocialLogins } from './social-logins'

// The minimal background (GS-04): mentions scattered in gray pills. Symbols, not copy: never
// translated. Positions as inline styles (Tailwind only generates classes it finds written).
const MENTIONS = [
  { text: '$ETH', left: 8, top: 8, rotate: -5 },
  { text: '#defi', left: 56, top: 4, rotate: 4 },
  { text: '@maria', left: 30, top: 30, rotate: 2 },
  { text: '$BTC', left: 70, top: 34, rotate: -4 },
  { text: '#macro', left: 4, top: 56, rotate: 3 },
  { text: '$SOL', left: 44, top: 60, rotate: -3 },
  { text: '@jeppe', left: 66, top: 78, rotate: 5 },
  { text: '#latam', left: 18, top: 82, rotate: -6 },
] as const

/**
 * The invitation to have an account, on top of the left column without a session
 * (specs/guest-sidebar), as Reddit does: Google, Reddit (coming soon) and email, as the account
 * modal (specs/auth AU-10, AU-12). The legal links are coming soon until there is a legal text. The
 * mentions at the bottom are decorative.
 */
export function JoinCard() {
  const t = useTranslations('authGate')
  const titleId = useId()

  return (
    <section
      aria-labelledby={titleId}
      // shrink-0: in the phone panel (a fixed-height flex column) it would be squeezed and cut.
      className="shrink-0 overflow-hidden rounded-xl bg-surface px-3 pt-5"
    >
      <h2 id={titleId} className="text-center text-[1.25rem] leading-tight font-bold">
        {t('joinCard.title')}
      </h2>
      <p className="mt-1.5 text-center type-meta text-muted-foreground">{t('joinCard.body')}</p>

      <div className="mt-4 flex flex-col gap-2">
        <SocialLogins />
        <EmailSignUpButton />
      </div>

      <p className="mt-3 text-center text-[0.6875rem] leading-4 text-muted-foreground">
        {t.rich('joinCard.legal', {
          terms: (chunks) => (
            <ComingSoon label={t('joinCard.terms')} className="underline underline-offset-2">
              {chunks}
            </ComingSoon>
          ),
          privacy: (chunks) => (
            <ComingSoon label={t('joinCard.privacy')} className="underline underline-offset-2">
              {chunks}
            </ComingSoon>
          ),
        })}
      </p>

      <div
        aria-hidden
        className="relative -mx-3 mt-2 h-30 overflow-hidden mask-t-from-40% mask-t-to-100%"
      >
        {MENTIONS.map(({ text, left, top, rotate }) => (
          <span
            key={text}
            className="absolute rounded-full bg-background px-2 py-0.5 type-meta whitespace-nowrap text-muted-foreground"
            style={{ left: `${left}%`, top: `${top}%`, rotate: `${rotate}deg` }}
          >
            {text}
          </span>
        ))}
      </div>
    </section>
  )
}
