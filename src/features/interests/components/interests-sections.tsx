import { JoinCard } from '@/components/organisms/auth-gate'
import { PlusCircleIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ComingSoon } from '@/components/molecules/coming-soon'
import type { Interests } from '../interests.types'
import { AssetTiles } from './asset-tiles'
import { GroupList } from './group-list'
import { PeopleList } from './people-list'
import { SidebarSection } from './sidebar-section'
import { SuggestedCommunities } from './suggested-communities'

const COLUMN_TITLE =
  'px-1 pt-1 pb-2 text-[0.6875rem] leading-[1.4] font-extrabold tracking-[0.08em] text-muted-foreground uppercase'

/**
 * The "Your interests" column as in the prototype (H-07). Pure render: data comes in. Without a
 * session the viewer sections would always be empty, so the column is the invitation to join
 * (specs/guest-sidebar) and the biggest communities (decided 2026-10-03).
 */
export function InterestsSections({ interests }: { interests: Interests }) {
  const t = useTranslations('interests')

  if (!interests.signedIn) {
    return (
      <>
        {/* The invitation to have an account, as Reddit (specs/guest-sidebar GS-01). */}
        <JoinCard />
        {/* A short, soft line: it separates without weighing (same as before Suggested). */}
        <hr className="mx-1 my-6 shrink-0 border-border/60" />
        <section aria-label={t('guestTitle')} className="flex flex-col">
          <p aria-hidden className={COLUMN_TITLE}>
            {t('guestTitle')}
          </p>
          {interests.suggested.ok ? (
            <SuggestedCommunities suggestions={interests.suggested.data} />
          ) : (
            <p className="px-1 type-meta text-muted-foreground">{t('error')}</p>
          )}
        </section>
      </>
    )
  }

  return (
    <section aria-label={t('title')} className="flex min-h-full flex-col">
      <p aria-hidden className={COLUMN_TITLE}>
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
      <div className="mt-1 mb-6 flex flex-col">
        <ComingSoon
          label={t('createGroup')}
          className="flex h-7.5 w-full tap items-center gap-1.75 rounded-md border border-dashed px-1.5 type-meta font-semibold text-muted-foreground hover:bg-surface"
        >
          <PlusCircleIcon aria-hidden className="size-3" />
          {t('createGroup')}
        </ComingSoon>
      </div>
      {/* At the bottom of the column, after a short, soft line (as without a session). */}
      <hr className="mx-1 mt-auto mb-6 shrink-0 border-border/60" />
      <SidebarSection title={t('suggested')} result={interests.suggested}>
        {(suggestions) => <SuggestedCommunities suggestions={suggestions} />}
      </SidebarSection>
    </section>
  )
}
