import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { AsideCard } from '@/components/molecules/aside-card'
import type { CommunityPage, CommunityWidget } from '../../communities.types'
import { CalendarWidgetBody } from './calendar-widget'
import { CommunityAbout } from './community-about'
import { ImagesWidgetBody } from './images-widget'
import { ButtonsWidgetBody } from './buttons-widget'
import { CommunitiesWidgetBody } from './communities-widget'
import { RulesWidgetBody } from './rules-widget'
import { TextWidgetBody } from './text-widget'

function Body({
  widget,
  markdown,
}: {
  widget: CommunityWidget
  markdown: (body: string) => ReactNode
}) {
  switch (widget.type) {
    case 'TEXT':
      return <TextWidgetBody markdown={markdown(widget.body)} />
    case 'RULES':
      return <RulesWidgetBody widget={widget} />
    case 'BUTTONS':
      return <ButtonsWidgetBody widget={widget} />
    case 'COMMUNITIES':
      return <CommunitiesWidgetBody widget={widget} />
    case 'IMAGES':
      return <ImagesWidgetBody widget={widget} />
    case 'CALENDAR':
      return <CalendarWidgetBody widget={widget} />
  }
}

/**
 * A group's right column, as Reddit's sidebar (specs/community-widgets CW-05, CW-06): "Community
 * details" always first, then the moderators' widgets in their order, each a card named by its
 * title. The same in the right column and in the phone's "About the community" (CW-04): `idPrefix`
 * keeps their ids apart. A text's Markdown comes rendered by the page (the feed's renderer: a
 * feature does not import another).
 */
export function CommunityWidgets({
  page,
  widgets,
  markdown,
  idPrefix,
  className,
}: {
  page: CommunityPage
  /** null: they could not be asked (a secondary part: the rest of the page goes on). */
  widgets: CommunityWidget[] | null
  markdown: (body: string) => ReactNode
  idPrefix: string
  className?: string
}) {
  const t = useTranslations('communities.widgets')
  return (
    <div className={className}>
      <div className="flex flex-col gap-3">
        <CommunityAbout page={page} idPrefix={idPrefix} />
        {widgets === null && (
          <p className="rounded-xl border px-3.5 py-3 type-small text-muted-foreground">
            {t('loadError')}
          </p>
        )}
        {widgets?.map((widget) => (
          <AsideCard
            key={widget.id}
            id={`${idPrefix}-${widget.id}`}
            title={widget.title || t(`types.${widget.type}`)}
          >
            <Body widget={widget} markdown={markdown} />
          </AsideCard>
        ))}
      </div>
    </div>
  )
}
