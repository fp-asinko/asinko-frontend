import { ArrowRightIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ComingSoon } from '@/components/molecules/coming-soon'
import { Link } from '@/i18n/navigation'

const SEE_ALL =
  'group inline-flex min-h-6 w-fit tap items-center gap-1 rounded-sm type-meta font-bold text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50'

/**
 * "See all comments" under a card's comments (specs/post-create-detail PC-17): the post's page, or
 * "Coming soon" without one (polls). Rendered on the server and handed to the toggle as a node:
 * the first load carries no code for it (JS budget, seo.md).
 */
export function SeeAllComments({ href }: { href?: string }) {
  const t = useTranslations('feed.comments')
  const content = (
    <>
      {t('seeAll')}
      <ArrowRightIcon
        aria-hidden
        className="size-3.5 transition-[translate] duration-150 ease-out group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5"
      />
    </>
  )
  return href ? (
    <Link href={href} className={SEE_ALL}>
      {content}
    </Link>
  ) : (
    <ComingSoon label={t('seeAll')} className={SEE_ALL}>
      {content}
    </ComingSoon>
  )
}
