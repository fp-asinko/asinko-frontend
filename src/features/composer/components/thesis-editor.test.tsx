import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthGateProvider } from '@/components/organisms/auth-gate'
import { renderWithIntl } from '@/test/render-with-intl'
import type { CommunityOption } from '../composer.types'
import { thesisDraftKey } from '../lib/draft-key'
import { thesisDeadlineRange } from '../lib/thesis-deadline'
import { clearDraft, forgetOpenedDraft, writeThesisDraft } from '../hooks/use-thesis-draft'
import { ThesisEditor } from './thesis-editor'

const actions = vi.hoisted(() => ({
  createThesis: vi.fn(),
  getAssetQuote: vi.fn(),
  searchCommunities: vi.fn(),
}))
vi.mock('@/lib/mentions/search-mentions.action', () => ({ searchMentions: vi.fn() }))
vi.mock('@/components/molecules/mention-assist', () => ({ MentionField: () => null }))
vi.mock('../actions/create-thesis.action', () => ({ createThesis: actions.createThesis }))
vi.mock('../actions/asset-quote.action', () => ({ getAssetQuote: actions.getAssetQuote }))
vi.mock('../actions/search-communities.action', () => ({
  searchCommunities: actions.searchCommunities,
}))

const NVDA: CommunityOption = {
  id: '00000000-0000-4000-8000-000000002001',
  slug: 'NVDA',
  handle: '$NVDA',
  name: '$NVDA',
  own: false,
}
const BTC: CommunityOption = {
  id: '00000000-0000-4000-8000-000000002002',
  slug: 'BTC',
  handle: '$BTC',
  name: '$BTC',
  own: false,
}
const MACRO: CommunityOption = {
  id: '00000000-0000-4000-8000-000000002003',
  slug: 'macro',
  handle: '#macro',
  name: 'Macro',
  own: false,
}
const KEY = thesisDraftKey('u1')

function renderEditor({ community = NVDA as CommunityOption | null, signedIn = true } = {}) {
  const onPublished = vi.fn()
  const onFormat = vi.fn()
  const onCommunityChange = vi.fn()
  const draftRef: { current: (() => boolean) | null } = { current: null }
  renderWithIntl(
    <AuthGateProvider signedIn={signedIn}>
      <ThesisEditor
        community={community}
        storageKey={KEY}
        draftRef={draftRef}
        onCancel={vi.fn()}
        onFormat={onFormat}
        onCommunityChange={onCommunityChange}
        onPublished={onPublished}
      />
    </AuthGateProvider>,
  )
  return { onPublished, onFormat, onCommunityChange, draftRef }
}

const claim = () => screen.getByRole('textbox', { name: 'Claim' })
const price = () => screen.getByRole('textbox', { name: 'Target price' })
const deadline = () => screen.getByLabelText('Deadline')
const reasoning = () => screen.getByRole('textbox', { name: 'Reasoning' })
const publish = () => screen.getByRole('button', { name: 'Publish' })

/** Everything but where it goes and the asset, which come from the URL. */
async function fill() {
  await userEvent.type(claim(), 'NVDA closes above 200')
  await userEvent.click(screen.getByRole('radio', { name: 'Above' }))
  await userEvent.type(price(), '200')
  // A date field: jsdom does not type into it as a browser (the e2e does), so its value is set.
  fireEvent.change(deadline(), { target: { value: thesisDeadlineRange(new Date()).min } })
  await userEvent.click(screen.getByRole('radio', { name: 'High' }))
  await userEvent.type(reasoning(), 'Data center demand.')
}

describe('ThesisEditor (specs/thesis-create)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    actions.getAssetQuote.mockResolvedValue({ price: 180, stale: false })
    actions.searchCommunities.mockResolvedValue({ ok: true, data: [NVDA, BTC, MACRO] })
  })
  afterEach(() => {
    clearDraft(KEY)
    forgetOpenedDraft(KEY)
  })

  it('comes with the asset of an asset community, its price, and the claim focused (TC-02, TC-05)', async () => {
    renderEditor()
    expect(screen.getByRole('combobox', { name: 'Asset' })).toHaveTextContent('$NVDA')
    expect(screen.getByRole('tab', { name: 'Thesis' })).toHaveAttribute('aria-selected', 'true')
    expect(claim()).toHaveFocus()
    expect(actions.getAssetQuote).toHaveBeenCalledWith('NVDA')

    await userEvent.click(screen.getByRole('radio', { name: 'Above' }))
    await userEvent.type(price(), '198')
    expect(await screen.findByText(/Current price: 180 · the target is \+10%/)).toBeVisible()

    // Above a price lower than today's: said, not blocked.
    await userEvent.clear(price())
    await userEvent.type(price(), '150')
    expect(screen.getByText(/already on that side/)).toBeVisible()
  })

  it('chooses the asset’s community, unless one was chosen by hand (TC-03)', async () => {
    const { onCommunityChange } = renderEditor({ community: null })
    expect(screen.getByRole('combobox', { name: 'Asset' })).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.click(await screen.findByRole('option', { name: /BTC/ }))
    expect(onCommunityChange).toHaveBeenLastCalledWith(BTC)
    expect(screen.getByRole('combobox', { name: 'Community' })).toHaveTextContent('$BTC')

    screen.getByRole('combobox', { name: 'Community' }).focus()
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.click(await screen.findByRole('option', { name: /#macro/ }))
    screen.getByRole('combobox', { name: 'Asset' }).focus()
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.click(await screen.findByRole('option', { name: /NVDA/ }))
    expect(screen.getByRole('combobox', { name: 'Community' })).toHaveTextContent('#macro')
  })

  it('counts the claim, and says what is missing when Publish is pressed early (TC-04, TC-09)', async () => {
    renderEditor()
    expect(publish()).toHaveAttribute('aria-disabled', 'true')
    await userEvent.type(claim(), 'abc')
    expect(screen.getByText('3/280')).toBeVisible()
    await userEvent.click(publish())
    expect(await screen.findByText('Choose above or below')).toBeVisible()
    expect(screen.getByText('Enter a price above zero')).toBeVisible()
    expect(screen.getByText('Choose a day from tomorrow to 5 years from now')).toBeVisible()
    expect(screen.getByText('Choose your conviction')).toBeVisible()
    expect(screen.getByText('Explain the reasoning')).toBeVisible()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('offers the deadline from tomorrow to 5 years, and the four convictions (TC-06, TC-07)', () => {
    renderEditor()
    const { min, max } = thesisDeadlineRange(new Date())
    expect(deadline()).toHaveAttribute('min', min)
    expect(deadline()).toHaveAttribute('max', max)
    const convictions = screen.getByRole('radiogroup', { name: 'Conviction' })
    for (const name of ['Low', 'Medium', 'High', 'Extreme']) {
      expect(within(convictions).getByRole('radio', { name })).not.toBeChecked()
    }
    expect(screen.getByRole('radiogroup', { name: 'Target' })).toHaveTextContent('AboveBelow')
  })

  it('confirms with the disclaimer, then publishes with the end of the day and goes on (TC-11 to TC-14)', async () => {
    actions.createThesis.mockResolvedValue({ ok: true, data: { username: 'demo' } })
    const { onPublished } = renderEditor()
    await fill()
    expect(publish()).not.toHaveAttribute('aria-disabled')
    await userEvent.click(publish())

    const dialog = await screen.findByRole('dialog', { name: 'Publish thesis' })
    expect(dialog).toHaveTextContent('$NVDA')
    expect(dialog).toHaveTextContent('NVDA closes above 200')
    expect(dialog).toHaveTextContent('can’t be edited or deleted'.replace('’', "'"))
    expect(dialog).toHaveTextContent('Conviction: High')
    const send = within(dialog).getByRole('button', { name: 'Publish thesis' })
    expect(send).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(send)
    expect(actions.createThesis).not.toHaveBeenCalled()

    await userEvent.click(
      within(dialog).getByRole('checkbox', { name: 'I understand this is not financial advice' }),
    )
    await userEvent.click(send)
    const [sent] = actions.createThesis.mock.calls[0]!
    const end = new Date(sent.deadline)
    expect([end.getHours(), end.getMinutes(), end.getSeconds()]).toEqual([23, 59, 59])
    expect(sent).toMatchObject({
      communityId: NVDA.id,
      assetSymbol: 'NVDA',
      direction: 'ABOVE',
      targetPrice: 200,
      conviction: 'HIGH',
      disclaimerAccepted: true,
    })
    expect(onPublished).toHaveBeenCalledWith('demo')
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('puts a field’s error in the field, and the rest in the confirmation (TC-15)', async () => {
    actions.createThesis.mockResolvedValue({
      ok: false,
      error: 'composer.thesis.errors.claimTooLong',
      fieldErrors: { claim: ['composer.thesis.errors.claimTooLong'] },
    })
    renderEditor()
    await fill()
    await userEvent.click(publish())
    let dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('checkbox'))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Publish thesis' }))
    expect(await screen.findByText('Up to 280 characters')).toBeVisible()
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

    actions.createThesis.mockResolvedValue({ ok: false, error: 'api.errors.RATE_LIMITED' })
    await userEvent.clear(claim())
    await userEvent.type(claim(), 'Shorter')
    await userEvent.click(publish())
    dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('checkbox'))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Publish thesis' }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Wait a moment before publishing again',
    )
  })

  it('goes back to the post’s formats from the tabs (TC-01)', async () => {
    const { onFormat } = renderEditor()
    await userEvent.click(screen.getByRole('tab', { name: 'Image' }))
    expect(onFormat).toHaveBeenCalledWith('IMAGE')
  })

  it('keeps what is written in the browser, and offers it back (TC-10)', async () => {
    const { draftRef } = renderEditor()
    expect(draftRef.current?.()).toBe(false)
    await userEvent.type(claim(), 'Kept')
    expect(draftRef.current?.()).toBe(true)
    await vi.waitFor(() =>
      expect(JSON.parse(localStorage.getItem(KEY) ?? '{}')).toMatchObject({ claim: 'Kept' }),
    )
  })

  it('recovers a draft from before, with its asset and community', async () => {
    writeThesisDraft(KEY, {
      community: MACRO,
      asset: BTC,
      claim: 'From yesterday',
      direction: 'BELOW',
      targetPrice: '50000',
      deadline: '',
      conviction: '',
      reasoning: '',
      savedAt: Date.now() - 60_000,
    })
    renderEditor({ community: null })
    await userEvent.click(await screen.findByRole('button', { name: 'Recover' }))
    expect(claim()).toHaveValue('From yesterday')
    expect(price()).toHaveValue('50000')
    expect(screen.getByRole('radio', { name: 'Below' })).toBeChecked()
    expect(screen.getByRole('combobox', { name: 'Asset' })).toHaveTextContent('$BTC')
    expect(screen.getByRole('combobox', { name: 'Community' })).toHaveTextContent('#macro')
  })
})
