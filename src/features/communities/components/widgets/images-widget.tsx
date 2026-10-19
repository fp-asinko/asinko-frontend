import Image from 'next/image'
import { useTranslations } from 'next-intl'
import type { CommunityWidget } from '../../communities.types'
import { WidgetAnchor } from './widget-anchor'

type ImagesWidget = Extract<CommunityWidget, { type: 'IMAGES' }>

/**
 * The images (specs/community-widgets CW-06): one at a time, passed sideways with a finger or the
 * scrollbar (scroll-snap, no JavaScript), each with "1 of 3" over it. Their size is not known:
 * contained in a 4:3 box. One with a link leads there.
 */
export function ImagesWidgetBody({ widget }: { widget: ImagesWidget }) {
  const t = useTranslations('communities.widgets.images')
  const total = widget.images.length

  return (
    // A focusable region around the row: without links, the keyboard still scrolls it (Safari does
    // not otherwise, WCAG 2.1.1).
    <div
      role="region"
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scroll container must take the focus to scroll from the keyboard
      tabIndex={0}
      aria-label={t('label')}
      className="-mx-1 snap-x snap-mandatory overflow-x-auto rounded-lg px-1 pb-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <ul className="flex gap-2">
        {widget.images.map((image, index) => {
          const picture = (
            <span className="relative block aspect-4/3 overflow-hidden rounded-lg border bg-surface">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(min-width: 1024px) 272px, (min-width: 640px) 560px, calc(100vw - 5.5rem)"
                className="object-contain"
              />
              {total > 1 && (
                <span
                  aria-hidden
                  className="absolute right-2 bottom-2 rounded-full bg-foreground/70 px-2 type-meta text-background tabular-nums"
                >
                  {t('position', { index: index + 1, total })}
                </span>
              )}
            </span>
          )
          return (
            <li key={index} className="w-full shrink-0 snap-start">
              {image.link ? (
                <WidgetAnchor
                  link={image.link}
                  className="block rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {picture}
                </WidgetAnchor>
              ) : (
                picture
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
