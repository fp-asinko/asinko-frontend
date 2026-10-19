// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { toWidgetLink } from './widget-link'

describe('toWidgetLink (specs/community-widgets CW-07)', () => {
  it('takes a page of the site as is', () => {
    expect(toWidgetLink('/hub/defi')).toEqual({ url: '/hub/defi', external: false, host: null })
  })

  it('takes http(s) with its real host', () => {
    expect(toWidgetLink(' https://www.dune.com/x ')).toEqual({
      url: 'https://www.dune.com/x',
      external: true,
      host: 'dune.com',
    })
  })

  it('drops anything else', () => {
    for (const bad of [
      'javascript:alert(1)',
      'data:text/html,x',
      '//evil.com',
      'not a url',
      '',
      null,
    ]) {
      expect(toWidgetLink(bad)).toBeNull()
    }
  })
})
