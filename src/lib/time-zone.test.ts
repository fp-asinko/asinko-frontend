// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { validTimeZone } from './time-zone'

describe('validTimeZone (specs/local-time LT-02)', () => {
  it('takes an IANA zone, by its canonical name', () => {
    expect(validTimeZone('America/Santiago')).toBe('America/Santiago')
    expect(validTimeZone('Europe/Madrid')).toBe('Europe/Madrid')
    expect(validTimeZone('UTC')).toBe('UTC')
  })

  it('refuses nothing, unknown zones, odd characters and long values', () => {
    expect(validTimeZone(undefined)).toBeNull()
    expect(validTimeZone('')).toBeNull()
    expect(validTimeZone('Mars/Olympus')).toBeNull()
    expect(validTimeZone('America/Santiago;x=1')).toBeNull()
    expect(validTimeZone(`A/${'b'.repeat(70)}`)).toBeNull()
  })
})
