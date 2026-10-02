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
    <section aria-label={t('title')}>
      <p aria-hidden className="px-1 pb-1 text-section text-foreground">
        {t('title')}
      </p>
      <SidebarSection title={t('assets')} result={interests.assets} empty={t('empty.assets')}>
        {(tiles) => <AssetTiles tiles={tiles} />}
      </SidebarSection>
      <SidebarSection title={t('people')} result={interests.people} empty={t('empty.people')}>
        {(people) => <PeopleList people={people} />}
      </SidebarSection>
      <SidebarSection title={t('groups')} result={interests.groups} empty={t('empty.groups')}>
        {(groups) => (
          <>
            <GroupList groups={groups} />
            <ComingSoon
              label={t('createGroup')}
              className="mt-2 flex h-9 w-full items-center gap-2 rounded-md border border-dashed px-3 text-ui text-muted-foreground"
            >
              <PlusCircleIcon aria-hidden className="size-4" />
              {t('createGroup')}
            </ComingSoon>
          </>
        )}
      </SidebarSection>
      <SidebarSection title={t('suggested')} result={interests.suggested}>
        {(suggestions) => <SuggestedCommunities suggestions={suggestions} />}
      </SidebarSection>
    </section>
  )
}
