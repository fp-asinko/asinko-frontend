// Domain types of the post editor (specs/post-create-detail § 3). The UI only knows these.

/** A community the post can go to: what the picker shows. */
export type CommunityOption = {
  id: string
  /** #defi, $BTC, or @you for your own channel. */
  handle: string
  name: string
  /** Your own personal channel: shown first, as "Your profile". */
  own: boolean
}
