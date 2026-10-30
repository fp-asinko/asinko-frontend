// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { downloadGooglePhoto, GOOGLE_PHOTO_MAX_BYTES, googlePhotoUrl } from './google-photo'

const PHOTO = 'https://lh3.googleusercontent.com/a/ACg8ocK=s96-c'

const answering = (body: BodyInit | null, type = 'image/jpeg', status = 200) =>
  vi.fn(async () => new Response(body, { status, headers: { 'Content-Type': type } }))

describe('googlePhotoUrl (specs/auth design.md § 15)', () => {
  it('asks a Google photo at 400 px', () => {
    expect(googlePhotoUrl(PHOTO)).toBe('https://lh3.googleusercontent.com/a/ACg8ocK=s400-c')
    expect(googlePhotoUrl('https://lh3.googleusercontent.com/a/x')).toBe(
      'https://lh3.googleusercontent.com/a/x',
    )
  })

  it('refuses anything that is not a Google photo host over https (no SSRF)', () => {
    for (const url of [
      null,
      '',
      'not a url',
      'http://lh3.googleusercontent.com/a/x',
      'https://googleusercontent.com.evil.example/a',
      'https://evil.example/lh3.googleusercontent.com',
      'https://169.254.169.254/latest',
      'https://user:pass@lh3.googleusercontent.com/a',
      'https://lh3.googleusercontent.com:8443/a',
    ]) {
      expect(googlePhotoUrl(url)).toBeNull()
    }
  })
})

describe('downloadGooglePhoto', () => {
  it('gives the bytes and the type, without following redirects', async () => {
    const fetchImpl = answering(new Uint8Array([1, 2, 3]))
    expect(await downloadGooglePhoto(PHOTO, fetchImpl, 1000)).toEqual({
      type: 'image/jpeg',
      base64: 'AQID',
    })
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://lh3.googleusercontent.com/a/ACg8ocK=s400-c',
      expect.objectContaining({ redirect: 'error' }),
    )
  })

  it('never asks another host', async () => {
    const fetchImpl = answering(new Uint8Array([1]))
    expect(await downloadGooglePhoto('https://evil.example/a.jpg', fetchImpl, 1000)).toBeNull()
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('gives nothing for an error, another type, an empty or too big body, or a network failure', async () => {
    const big = new Uint8Array(GOOGLE_PHOTO_MAX_BYTES + 1)
    for (const fetchImpl of [
      answering(new Uint8Array([1]), 'image/jpeg', 404),
      answering('<svg/>', 'image/svg+xml'),
      answering(new Uint8Array()),
      answering(big),
      vi.fn(async () => Promise.reject(new TypeError('network'))),
    ]) {
      expect(await downloadGooglePhoto(PHOTO, fetchImpl, 1000)).toBeNull()
    }
  })
})
