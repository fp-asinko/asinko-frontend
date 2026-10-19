import { ArrowUpRightIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { CommunityWidget } from '../../communities.types'
import { WidgetAnchor } from './widget-anchor'

type Of<T extends CommunityWidget['type']> = Extract<CommunityWidget, { type: T }>

/** The buttons (CW-06): gray pills, each to its page; an external one says its real host. */
export function ButtonsWidgetBody({ widget }: { widget: Of<'BUTTONS'> }) {
  const t = useTranslations('communities.widgets')
  return (
    <ul className="flex flex-col gap-2">
      {widget.buttons.map((button, index) => (
        <li key={index}>
          <WidgetAnchor
            link={button.link}
            className="flex min-h-10 w-full tap items-center justify-center gap-1.5 rounded-full bg-muted px-4 type-action outline-none hover:bg-muted-hover focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span className="truncate">{button.label}</span>
            {button.link.external && (
              <>
                <ArrowUpRightIcon aria-hidden className="size-3.5 shrink-0" />{' '}
                <span className="sr-only">{t('host', { host: button.link.host ?? '' })}</span>
              </>
            )}
          </WidgetAnchor>
        </li>
      ))}
    </ul>
  )
}
