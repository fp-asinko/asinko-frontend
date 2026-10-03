import { PlusCircleIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ComingSoon } from '@/components/molecules/coming-soon'
import type { Interests } from '../interests.types'
import { AssetTiles } from './asset-tiles'
import { GroupList } from './group-list'
import { PeopleList } from './people-list'
import { SidebarSection } from './sidebar-section'
import { SuggestedCommunities } from './suggested-communities'

/** The "Your interests" column as in the prototype (H-07). Pure render: data comes in. */
export function InterestsSections({ interests }: { interests: Interests }) {
  const t = useTranslations('interests')

  return (
    <section aria-label={t('title')} className="flex min-h-full flex-col">
      <p
        aria-hidden
        className="px-1 pt-1 pb-2 text-[0.6875rem] leading-[1.4] font-extrabold tracking-[0.08em] text-muted-foreground uppercase"
      >
        {t('title')}
      </p>
      <SidebarSection
        title={t('assets')}
        result={interests.assets}
        empty={t('empty.assets')}
        moreLabel={t('moreAssets')}
      >
        {(tiles) => <AssetTiles tiles={tiles} />}
      </SidebarSection>
      <SidebarSection
        title={t('people')}
        result={interests.people}
        empty={t('empty.people')}
        moreLabel={t('morePeople')}
      >
        {(people) => <PeopleList people={people} />}
      </SidebarSection>
      <SidebarSection
        title={t('groups')}
        result={interests.groups}
        empty={t('empty.groups')}
        moreLabel={t('moreGroups')}
      >
        {(groups) => <GroupList groups={groups} />}
      </SidebarSection>
      {/* After the groups' "more", as in the prototype; shown even without groups. A column flex
          container so the coming-soon wrapper (and its button) spans the width. */}
      <div className="mt-1 flex flex-col">
        <ComingSoon
          label={t('createGroup')}
          className="flex h-7.5 w-full tap items-center gap-1.75 rounded-md border border-dashed px-1.5 type-meta font-semibold text-muted-foreground hover:bg-surface"
        >
          <PlusCircleIcon aria-hidden className="size-3" />
          {t('createGroup')}
        </ComingSoon>
      </div>
      <SidebarSection
        title={t('suggested')}
        result={interests.suggested}
        className="mt-auto border-t pt-2"
      >
        {(suggestions) => <SuggestedCommunities suggestions={suggestions} />}
      </SidebarSection>
    </section>
  )
}
