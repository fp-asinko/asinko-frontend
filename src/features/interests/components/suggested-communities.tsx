import { useTranslations } from 'next-intl'
import { ComingSoon } from '@/components/molecules/coming-soon'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { Link } from '@/i18n/navigation'
import type { Suggestion } from '../interests.types'

/** Communities to join. Joining arrives with the communities spec: shown as coming soon. */
export function SuggestedCommunities({ suggestions }: { suggestions: Suggestion[] }) {
  const t = useTranslations('interests')

  return (
    <ul className="flex flex-col">
      {suggestions.map((suggestion) => (
        <li key={suggestion.slug} className="flex items-center gap-2 rounded-md px-0.5 py-1.5">
          <Link
            href={{ pathname: '/', query: { comunidad: suggestion.slug } }}
            aria-label={`${suggestion.handle} · ${suggestion.name}`}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <UserAvatar
              name={suggestion.name}
              imageUrl={suggestion.avatarUrl}
              size="md"
              className="size-8 rounded-[7px]"
            />
            <span className="min-w-0">
              <span className="block truncate type-meta font-bold">{suggestion.handle}</span>
              <span className="block truncate text-[0.625rem] text-muted-foreground">
                {t('members', { count: suggestion.memberCount })}
              </span>
            </span>
          </Link>
          <ComingSoon
            label={`${t('join')} ${suggestion.handle}`}
            className="h-6 rounded-full border px-2 text-[0.625rem]"
          >
            + {t('join')}
          </ComingSoon>
        </li>
      ))}
    </ul>
  )
}
