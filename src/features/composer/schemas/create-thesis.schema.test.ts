// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { CLAIM_MAX, createThesisSchema, thesisFormSchema } from './create-thesis.schema'

const form = {
  communityId: '00000000-0000-4000-8000-000000001001',
  assetSymbol: 'NVDA',
  claim: ' $NVDA closes above 200 ',
  direction: 'ABOVE',
  targetPrice: '200',
  deadline: '2026-12-31',
  conviction: 'HIGH',
  reasoning: ' Data center demand. ',
}
const input = { ...form, deadline: '2027-01-01T02:59:59.000Z', disclaimerAccepted: true }

function errors(schema: typeof thesisFormSchema | typeof createThesisSchema, value: unknown) {
  const result = schema.safeParse(value)
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((i) => [i.path[0], i.message]))
}

describe('thesisFormSchema (specs/thesis-create § 4)', () => {
  it('trims the texts and reads the price as a number', () => {
    expect(thesisFormSchema.parse(form)).toEqual({
      ...form,
      claim: '$NVDA closes above 200',
      reasoning: 'Data center demand.',
      targetPrice: 200,
    })
  })

  it('takes a comma as the decimal point', () => {
    expect(thesisFormSchema.parse({ ...form, targetPrice: ' 182,40 ' }).targetPrice).toBe(182.4)
  })

  it('says what is missing, each in its field (TC-09)', () => {
    expect(
      errors(thesisFormSchema, {
        ...form,
        communityId: '',
        assetSymbol: '',
        claim: '  ',
        direction: '',
        targetPrice: '',
        deadline: '',
        conviction: '',
        reasoning: ' ',
      }),
    ).toEqual({
      communityId: 'composer.errors.community',
      assetSymbol: 'composer.thesis.errors.asset',
      claim: 'composer.thesis.errors.claimRequired',
      direction: 'composer.thesis.errors.direction',
      targetPrice: 'composer.thesis.errors.targetPrice',
      deadline: 'composer.thesis.errors.deadline',
      conviction: 'composer.thesis.errors.conviction',
      reasoning: 'composer.thesis.errors.reasoningRequired',
    })
  })

  it(`allows ${CLAIM_MAX} characters in the claim, not one more (TC-04)`, () => {
    expect(errors(thesisFormSchema, { ...form, claim: 'a'.repeat(CLAIM_MAX) })).toEqual({})
    expect(errors(thesisFormSchema, { ...form, claim: 'a'.repeat(CLAIM_MAX + 1) })).toEqual({
      claim: 'composer.thesis.errors.claimTooLong',
    })
  })

  it('takes only a price above zero (TC-05)', () => {
    for (const targetPrice of ['0', '-5', 'abc', '1.234,56', 'Infinity']) {
      expect(errors(thesisFormSchema, { ...form, targetPrice })).toEqual({
        targetPrice: 'composer.thesis.errors.targetPrice',
      })
    }
  })

  it('offers no EQUALS (Q3) and only the four convictions (TC-07)', () => {
    expect(errors(thesisFormSchema, { ...form, direction: 'EQUALS' })).toHaveProperty('direction')
    expect(errors(thesisFormSchema, { ...form, conviction: 'TOTAL' })).toHaveProperty('conviction')
  })

  it('refuses a symbol outside the catalog shape', () => {
    expect(errors(thesisFormSchema, { ...form, assetSymbol: '../x' })).toEqual({
      assetSymbol: 'composer.thesis.errors.asset',
    })
  })
})

describe('createThesisSchema (TC-12, TC-13)', () => {
  it('takes the deadline as an instant and the disclaimer accepted', () => {
    expect(createThesisSchema.parse(input)).toMatchObject({
      deadline: input.deadline,
      disclaimerAccepted: true,
      targetPrice: 200,
    })
  })

  it('refuses a day instead of an instant, and the disclaimer not accepted', () => {
    expect(
      errors(createThesisSchema, { ...input, deadline: '2026-12-31', disclaimerAccepted: false }),
    ).toEqual({
      deadline: 'composer.thesis.errors.deadline',
      disclaimerAccepted: 'composer.thesis.errors.disclaimer',
    })
  })
})
