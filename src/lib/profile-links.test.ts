// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { isHttpUrl, toProfileLink } from './profile-links'

describe('toProfileLink (specs/profile-presentation PP-03)', () => {
  it('knows each site, by host or subdomain, without www', () => {
    const site = (url: string) => toProfileLink(url)?.site
    expect(site('https://x.com/maria')).toBe('x')
    expect(site('https://twitter.com/maria')).toBe('x')
    expect(site('https://www.linkedin.com/in/maria')).toBe('linkedin')
    expect(site('https://youtu.be/abc')).toBe('youtube')
    expect(site('https://m.youtube.com/@maria')).toBe('youtube')
    expect(site('https://instagram.com/maria')).toBe('instagram')
    expect(site('https://github.com/maria')).toBe('github')
    expect(site('https://maria.substack.com')).toBe('substack')
    expect(site('https://www.tradingview.com/u/maria')).toBe('tradingview')
    expect(site('https://dune.com/maria')).toBe('web')
  })

  it('shows the real host, so a link cannot pass for another', () => {
    expect(toProfileLink(' https://WWW.Example.com/x ')).toEqual({
      url: 'https://WWW.Example.com/x',
      host: 'example.com',
      site: 'web',
    })
    expect(toProfileLink('https://x.com.evil.io/maria')).toMatchObject({
      host: 'x.com.evil.io',
      site: 'web',
    })
    expect(toProfileLink('https://notx.com')).toMatchObject({ site: 'web' })
  })

  it('takes only http(s) links', () => {
    for (const bad of ['javascript:alert(1)', 'data:text/html,x', 'ftp://a.com', 'x.com', '']) {
      expect(toProfileLink(bad)).toBeNull()
      expect(isHttpUrl(bad)).toBe(false)
    }
    expect(isHttpUrl('http://a.com')).toBe(true)
  })
})
