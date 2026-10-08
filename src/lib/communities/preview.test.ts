// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { previewProps, readPreviewTarget } from './preview'

describe('preview target (specs/mention-preview § 1)', () => {
  it('writes and reads back each kind', () => {
    for (const kind of ['group', 'asset', 'user'] as const) {
      const value = previewProps(kind, 'BTC_1-x')['data-preview']
      expect(readPreviewTarget(value)).toEqual({ kind, slug: 'BTC_1-x' })
    }
  })

  it('reads nothing from a missing, unknown or unsafe value', () => {
    for (const value of [null, undefined, '', 'post:1', 'group:', 'group:a/b', 'user:../x']) {
      expect(readPreviewTarget(value)).toBeNull()
    }
    expect(readPreviewTarget(`group:${'a'.repeat(65)}`)).toBeNull()
  })
})
