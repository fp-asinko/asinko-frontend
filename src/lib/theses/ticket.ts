import type { RawThesis } from '@/lib/api/contract'
import { communityPath } from '@/lib/communities/paths'
import { thesisAssetLogo } from './asset-logo'
import type { ThesisTicketData, ThesisTicketState } from './ticket.types'

const CONVICTION = { LOW: 1, MEDIUM: 2, HIGH: 3, EXTREME: 4 } as const

/**
 * What a thesis's ticket draws, from the backend's thesis (specs/thesis-ticket § 4): the same in a
 * feed, on its page and in a person's theses.
 */
export function toThesisTicket(thesis: RawThesis): ThesisTicketData {
  const resolved = thesis.state === 'CORRECT' || thesis.state === 'INCORRECT'
  return {
    id: thesis.id,
    asset: thesis.asset
      ? {
          symbol: thesis.asset.symbol,
          name: thesis.asset.name,
          path: communityPath('asset', thesis.asset.symbol),
          logoUrl: thesisAssetLogo(thesis),
        }
      : null,
    target:
      thesis.targetDirection && thesis.targetPrice !== null
        ? {
            direction: thesis.targetDirection.toLowerCase() as 'above' | 'below' | 'equals',
            price: thesis.targetPrice,
          }
        : null,
    reference:
      thesis.referencePrice !== null
        ? { price: thesis.referencePrice, at: thesis.referencePriceAt }
        : null,
    deadline: thesis.deadline,
    conviction: CONVICTION[thesis.conviction],
    state: thesis.state.toLowerCase() as ThesisTicketState,
    resolution:
      resolved && thesis.resolvedAt
        ? {
            price: thesis.resolutionPrice,
            at: thesis.resolvedAt,
            source: (thesis.resolutionSource?.toLowerCase() ?? null) as NonNullable<
              ThesisTicketData['resolution']
            >['source'],
          }
        : null,
    cancellation:
      thesis.state === 'CANCELLED' && thesis.cancelledAt
        ? { at: thesis.cancelledAt, reason: thesis.cancellationReason?.trim() || null }
        : null,
  }
}
