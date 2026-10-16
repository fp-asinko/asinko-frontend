import { LightbulbIcon } from 'lucide-react'
import { getFormatter, getTranslations } from 'next-intl/server'
import { IdentityBanner } from '@/components/molecules/identity-banner'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { SiteFooter } from '@/components/organisms/right-column'
import { getViewer } from '@/lib/session'
import { cn } from '@/lib/utils'
import { getSubmitCommunity } from '../lib/submit-community'

/** A card of the right column, as its widgets (specs/right-column). */
const CARD = 'm-3.5 overflow-hidden rounded-lg border bg-surface'

/**
 * The right column of the page to create a post (specs/submit-page SU-07), as Reddit's: the chosen
 * community's card (its banner or its color, avatar, handle, name, description, members and since
 * when, or the asset's name and class) and its rules; without one, tips to post well. It follows
 * the URL: choosing another community re-renders it. The site's footer stays at the bottom, as in
 * every right column. A secondary section: if the community fails, it says so here alone.
 */
export async function SubmitAside({ community }: { community?: string }) {
  return (
    <div className="flex min-h-full flex-col">
      <Cards community={community} />
      <SiteFooter className="mt-auto" />
    </div>
  )
}

async function Cards({ community }: { community?: string }) {
  const t = await getTranslations('submitPage')
  const viewer = community ? await getViewer() : null
  const found = community && viewer ? await getSubmitCommunity(community, viewer.username) : null
  const shown = found?.ok && found.data.postable ? found.data : null

  if (found && !found.ok && found.kind === 'unexpected') {
    return (
      <p role="status" className={cn(CARD, 'px-4 py-3.5 type-small text-muted-foreground')}>
        {t('loadError')}
      </p>
    )
  }

  if (!shown) {
    return (
      <section aria-labelledby="submit-tips" className={cn(CARD, 'px-4 py-3.5')}>
        <h2 id="submit-tips" className="flex items-center gap-2 type-section text-muted-foreground">
          <LightbulbIcon aria-hidden className="size-3.5" />
          {t('tipsTitle')}
        </h2>
        <ul className="mt-3 flex list-disc flex-col gap-2 pl-4 type-small text-muted-foreground">
          <li>{t('tips.title')}</li>
          <li>{t('tips.mentions')}</li>
          <li>{t('tips.rules')}</li>
        </ul>
      </section>
    )
  }

  const format = await getFormatter()
  return (
    <>
      <section aria-labelledby="submit-community" className={CARD}>
        <IdentityBanner colorKey={shown.option.slug} imageUrl={shown.bannerUrl} className="h-16" />
        <div className="px-4 pb-4">
          <UserAvatar
            name={shown.option.handle}
            colorKey={shown.option.slug}
            imageUrl={shown.avatarUrl}
            size="lg"
            className={cn(
              'relative -mt-5 size-10 border-2 border-surface',
              shown.kind === 'user' ? 'rounded-full' : 'rounded-lg',
            )}
          />
          <h2 id="submit-community" className="mt-2 type-ui font-bold wrap-anywhere">
            {shown.option.handle}
          </h2>
          {shown.subtitle && (
            <p className="type-meta wrap-anywhere text-muted-foreground">{shown.subtitle}</p>
          )}
          {shown.description && (
            <p className="mt-2 type-small wrap-anywhere text-muted-foreground">
              {shown.description}
            </p>
          )}
          <p className="mt-3 flex flex-wrap gap-x-3 type-meta text-muted-foreground">
            <span>
              {t.rich('members', {
                count: shown.memberCount,
                b: (chunks) => <strong className="font-semibold text-foreground">{chunks}</strong>,
              })}
            </span>
            {shown.assetClass && <span>{t(`assetClass.${shown.assetClass}`)}</span>}
            {shown.createdAt && (
              <span>
                {t('since', {
                  date: format.dateTime(new Date(shown.createdAt), { dateStyle: 'medium' }),
                })}
              </span>
            )}
          </p>
        </div>
      </section>
      {shown.rules && (
        <section aria-labelledby="submit-rules" className={cn(CARD, 'mt-0 px-4 py-3.5')}>
          <h2 id="submit-rules" className="type-section wrap-anywhere text-muted-foreground">
            {t('rulesOf', { handle: shown.option.handle })}
          </h2>
          <p className="mt-2 type-small wrap-anywhere whitespace-pre-line text-muted-foreground">
            {shown.rules}
          </p>
        </section>
      )}
    </>
  )
}
