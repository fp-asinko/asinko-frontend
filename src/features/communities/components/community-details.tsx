import { ArrowUpRightIcon, ChartNoAxesColumnIcon, ChevronDownIcon, ListIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { CommunityPage } from '../communities.types'

/**
 * The row under the header (specs/community-pages § 5): a group's rules and website, closed on
 * load; an asset's market data, open, with an explicit empty state until there is a price
 * provider (CP-10: never invented numbers). A group without rules nor website shows nothing.
 */
export function CommunityDetails({ page }: { page: CommunityPage }) {
  const t = useTranslations('communities')

  if (page.kind === 'asset') {
    return (
      <Details
        title={t('assetData.title')}
        icon={<ChartNoAxesColumnIcon aria-hidden className="size-4" />}
        defaultOpen
      >
        <div className="flex flex-col items-center gap-1 py-4 text-center">
          <p className="type-ui font-semibold">{t('assetData.empty')}</p>
          <p className="type-meta text-muted-foreground">{t('assetData.soon')}</p>
        </div>
      </Details>
    )
  }

  if (!page.rules && !page.mainUrl) return null
  return (
    <Details title={t('rules.title')} icon={<ListIcon aria-hidden className="size-4" />}>
      {page.rules && (
        <p className="type-ui whitespace-pre-line text-muted-foreground">{page.rules}</p>
      )}
      {page.mainUrl && (
        <a
          href={page.mainUrl.url}
          target="_blank"
          rel="noopener noreferrer nofollow ugc"
          className="mt-3 flex w-fit max-w-full tap items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 type-action text-muted-foreground hover:bg-muted-hover"
        >
          <span className="truncate">{page.mainUrl.domain}</span>
          <ArrowUpRightIcon aria-hidden className="size-3.5 shrink-0" />
          <span className="sr-only">{t('rules.newTab')}</span>
        </a>
      )}
    </Details>
  )
}

function Details({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string
  icon: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="mx-4 mb-4 rounded-lg border sm:mx-0">
      <CollapsibleTrigger className="group flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-lg px-3.5 type-ui font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        {icon}
        <span className="flex-1 text-left">{title}</span>
        <ChevronDownIcon
          aria-hidden
          className="size-4 text-muted-foreground transition-transform duration-200 ease-out group-data-panel-open:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-ending-style:duration-150 data-starting-style:h-0">
        <div className="px-3.5 pb-3.5">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}
