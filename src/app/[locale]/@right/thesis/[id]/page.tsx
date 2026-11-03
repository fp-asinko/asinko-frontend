// By its path: the column's index also brings "Recently viewed", which only the Home has (seo.md).
import { RightColumn } from '@/components/organisms/right-column/right-column'
// By their paths: the communities' index brings the pages' parts, the feed's its client parts.
import { PostAside } from '@/features/communities/components/post-aside'
import { PostMarkdown } from '@/features/feed/components/post-markdown'
import { getThesis } from '@/features/feed/lib/thesis-api'

// The right column of a thesis, as a post's (specs/thesis-detail § 4): where it was published. The
// page asks the same thesis in this request: it comes once (React's cache).
export default async function ThesisRight({ params }: PageProps<'/[locale]/thesis/[id]'>) {
  const { id } = await params
  const thesis = await getThesis(id)
  const community = thesis.ok ? thesis.data.community : null
  return (
    <RightColumn>
      {community && (
        <PostAside community={community} markdown={(body) => <PostMarkdown>{body}</PostMarkdown>} />
      )}
    </RightColumn>
  )
}
