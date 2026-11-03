// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { thesisPath } from './paths'

describe('thesisPath (specs/thesis-detail Q1)', () => {
  it('is /thesis/{id} in every locale', () => {
    expect(thesisPath('50b1c46f-c1e5-4bcb-9ee8-42ce84cebb39')).toBe(
      '/thesis/50b1c46f-c1e5-4bcb-9ee8-42ce84cebb39',
    )
  })
})
