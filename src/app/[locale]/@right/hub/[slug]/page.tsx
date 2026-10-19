// By its path: the column's index also brings "Recently viewed", which only the Home has (seo.md).
import { RightColumn } from '@/components/organisms/right-column/right-column'
// By their paths: the profiles' and assets' pages, which use the feature's index, do not need them.
import { GroupAside } from '@/features/communities/components/widgets/group-aside'
import { PostMarkdown } from '@/features/feed/components/post-markdown'

// A group's right column, as Reddit's sidebar (specs/community-widgets CW-03): its details and its
// widgets. A text's Markdown with the feed's renderer, on the server.
export default async function GroupRight({ params }: PageProps<'/[locale]/hub/[slug]'>) {
  const { slug } = await params
  return (
    <RightColumn>
      <GroupAside
        slug={decodeURIComponent(slug)}
        markdown={(body) => <PostMarkdown>{body}</PostMarkdown>}
      />
    </RightColumn>
  )
}
