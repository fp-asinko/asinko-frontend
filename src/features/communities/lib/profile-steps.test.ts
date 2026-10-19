// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { profileSteps } from './profile-steps'

type StepProfile = Parameters<typeof profileSteps>[0]

const EMPTY: StepProfile = {
  avatarUrl: null,
  headline: null,
  bio: null,
  city: null,
  countryCode: null,
  links: [],
  openTo: [],
  bannerUrl: null,
}

describe('profileSteps (specs/profile-showcase PS-02)', () => {
  it('lists the eight steps in their order, none done on an empty profile', () => {
    const steps = profileSteps(EMPTY, 0)
    expect(steps.map((step) => step.id)).toEqual([
      'avatar',
      'headline',
      'bio',
      'location',
      'links',
      'openTo',
      'banner',
      'featured',
    ])
    expect(steps.every((step) => !step.done)).toBe(true)
    // Featuring is done from "⋯", not from "Edit profile".
    expect(steps.at(-1)!.field).toBeNull()
  })

  it('marks each part that is there; the location with a city or a country', () => {
    const done = (profile: Partial<StepProfile>, featured = 0) =>
      profileSteps({ ...EMPTY, ...profile }, featured)
        .filter((step) => step.done)
        .map((step) => step.id)
    expect(done({ countryCode: 'AR' })).toEqual(['location'])
    expect(done({ city: 'La Plata' })).toEqual(['location'])
    expect(
      done(
        {
          avatarUrl: '/a.webp',
          headline: 'Macro',
          bio: 'Rates.',
          links: [{ url: 'https://x.com/a', host: 'x.com', site: 'x' }],
          openTo: ['AMAS'],
          bannerUrl: '/b.webp',
        },
        1,
      ),
    ).toEqual(['avatar', 'headline', 'bio', 'links', 'openTo', 'banner', 'featured'])
  })
})
