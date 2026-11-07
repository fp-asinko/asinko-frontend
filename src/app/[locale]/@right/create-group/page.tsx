// By its path: the column's index also brings "Recently viewed", which only the Home has (seo.md).
import { RightColumn } from '@/components/organisms/right-column/right-column'
import { GroupTips } from '@/features/communities/components/create-group/group-tips'

// The right column of the page to create a group (specs/community-create CG-08, CG-23): the place
// where the form puts its preview, and the tips under it. The slot is another React tree: the form
// reaches it with a portal once hydrated.
export default function CreateGroupRight() {
  return (
    <RightColumn>
      <div className="flex flex-col gap-3 p-3.5">
        <div id="group-preview-slot" />
        <GroupTips />
      </div>
    </RightColumn>
  )
}
