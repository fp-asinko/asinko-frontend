import type { RawThesis } from '@/lib/api/contract'
import { allowedImageUrl } from '@/lib/images'

/**
 * The logo of a thesis's asset (specs/thesis-ticket TK-04): its own, once the backend sends it
 * (P-041), or else its community's avatar when the thesis is in that community. Otherwise none:
 * the ticket draws the initials.
 */
export function thesisAssetLogo(thesis: Pick<RawThesis, 'asset' | 'community'>): string | null {
  if (!thesis.asset) return null
  const own =
    thesis.community.type === 'SYSTEM_ASSET' && thesis.community.slug === thesis.asset.symbol
  return allowedImageUrl(thesis.asset.logoUrl ?? (own ? thesis.community.avatarUrl : null))
}
