import { describe, expect, it } from 'vitest'
import { glossaryTermSchema } from '@/lib/api/contract'
import { GLOSSARY, randomGlossary } from './glossary'

describe('glossary fixtures', () => {
  it('has the PO 15 terms, each one valid for the contract (GL-03)', () => {
    expect(GLOSSARY).toHaveLength(15)
    for (const term of GLOSSARY) expect(glossaryTermSchema.safeParse(term).success).toBe(true)
    expect(new Set(GLOSSARY.map((term) => term.category))).toEqual(
      new Set(['Trading', 'Macro and bonds']),
    )
  })

  it('picks at random, never the same term twice in a row (GL-03)', () => {
    // Always the first option: without the rule, the same term every time.
    const picked = randomGlossary(4, () => 0)
    expect(picked).toHaveLength(4)
    for (let i = 1; i < picked.length; i++) expect(picked[i]!.id).not.toBe(picked[i - 1]!.id)
  })
})
