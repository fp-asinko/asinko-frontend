import { describe, expect, it } from 'vitest'
import { buildRobots, isIndexable } from './robots'

const SITE = 'https://asinko.example'

describe('buildRobots (F-31)', () => {
  it.each(['development', 'preview'] as const)('disallows everything in %s', (appEnv) => {
    expect(buildRobots(appEnv, SITE)).toEqual({ rules: { userAgent: '*', disallow: '/' } })
    expect(isIndexable(appEnv)).toBe(false)
  })

  it('allows crawling and points to the sitemap in production', () => {
    expect(buildRobots('production', SITE)).toEqual({
      rules: { userAgent: '*', allow: '/' },
      sitemap: 'https://asinko.example/sitemap.xml',
    })
    expect(isIndexable('production')).toBe(true)
  })
})
