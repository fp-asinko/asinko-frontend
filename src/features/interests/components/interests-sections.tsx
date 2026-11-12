import { JoinCard } from '@/components/organisms/auth-gate'
import { PlusCircleIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { Interests } from '../interests.types'
import { AssetList } from './asset-list'
import { GroupList } from './group-list'
import { PeopleList } from './people-list'
import { SidebarSection } from './sidebar-section'
import { SuggestedCommunities } from './suggested-communities'
import { CoinsIcon, HashIcon, UsersIcon } from 'lucide-react'

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
    // A size container (specs/sidebar-fill): its lists ask for the height there is.
    <section
      aria-label={t('title')}
      // Only the desktop column: the phone's panel keeps its natural height (out of scope).
      className="flex flex-col md:[container-type:size] md:h-full md:[container-name:column]"
    >
      <p aria-hidden className={COLUMN_TITLE}>
        {t('title')}
      </p>
      {/* Groups, people, then assets (PO, 2026-10-21, specs/sidebar-fill SF-01). */}
      <SidebarSection
        title={t('groups')}
        result={interests.groups}
        empty={t('empty.groups')}
        emptyIcon={<HashIcon />}
        more
      >
        {(groups, listId) => <GroupList id={listId} groups={groups} />}
      </SidebarSection>
      {/* After the groups' "more", as in the prototype; shown even without groups. Its page
          (specs/community-create CG-01). */}
      <div className="mt-1 mb-6 flex flex-col">
        <Link
          href="/create-group"
          className="flex h-7.5 w-full tap items-center gap-1.75 rounded-md border border-dashed px-1.5 type-meta font-semibold text-muted-foreground outline-none hover:bg-surface hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <PlusCircleIcon aria-hidden className="size-3" />
          {t('createGroup')}
        </Link>
      </div>
      <SidebarSection
        title={t('people')}
        result={interests.people}
        empty={t('empty.people')}
        emptyIcon={<UsersIcon />}
        more
      >
        {(people, listId) => <PeopleList id={listId} people={people} />}
      </SidebarSection>
      <SidebarSection
        title={t('assets')}
        result={interests.assets}
        empty={t('empty.assets')}
        emptyIcon={<CoinsIcon />}
        more
      >
        {(assets, listId) => <AssetList id={listId} assets={assets} />}
      </SidebarSection>
      {/* At the bottom of the column (PO, 2026-11-10), after a short, soft line (as without a
          session): the space left goes above it. At least the line, its title and one whole
          item: below that, the column scrolls (SF-04). */}
      <div className="flex flex-col md:min-h-30.25 md:flex-1 md:justify-end">
        <hr className="mx-1 mb-6 shrink-0 border-border/60" />
        {/* At most the height left, whole items only (SF-02). */}
        <SidebarSection title={t('suggested')} result={interests.suggested} fill className="mb-0">
          {(suggestions) => <SuggestedCommunities suggestions={suggestions} />}
        </SidebarSection>
      </div>
    </section>
  )
}
