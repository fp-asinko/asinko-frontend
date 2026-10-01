// VIOLATION boundaries: an atom imports a molecule.
import { SearchField } from '../molecules/search-field'

export function UsesMolecule() {
  return <SearchField />
}
