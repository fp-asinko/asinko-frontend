// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { thesisAgreementSchema } from '@/lib/api/contract'
import { DEMO_USER } from './demo-user'
import { THESES } from './fixtures/theses'
import {
  agreementOf,
  answerMockThesis,
  extendWithAgreement,
  unanswerMockThesis,
} from './thesis-agreement'
import type { MockContext } from './types'

// Someone else's open thesis, and the demo user as the caller (no token: the demo user).
const open = THESES.find((each) => each.state === 'OPEN' && each.creator?.id !== DEMO_USER.id)!
const closed = THESES.find((each) => each.state === 'CORRECT')!

const context = (id: string, rest: Partial<MockContext> = {}): MockContext => ({
  params: { id },
  query: {},
  body: undefined,
  ...rest,
})
const answer = (id: string, value: unknown, userId: unknown = DEMO_USER.id) =>
  answerMockThesis(context(id, { body: { userId, value } }))

describe('"Do you agree?" mock (P-043, specs/thesis-agree)', () => {
  it('answers, changes and takes back the answer, with the counts', () => {
    const before = agreementOf(open.id, DEMO_USER.id, open)
    expect(before).toMatchObject({ viewerVote: null, canVote: true })

    const yes = answer(open.id, 'YES')
    expect(yes.status).toBe(200)
    expect(thesisAgreementSchema.parse(yes.body)).toEqual({
      yes: before.yes + 1,
      no: before.no,
      viewerVote: 'YES',
      canVote: true,
    })

    // Changing it moves the count, it does not add a second answer (AG-05).
    expect(answer(open.id, 'NO').body).toMatchObject({ yes: before.yes, no: before.no + 1 })

    const removed = unanswerMockThesis(context(open.id, { query: { userId: DEMO_USER.id } }))
    expect(removed.body).toEqual({ ...before })
  })

  it('refuses its author, a closed thesis, another userId and an unknown answer', () => {
    const own = `mock-access.${open.creator!.id}.example`
    const byAuthor = answerMockThesis(
      context(open.id, { body: { userId: open.creator!.id, value: 'YES' }, accessToken: own }),
    )
    expect(byAuthor).toMatchObject({ status: 403, body: { error: { code: 'OWN_THESIS' } } })
    expect(answer(closed.id, 'YES')).toMatchObject({
      status: 409,
      body: { error: { code: 'THESIS_CLOSED' } },
    })
    expect(answer(open.id, 'YES', 'someone-else').status).toBe(403)
    expect(answer(open.id, 'MAYBE').status).toBe(422)
  })

  it('says who cannot answer: its author, and anyone once closed (AG-02, AG-07)', () => {
    expect(agreementOf(open.id, open.creator!.id, open).canVote).toBe(false)
    expect(agreementOf(closed.id, DEMO_USER.id, closed).canVote).toBe(false)
  })

  it("adds it to the backend's theses, in a feed and on a thesis's page (API_MOCKS=missing)", () => {
    const { agreement: _, ...raw } = open
    const feed = extendWithAgreement(
      { status: 200, body: { items: [{ kind: 'THESIS', content: raw }, { kind: 'POST' }] } },
      context(''),
    ).body as { items: Array<{ content?: { agreement?: unknown } }> }
    expect(thesisAgreementSchema.safeParse(feed.items[0]!.content!.agreement).success).toBe(true)
    expect(feed.items[1]).toEqual({ kind: 'POST' })

    const page = extendWithAgreement({ status: 200, body: raw }, context(open.id)).body
    expect(page).toHaveProperty('agreement')
    // An error goes as it came.
    const failed = { status: 404, body: { error: { code: 'NOT_FOUND', message: '' } } }
    expect(extendWithAgreement(failed, context(open.id))).toBe(failed)
  })
})
