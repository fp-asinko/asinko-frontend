import { RightColumn } from '@/components/organisms/right-column'

// The right column of every page (specs/right-column), as a parallel slot so a page can bring its
// own (specs/submit-page § 2). This route and its siblings (default, the root and the catch-all)
// keep it on every URL: on a client navigation, a slot without a match keeps the last one.
export default function Right() {
  return <RightColumn />
}
