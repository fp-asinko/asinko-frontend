import { useTranslations } from 'next-intl'
import { ComingSoon } from '@/components/molecules/coming-soon'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { Link } from '@/i18n/navigation'
import type { Suggestion } from '../interests.types'

/** Communities to join. Joining arrives with the communities spec: shown as coming soon. */
export function SuggestedCommunities({ suggestions }: { suggestions: Suggestion[] }) {
  const t = useTranslations('interests')

  return (
    <ul className="flex flex-col gap-1">
      {suggestions.map((suggestion) => (
        <li key={suggestion.slug} className="flex items-center gap-2 px-1 py-1">
          <Link
            href={{ pathname: '/', query: { comunidad: suggestion.slug } }}
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <UserAvatar
              name={suggestion.name}
              imageUrl={suggestion.avatarUrl}
              size="sm"
              className="rounded-md"
            />
            <span className="min-w-0">
              <span className="block truncate text-ui font-semibold">{suggestion.name}</span>
              <span className="block text-meta text-muted-foreground">
                {t('members', { count: suggestion.memberCount })}
              </span>
            </span>
          </Link>
          <ComingSoon
            label={`${t('join')} ${suggestion.name}`}
            className="h-7 rounded-full border px-2.5 text-meta font-semibold"
          >
            + {t('join')}
          </ComingSoon>
        </li>
      ))}
    </ul>
  )
}
