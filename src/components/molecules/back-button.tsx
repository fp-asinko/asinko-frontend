'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { ArrowLeftIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

const button = cva(
  'inline-flex tap items-center justify-center outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
  {
    variants: {
      variant: {
        // A dark scrim over any banner, in both themes (as the prototype and the dialogs' overlay).
        overlay:
          'h-7 gap-1 rounded-full border border-white/20 bg-black/45 px-3 type-meta font-semibold text-white hover:bg-black/60',
        // On the page itself, as Reddit's post: a gray circle with the arrow only (44px target).
        plain: 'size-10 shrink-0 rounded-full bg-muted text-foreground hover:bg-muted-hover',
      },
    },
    defaultVariants: { variant: 'overlay' },
  },
)

/**
 * "Back": to the previous page when the visit came from the site, to the Home when the page was
 * opened directly (a shared link). Over a banner (community pages) or on the page (a post's,
 * specs/post-detail-refresh PD-01).
 */
export function BackButton({
  variant,
  className,
}: VariantProps<typeof button> & { className?: string }) {
  const t = useTranslations('common')
  const router = useRouter()
  const plain = variant === 'plain'

  function back() {
    const fromSite = document.referrer && new URL(document.referrer).origin === location.origin
    if (fromSite && history.length > 1) router.back()
    else router.push('/')
  }

  return (
    <button
      type="button"
      onClick={back}
      aria-label={plain ? t('back') : undefined}
      className={cn(button({ variant }), className)}
    >
      <ArrowLeftIcon aria-hidden className={plain ? 'size-5' : 'size-3.5'} />
      {!plain && t('back')}
    </button>
  )
}
