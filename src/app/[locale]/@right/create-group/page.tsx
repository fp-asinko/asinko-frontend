// By its path: the column's index also brings "Recently viewed", which only the Home has (seo.md).
import { RightColumn } from '@/components/organisms/right-column/right-column'

// The right column of the page to create a group (specs/community-create CG-08): only the place
// where the form puts its preview. The slot is another React tree: the form reaches it with a
// portal once hydrated.
export default function CreateGroupRight() {
  return (
    <RightColumn>
      <div id="group-preview-slot" className="p-3.5" />
    </RightColumn>
  )
}
