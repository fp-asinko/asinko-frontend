import { ChevronDownIcon, InfoIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { CommunityPage } from '../../communities.types'
import { getCommunityPage } from '../../lib/community-api'
import { getWidgets } from '../../lib/widgets-api'
import { CommunityWidgets } from './community-widgets'

/**
 * A group's right column (specs/community-widgets CW-03): its details and its widgets. Asked by its
 * slug: the group's page and a post of it both bring one. The community and its widgets are cached
 * per request. A group that cannot be asked shows nothing (the page says why).
 */
export async function GroupAside({
  slug,
  markdown,
}: {
  slug: string
  markdown: (body: string) => ReactNode
}) {
  const [result, widgets] = await Promise.all([getCommunityPage(slug), getWidgets(slug)])
  if (!result.ok || result.data.kind !== 'group') return null
  return (
    <CommunityWidgets
      page={result.data}
      widgets={widgets}
      markdown={markdown}
      idPrefix="aside"
      className="m-3.5 mb-0"
    />
  )
}

/**
 * Under lg there is no right column: the same details and widgets fold under the header, as
 * "About the community", closed on arrival (CW-04).
 */
export async function GroupAboutFold({
  page,
  markdown,
}: {
  page: CommunityPage
  markdown: (body: string) => ReactNode
}) {
  const widgets = await getWidgets(page.slug)
  return <GroupAboutFoldView page={page} widgets={widgets} markdown={markdown} />
}

export function GroupAboutFoldView({
  page,
  widgets,
  markdown,
}: {
  page: CommunityPage
  widgets: Awaited<ReturnType<typeof getWidgets>>
  markdown: (body: string) => ReactNode
}) {
  const t = useTranslations('communities.widgets')
  return (
    <Collapsible className="mx-4 mt-3 rounded-lg border bg-surface sm:mx-0 lg:hidden">
      <CollapsibleTrigger className="group flex min-h-11 w-full items-center gap-2 rounded-lg px-3.5 type-action outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <InfoIcon aria-hidden className="size-4 text-muted-foreground" />
        <span className="min-w-0 flex-1 text-left">{t('mobileTitle')}</span>
        <ChevronDownIcon
          aria-hidden
          className="size-4 text-muted-foreground transition-transform duration-200 ease-out group-data-panel-open:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-ending-style:duration-150 data-starting-style:h-0">
        <CommunityWidgets
          page={page}
          widgets={widgets}
          markdown={markdown}
          idPrefix="fold"
          className="px-3 pb-3"
        />
      </CollapsibleContent>
    </Collapsible>
  )
}
