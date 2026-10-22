// @vitest-environment node
import { describe, expect, it } from 'vitest'
import pkg from '../../package.json'
import { APP_VERSION } from './app-version'

describe('APP_VERSION', () => {
  it("is package.json's, as semver", () => {
    expect(APP_VERSION).toBe(pkg.version)
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+/)
  })
})
