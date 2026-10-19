// By its path: the column's index also brings "Recently viewed", which only the Home has (seo.md).
import { RightColumn } from '@/components/organisms/right-column/right-column'
// By their paths: the communities' index brings the pages' parts, the feed's its client parts.
import { PostAside } from '@/features/communities/components/post-aside'
import { PostMarkdown } from '@/features/feed/components/post-markdown'
import { getPost } from '@/features/feed/lib/post-api'

// The right column of a post (specs/community-widgets CW-03): what speaks of where it was
// published. The page asks the same post in this request: it comes once (React's cache).
export default async function PostRight({ params }: PageProps<'/[locale]/post/[id]/[[...slug]]'>) {
  const { id } = await params
  const post = await getPost(id)
  const community = post.ok ? post.data.community : null
  return (
    <RightColumn>
      {community && (
        <PostAside community={community} markdown={(body) => <PostMarkdown>{body}</PostMarkdown>} />
      )}
    </RightColumn>
  )
}
