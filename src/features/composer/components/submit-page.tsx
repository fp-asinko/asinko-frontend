import { ChevronDownIcon, ScrollTextIcon, UserRoundPlusIcon } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { z } from 'zod'
import { PageColumns } from '@/components/organisms/app-shell'
// By its path: from the shell's index, every route would load it (seo.md).
import { LeftColumnFold } from '@/components/organisms/app-shell/left-column-fold'
import { GateButtons } from '@/components/organisms/auth-gate'
import { EmptyState } from '@/components/organisms/empty-state'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { Locale } from '@/i18n/routing'
import { permanentRedirect } from '@/i18n/navigation'
import { assetSymbolSchema } from '@/lib/communities/asset-symbol.schema'
import { communitySlugSchema } from '@/lib/communities/community-slug.schema'
import { getViewer } from '@/lib/session'
import { SUBMIT_SEGMENT } from '@/i18n/submit-path'
import { draftKey } from '../lib/draft-key'
import { RELATED_MAX } from '../schemas/create-post.schema'
import { getSubmitCommunity } from '../lib/submit-community'
import type { PreviewAction } from './body-tabs'
import { SubmitEditorLoader } from './submit-editor-loader'

type SearchParams = Record<string, string | string[] | undefined>

/** The page's query: user input, checked; anything odd is left out (SU-01). */
const querySchema = z.object({
  community: z.string().min(1).max(64).optional().catch(undefined),
  type: z.enum(['text', 'link', 'image']).optional().catch(undefined),
})

/** A related one's slug (specs/related-aside RA-04): a group's or an asset's. */
const isSlug = (slug: string) =>
  communitySlugSchema.safeParse(slug).success || assetSymbolSchema.safeParse(slug).success

export function parseSubmitQuery(searchParams: SearchParams) {
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)
  const query = querySchema.parse({
    community: one(searchParams.community),
    type: one(searchParams.type),
  })
  // Up to three, valid, without repeats or the main community; anything else is left out.
  const related = [...new Set((one(searchParams.related) ?? '').split(','))]
    .filter((slug) => slug && slug !== query.community && isSlug(slug))
    .slice(0, RELATED_MAX)
  return { ...query, related }
}

/**
 * Each locale has its word (SU-01): /es/submit goes to /es/publicar (308, with its query), and
 * /en/publicar does not exist.
 */
export function checkSubmitSegment(
  segment: 'submit' | 'publicar',
  locale: Locale,
  searchParams: SearchParams,
) {
  if (SUBMIT_SEGMENT[locale] === segment) return
  if (segment === 'publicar') notFound()
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === 'string') query.set(key, value)
  }
  const search = query.toString()
  permanentRedirect({
    href: `/${SUBMIT_SEGMENT[locale]}${search ? `?${search}` : ''}`,
    locale,
  })
}

/** "Create post", not indexed, with its URL in each locale (SU-10). */
export async function submitMetadata(locale: Locale): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'submitPage' })
  const languages = Object.fromEntries(
    Object.entries(SUBMIT_SEGMENT).map(([each, segment]) => [each, `/${each}/${segment}`]),
  )
  return {
    title: t('title'),
    robots: { index: false, follow: false },
    alternates: {
      canonical: `/${locale}/${SUBMIT_SEGMENT[locale]}`,
      languages: { ...languages, 'x-default': '/en/submit' },
    },
  }
}

/**
 * The page to create a post (specs/submit-page): its title, the community's rules where there is
 * no right column (SU-08), and the editor with the community and the format of the URL. Without a
 * session, how to get in (SU-06). Someone else's personal channel cannot be posted to: it is left
 * out.
 */
export async function SubmitPage({
  searchParams,
  preview,
}: {
  searchParams: SearchParams
  /** The preview's Server Action (specs/submit-tools ST-01), from the page. */
  preview?: PreviewAction
}) {
  const t = await getTranslations('submitPage')
  const query = parseSubmitQuery(searchParams)
  const viewer = await getViewer()

  if (!viewer) {
    return (
      <PageColumns>
        <h1 className="px-4 pt-4 type-page-title md:px-0">{t('title')}</h1>
        <EmptyState
          icon={<UserRoundPlusIcon />}
          title={t('gateTitle')}
          description={t('gateBody')}
          action={<GateButtons className="justify-center" />}
        />
      </PageColumns>
    )
  }

  const found = query.community ? await getSubmitCommunity(query.community, viewer.username) : null
  const community = found?.ok && found.data.postable ? found.data : null
  const type = query.type === 'link' ? 'LINK' : query.type === 'image' ? 'IMAGE' : 'TEXT'
  // The related ones of the URL that exist and can be tagged: groups and assets (RA-04).
  const related = (
    await Promise.all(query.related.map((slug) => getSubmitCommunity(slug, viewer.username)))
  )
    .flatMap((each) => (each.ok && each.data.kind !== 'user' ? [each.data.option.handle] : []))
    .filter((handle) => handle !== community?.option.handle)

  return (
    <PageColumns>
      {/* Writing with the left column folded (specs/submit-tools ST-08). */}
      <LeftColumnFold />
      <h1 className="px-4 pt-4 type-page-title md:px-0">{t('title')}</h1>
      {community?.rules && (
        // Where there is no right column, the rules fold under the title (SU-08).
        <Collapsible className="mx-4 mt-3 rounded-lg border bg-surface md:mx-0 lg:hidden">
          <CollapsibleTrigger className="group flex min-h-11 w-full items-center gap-2 rounded-lg px-3.5 type-action outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <ScrollTextIcon aria-hidden className="size-4 text-muted-foreground" />
            <span className="min-w-0 flex-1 text-left wrap-anywhere">
              {t('rulesOf', { handle: community.option.handle })}
            </span>
            <ChevronDownIcon
              aria-hidden
              className="size-4 text-muted-foreground transition-transform duration-200 ease-out group-data-panel-open:rotate-180"
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-ending-style:duration-150 data-starting-style:h-0">
            <p className="px-3.5 pb-3.5 type-small wrap-anywhere whitespace-pre-line text-muted-foreground">
              {community.rules}
            </p>
          </CollapsibleContent>
        </Collapsible>
      )}
      <div className="px-4 py-4 md:px-0">
        <SubmitEditorLoader
          type={type}
          community={community?.option ?? null}
          storageKey={draftKey(viewer.id)}
          related={related}
          preview={preview}
        />
      </div>
    </PageColumns>
  )
}
