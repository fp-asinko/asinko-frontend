// VIOLATION boundaries: components/ imports features/.
import { home } from '../../features/home'

export function UsesFeature() {
  return <p>{home}</p>
}
