'use client'

import { AlignLeftIcon, ImageIcon, LinkIcon, QuoteIcon, TargetIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'

/** What the page creates: a post in one of its formats, or a thesis (specs/thesis-create TC-01). */
export type CreateFormat = 'THOUGHT' | 'TEXT' | 'LINK' | 'IMAGE' | 'THESIS'

/**
 * A format, as Reddit's tabs: its name, a line under the chosen one (SF-02), on the row's border
 * (shadcn's sits 5px below it). In phones, only the names: with their icons the five did not
 * fit 360px (390 to 399px, measured in en, es and pt); from sm, the icons too.
 */
const FORMAT =
  'h-10 flex-none gap-1.5 rounded-none border-0 px-2 type-action text-muted-foreground hover:text-foreground data-active:text-foreground group-data-horizontal/tabs:after:-bottom-px sm:px-3 [&_svg]:hidden [&_svg]:size-4 sm:[&_svg]:block'

/**
 * The formats on top of the editors, as Reddit's (specs/submit-form-layout SF-02), inside their
 * `Tabs`: the post's four and the thesis. Icons and names: room enough here.
 */
export function FormatTabs() {
  const t = useTranslations('composer.type')
  return (
    <TabsList
      variant="line"
      aria-label={t('label')}
      className="h-auto w-full justify-start gap-1 border-b p-0"
    >
      {/* First, as the prototype's; Text stays the one chosen on arrival. Only its text, no
          title (specs/thoughts TH-03). */}
      <TabsTrigger value="THOUGHT" className={FORMAT}>
        <QuoteIcon aria-hidden />
        {t('thought')}
      </TabsTrigger>
      <TabsTrigger value="TEXT" className={FORMAT}>
        <AlignLeftIcon aria-hidden />
        {t('text')}
      </TabsTrigger>
      <TabsTrigger value="LINK" className={FORMAT}>
        <LinkIcon aria-hidden />
        {t('link')}
      </TabsTrigger>
      <TabsTrigger value="IMAGE" className={FORMAT}>
        <ImageIcon aria-hidden />
        {t('image')}
      </TabsTrigger>
      <TabsTrigger value="THESIS" className={FORMAT}>
        <TargetIcon aria-hidden />
        {t('thesis')}
      </TabsTrigger>
    </TabsList>
  )
}
