import { PlusIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ComingSoon } from '@/components/molecules/coming-soon'
import { UserAvatar } from '@/components/molecules/user-avatar'
import type { Suggestion } from '../interests.types'
import { CommunityLink } from './community-link'

/**
 * Communities to join. Joining arrives with the communities spec: shown as coming soon. The link's
 * name is its content (handle and member count).
 */
export function SuggestedCommunities({ suggestions }: { suggestions: Suggestion[] }) {
  const t = useTranslations('interests')

  return (
    <ul className="flex flex-col">
      {suggestions.map((suggestion) => (
        <li key={suggestion.slug} className="flex items-center gap-2 rounded-md px-0.5 py-1.5">
          <CommunityLink
            slug={suggestion.slug}
            className="group flex min-w-0 flex-1 tap items-center gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:bg-muted aria-[current=page]:ring-1 aria-[current=page]:ring-foreground"
          >
            <UserAvatar
              name={suggestion.name}
              imageUrl={suggestion.avatarUrl}
              size="md"
              className="size-8 rounded-md transition-[scale] duration-200 ease-out group-hover:scale-105"
            />
            <span className="min-w-0">
              <span className="block truncate type-meta font-bold">{suggestion.handle}</span>{' '}
              <span className="block truncate text-[0.625rem] text-muted-foreground">
                {t('members', { count: suggestion.memberCount })}
              </span>
            </span>
          </CommunityLink>
          <ComingSoon
            label={t('joinLabel', { handle: suggestion.handle })}
            placement="below-end"
            className="inline-flex h-6 tap items-center gap-0.5 rounded-full border px-2 text-[0.625rem] hover:bg-surface"
          >
            <PlusIcon aria-hidden className="size-2.5" />
            {t('join')}
          </ComingSoon>
        </li>
      ))}
    </ul>
  )
}
