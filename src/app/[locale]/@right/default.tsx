import { RightColumn } from '@/components/organisms/right-column'

// The right column of a page without its own (specs/right-column), as a parallel slot so a page
// can bring its own (specs/submit-page § 2). This route and its siblings (the catch-all) keep it on
// every URL: on a client navigation, a slot without a match keeps the last one. Only the footer:
// the Home's cards are the Home's (specs/community-widgets CW-02).
export default function Right() {
  return <RightColumn />
}
