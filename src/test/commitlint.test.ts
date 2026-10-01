// @vitest-environment node
import lint from '@commitlint/lint'
import conventional from '@commitlint/config-conventional'
import { describe, expect, it } from 'vitest'
import projectConfig from '../../commitlint.config.mjs'

// F-06: commits that do not follow Conventional Commits (with the project's types) are rejected.
const rules = { ...conventional.rules, ...projectConfig.rules }

async function isValid(message: string) {
  const { valid } = await lint(message, rules)
  return valid
}

describe('commitlint config', () => {
  it.each([
    'feat(home): add feed',
    'fix(seo): correct canonical URL',
    'chore(foundation): scaffold project',
    'docs: update guidelines',
  ])('accepts "%s"', async (message) => {
    expect(await isValid(message)).toBe(true)
  })

  it.each([
    'agregué cosas',
    'feature(home): add feed',
    'build: bump deps',
    'feat(home): Add feed.',
  ])('rejects "%s"', async (message) => {
    expect(await isValid(message)).toBe(false)
  })
})
