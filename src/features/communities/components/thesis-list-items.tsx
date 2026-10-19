import type { ThesisItem } from '../communities.types'
import { ThesisCard } from './thesis-card'

/**
 * A page of theses as list items: the first page and each one "Load more" brings. Each offers "⋯"
 * to feature it, which only draws on your own profile (specs/profile-showcase PS-07).
 */
export function ThesisListItems({ theses }: { theses: ThesisItem[] }) {
  return theses.map((thesis) => (
    <li key={thesis.id}>
      <ThesisCard thesis={thesis} menu />
    </li>
  ))
}
