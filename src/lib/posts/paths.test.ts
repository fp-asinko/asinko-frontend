// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { postPath, postSlug } from './paths'

describe('post paths (specs/post-create-detail § 1)', () => {
  it('turns a title into a readable slug, without accents nor symbols', () => {
    expect(postSlug('¿Dónde cierra Bitcoin a fin de año?')).toBe(
      'donde-cierra-bitcoin-a-fin-de-ano',
    )
    expect(postSlug('Whales accumulated 48,000 $BTC in two weeks')).toBe(
      'whales-accumulated-48-000-btc-in-two-weeks',
    )
    expect(postSlug('Ação: o que vem pela frente')).toBe('acao-o-que-vem-pela-frente')
  })

  it('cuts at a word near 60 characters', () => {
    const slug = postSlug(
      'This is a rather long title about how central banks keep surprising the market every quarter',
    )
    expect(slug.length).toBeLessThanOrEqual(60)
    expect(slug.endsWith('-')).toBe(false)
    expect(slug).toBe('this-is-a-rather-long-title-about-how-central-banks-keep')
  })

  it('cuts a single word longer than the limit, and names an empty slug "post"', () => {
    expect(postSlug('a'.repeat(80))).toHaveLength(60)
    expect(postSlug('🚀🚀🚀')).toBe('post')
  })

  it('builds /post/{id}/{slug}', () => {
    expect(postPath('abc-123', 'Hello world')).toBe('/post/abc-123/hello-world')
  })
})
