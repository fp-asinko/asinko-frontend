// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { allowedImageUrl } from './images'

describe('allowedImageUrl (security.md § 6)', () => {
  it('keeps same-site paths', () => {
    expect(allowedImageUrl('/mocks/chart.svg')).toBe('/mocks/chart.svg')
  })

  it('drops hosts that are not allowed, so next/image never throws on them', () => {
    expect(allowedImageUrl('https://placehold.co/800x450?text=chart')).toBeNull()
    expect(allowedImageUrl('https://evil.example/x.png')).toBeNull()
  })

  it('drops protocol-relative, insecure and malformed URLs', () => {
    expect(allowedImageUrl('//evil.example/x.png')).toBeNull()
    expect(allowedImageUrl('http://evil.example/x.png')).toBeNull()
    expect(allowedImageUrl('not a url')).toBeNull()
    expect(allowedImageUrl(null)).toBeNull()
  })

  it("keeps public objects of the backend's Supabase Storage, and nothing else of that project", () => {
    const storage = 'https://hqarefesoovfmibncivu.supabase.co'
    const avatar = `${storage}/storage/v1/object/public/avatars/seed/john.png`
    expect(allowedImageUrl(avatar)).toBe(avatar)
    expect(allowedImageUrl(`${storage}/storage/v1/object/sign/avatars/x.png`)).toBeNull()
    expect(allowedImageUrl(`${storage}/rest/v1/profiles`)).toBeNull()
  })
})
