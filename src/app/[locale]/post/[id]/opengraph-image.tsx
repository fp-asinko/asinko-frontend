import { ImageResponse } from 'next/og'
import { getFormatter, getTranslations } from 'next-intl/server'
import { ShareCard } from '@/features/feed/components/share-card'
import { countFormat } from '@/features/feed/lib/count-format'
import { getPost } from '@/features/feed/lib/post-api'
import { safeLocale } from '@/i18n/safe-locale'
import { clampTitle, shareFonts } from '@/lib/share-image/share-image'
import { SHARE_CONTENT_TYPE, SHARE_SIZE } from '@/lib/share-image/share-size'
import { LOGO_SRC } from '../../_share/brand'
import { GenericShareCard } from '../../_share/generic-card'

// A post's image for other apps (specs/share-preview SP-01, SP-06). In post/[id], not in
// [[...slug]]: the same image with or without the slug. The post is the page's public read (bots
// have no session); a post that cannot be shown gets the brand's image.

// Per post, at request time: the post's read goes through the session's cookies (getViewer).
export const dynamic = 'force-dynamic'

type Params = { locale: string; id: string }

async function shownPost(id: string) {
  const result = await getPost(id)
  return result.ok && !result.data.deleted ? result.data : null
}

/** Its alt text is the post's title (SP-02). */
export async function generateImageMetadata({ params }: { params: Params }) {
  const post = await shownPost(params.id)
  const t = await getTranslations({ locale: safeLocale(params.locale), namespace: 'metadata' })
  return [
    {
      id: 'card',
      alt: post?.title ?? t('description'),
      size: SHARE_SIZE,
      contentType: SHARE_CONTENT_TYPE,
    },
  ]
}

export default async function Image({ params }: { params: Promise<Params> }) {
  const { locale: rawLocale, id } = await params
  const locale = safeLocale(rawLocale)
  const [post, fonts] = await Promise.all([shownPost(id), shareFonts()])
  const options = { ...SHARE_SIZE, fonts }

  if (!post) {
    const t = await getTranslations({ locale, namespace: 'metadata' })
    return new ImageResponse(<GenericShareCard tagline={t('description')} />, options)
  }

  const [t, format] = await Promise.all([
    getTranslations({ locale, namespace: 'shareImage' }),
    getFormatter({ locale }),
  ])
  const community = post.community
  return new ImageResponse(
    <ShareCard
      logoSrc={LOGO_SRC}
      title={clampTitle(post.title)}
      community={
        community
          ? {
              handle: community.personal
                ? (post.author?.handle ?? community.handle)
                : community.handle,
              colorKey: community.personal
                ? (post.author?.username ?? community.slug)
                : community.slug,
              person: community.personal,
            }
          : null
      }
      author={community?.personal ? null : (post.author?.handle ?? null)}
      stats={t('stats', {
        votes: post.score,
        votesLabel: format.number(post.score, countFormat(post.score)),
        comments: post.commentCount,
        commentsLabel: format.number(post.commentCount, countFormat(post.commentCount)),
      })}
    />,
    options,
  )
}
