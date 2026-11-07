// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createGroupSchema } from './create-group.schema'

const valid = {
  name: 'Options Flow',
  slug: 'options-flow',
  description: '',
  rules: '',
  mainUrl: '',
}
const errorsOf = (input: Record<string, unknown>) => {
  const result = createGroupSchema.safeParse({ ...valid, ...input })
  return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

describe('createGroupSchema (specs/community-create CG-03, CG-04)', () => {
  it('takes a group with only its name and handle, leaving the empty optionals out', () => {
    expect(createGroupSchema.parse({ ...valid, name: '  Options Flow ' })).toEqual({
      name: 'Options Flow',
      slug: 'options-flow',
      description: undefined,
      rules: undefined,
      mainUrl: undefined,
    })
  })

  it('asks for a name of 3 to 50 characters, trimmed', () => {
    expect(errorsOf({ name: '  ab ' })).toEqual(['createGroup.errors.nameLength'])
    expect(errorsOf({ name: 'abc' })).toEqual([])
    expect(errorsOf({ name: 'a'.repeat(50) })).toEqual([])
    expect(errorsOf({ name: 'a'.repeat(51) })).toEqual(['createGroup.errors.nameLength'])
  })

  it('asks for a handle of 3 to 30 lowercase letters, digits and single inner hyphens', () => {
    for (const slug of ['abc', 'a-b-c', 'x12', 'a'.repeat(30)]) {
      expect(errorsOf({ slug })).toEqual([])
    }
    for (const slug of ['ab', 'a'.repeat(31), 'Upper', 'a--b', '-ab', 'ab-', 'a b', 'añb']) {
      expect(errorsOf({ slug })).toContain('createGroup.errors.slugFormat')
    }
  })

  it('limits the description to 500 and the rules to 2000', () => {
    expect(errorsOf({ description: 'a'.repeat(500), rules: 'a'.repeat(2000) })).toEqual([])
    expect(errorsOf({ description: 'a'.repeat(501) })).toEqual([
      'createGroup.errors.descriptionMax',
    ])
    expect(errorsOf({ rules: 'a'.repeat(2001) })).toEqual(['createGroup.errors.rulesMax'])
  })

  it('takes only an http(s) link of up to 300 characters', () => {
    expect(errorsOf({ mainUrl: 'https://example.com' })).toEqual([])
    expect(errorsOf({ mainUrl: 'javascript:alert(1)' })).toEqual(['createGroup.errors.url'])
    expect(errorsOf({ mainUrl: 'not a url' })).toEqual(['createGroup.errors.url'])
    expect(errorsOf({ mainUrl: `https://example.com/${'a'.repeat(290)}` })).toContain(
      'createGroup.errors.url',
    )
  })
})
