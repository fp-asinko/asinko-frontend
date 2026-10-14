'use client'

import { CheckIcon, LinkIcon, MailIcon } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { XMark } from '@/components/ui/brand-marks'
import { TelegramMark, WhatsAppMark } from '@/components/ui/share-marks'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { SHARE_TARGETS, shareTargetUrl, type ShareTarget } from './share-targets'

const ICONS: Record<ShareTarget, ReactNode> = {
  x: <XMark />,
  whatsapp: <WhatsAppMark />,
  telegram: <TelegramMark />,
  email: <MailIcon aria-hidden />,
}

/** Each option: a gray circle with its mark, its name under it (44px target). */
const OPTION =
  'group flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-xl py-1 type-meta font-semibold text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
const CIRCLE =
  'flex size-12 tap items-center justify-center rounded-full bg-muted transition-colors duration-150 group-hover:bg-muted-hover [&_svg]:size-5'

/** Two lines held for every name: "No se pudo copiar" wraps at 360px, and the window must not move. */
const LABEL = 'min-h-9 text-center'

type State = 'idle' | 'copied' | 'failed'

/**
 * The share window of a post (specs/share-menu SM-01 to SM-05): the image other apps will show,
 * and where to send it: copy the link (said on the button, and announced), X, WhatsApp, Telegram
 * and email, each on its own share page in a new tab. The focus starts on "Copy link" and goes back
 * to Share on closing.
 */
export function ShareDialog({
  open,
  onOpenChange,
  url,
  title,
  preview,
  returnFocusTo,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The post's full link. */
  url: string
  title: string
  /** The post's share image (specs/share-preview). */
  preview: string
  returnFocusTo: RefObject<HTMLButtonElement | null>
}) {
  const t = useTranslations('share')
  const [state, setState] = useState<State>('idle')
  const copy = useRef<HTMLButtonElement>(null)
  const [broken, setBroken] = useState(false)

  useEffect(() => {
    if (state === 'idle') return
    const timer = setTimeout(() => setState('idle'), 2000)
    return () => clearTimeout(timer)
  }, [state])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setState('copied')
    } catch {
      setState('failed')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        closeLabel={t('close')}
        initialFocus={copy}
        finalFocus={returnFocusTo}
        className="gap-5 sm:max-w-md"
      >
        {/* Loose classes, not type-post-title: cn does not merge them with the base text-* (design-system.md). */}
        <DialogTitle className="text-[1.0625rem] leading-[1.3] font-bold">{t('title')}</DialogTitle>
        {!broken && (
          <Image
            src={preview}
            alt={title}
            width={1200}
            height={630}
            // The image route answers already sized: nothing to optimize.
            unoptimized
            // A failed image leaves no broken box: the options are what matters.
            onError={() => setBroken(true)}
            className="h-auto w-full rounded-xl border bg-surface"
          />
        )}
        <div className="flex justify-between gap-1">
          <button ref={copy} type="button" onClick={copyLink} className={OPTION}>
            <span aria-hidden className={CIRCLE}>
              {state === 'copied' ? <CheckIcon /> : <LinkIcon />}
            </span>
            <span className={LABEL}>{state === 'idle' ? t('copy') : t(state)}</span>
          </button>
          {SHARE_TARGETS.map((target) => (
            <a
              key={target}
              href={shareTargetUrl(target, url, title)}
              {...(target === 'email' ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
              className={OPTION}
            >
              <span aria-hidden className={CIRCLE}>
                {ICONS[target]}
              </span>
              <span className={LABEL}>{t(`targets.${target}`)}</span>
              {/* Apart from the name, not glued to it (design-system.md, links with parts). */}
              {target !== 'email' && (
                <>
                  {' '}
                  <span className="sr-only">{t('newTab')}</span>
                </>
              )}
            </a>
          ))}
        </div>
        <span role="status" className="sr-only">
          {state === 'idle' ? '' : t(state)}
        </span>
      </DialogContent>
    </Dialog>
  )
}
