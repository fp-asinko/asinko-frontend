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
  saveDraft: vi.fn(),
  listDrafts: vi.fn(),
  deleteDraft: vi.fn(),
}))
vi.mock('../actions/drafts.action', () => ({
  saveDraft: actions.saveDraft,
  listDrafts: actions.listDrafts,
  deleteDraft: actions.deleteDraft,
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

function renderEditor({
  community = NVDA as CommunityOption | null,
  signedIn = true,
  draftsReady = true,
} = {}) {
  const onPublished = vi.fn()
  const onFormat = vi.fn()
  const onCommunityChange = vi.fn()
  const draftRef: { current: (() => boolean) | null } = { current: null }
  renderWithIntl(
    <AuthGateProvider signedIn={signedIn}>
      <ThesisEditor
        community={community}
        storageKey={KEY}
        draftsReady={draftsReady}
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

const claim = () => screen.getByRole('textbox', { name: /Claim$/ })
const price = () => screen.getByRole('textbox', { name: /Target price$/ })
const deadline = () => screen.getByLabelText('Deadline date', { selector: 'input' })
const reasoning = () => screen.getByRole('textbox', { name: /Reasoning$/ })
const publish = () => screen.getByRole('button', { name: 'Publish' })

/** Everything but where it goes and the asset, which come from the URL. */
async function fill() {
  await userEvent.type(claim(), 'NVDA closes above 200')
  // Above the current price (180): the direction comes from it (TC-24).
  await userEvent.type(price(), '200')
  // A shortcut: the most common way to set it (TC-33).
  await userEvent.click(screen.getByRole('radio', { name: '3 months' }))
  await userEvent.click(screen.getByRole('radio', { name: 'High' }))
  await userEvent.type(reasoning(), 'Data center demand.')
}

describe('ThesisEditor (specs/thesis-create)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    actions.getAssetQuote.mockResolvedValue({
      name: 'NVIDIA',
      price: 180,
      changePct: 2.14,
      stale: false,
    })
    actions.searchCommunities.mockResolvedValue({ ok: true, data: [NVDA, BTC, MACRO] })
  })
  afterEach(() => {
    clearDraft(KEY)
    forgetOpenedDraft(KEY)
  })

  it('comes with the asset of an asset community and its card, and the next step focused: the deadline (TC-02, TC-22; claim fifth since PO 2026-11-05)', async () => {
    renderEditor()
    expect(screen.getByRole('group', { name: /Asset$/ })).toHaveTextContent('$NVDA')
    expect(screen.getByRole('tab', { name: 'Thesis' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('radio', { name: '1 month' })).toHaveFocus()
    expect(actions.getAssetQuote).toHaveBeenCalledWith('NVDA')
    // The card: name, price and the day, with its arrow (spoken, not only colored).
    expect(await screen.findByText('NVIDIA')).toBeVisible()
    expect(screen.getByText('180')).toBeVisible()
    expect(screen.getByText('2.14%')).toBeVisible()
    // The claim's example, with the asset and a target half again its price.
    expect(claim()).toHaveAttribute('placeholder', 'e.g. NVDA > 270 before the deadline')
  })

  it('keeps the day in its color when the price is out of date, and says so beside it (TC-29)', async () => {
    actions.getAssetQuote.mockResolvedValue({
      name: 'NVIDIA',
      price: 180,
      changePct: -0.4,
      stale: true,
    })
    renderEditor()
    expect(await screen.findByText('0.4%')).toBeVisible()
    expect(screen.getByText(/out of date/)).toBeVisible()
    // The logo's place: the asset's initials while it has no image.
    expect(
      screen.getByRole('group', { name: /Asset$/ }).querySelector('[data-testid="user-avatar"]'),
    ).toHaveTextContent('NV')
  })

  it('takes the direction from the target, and refuses the current price itself (TC-24)', async () => {
    renderEditor()
    await screen.findByText('NVIDIA')
    expect(screen.queryByRole('radiogroup', { name: 'Target' })).toBeNull()
    await userEvent.type(price(), '198')
    // The arrow and the change in green up, red down; the change on its white pill, as it sits on
    // the filled field (PO, 2026-11-05 and 2026-11-06).
    const said = (text: string) =>
      screen.getByText(
        (_, node) => node?.id.endsWith('-direction-said') === true && node.textContent === text,
      )
    expect(said('Above the current price · +10%').querySelector('svg')).toHaveClass('text-bullish')
    expect(screen.getByText('+10%')).toHaveClass('text-bullish')
    await userEvent.clear(price())
    await userEvent.type(price(), '150')
    expect(said('Below the current price · -16.7%').querySelector('svg')).toHaveClass(
      'text-bearish',
    )
    expect(screen.getByText('-16.7%')).toHaveClass('text-bearish')
    await userEvent.clear(price())
    await userEvent.type(price(), '180')
    expect(
      screen.getByText('The target can’t be the current price'.replace('’', "'")),
    ).toBeVisible()
  })

  it('chooses the direction by hand when the price cannot be read (TC-24)', async () => {
    actions.getAssetQuote.mockResolvedValue(null)
    renderEditor()
    const target = await screen.findByRole('radiogroup', { name: 'Target' })
    await userEvent.click(within(target).getByRole('radio', { name: 'Below' }))
    expect(within(target).getByRole('radio', { name: 'Below' })).toBeChecked()
  })

  it('fills the conviction bars up to the chosen one, and names it (TC-25)', async () => {
    renderEditor()
    expect(screen.getAllByText('Choose your conviction')[0]).toBeVisible()
    await userEvent.click(screen.getByRole('radio', { name: 'Extreme' }))
    expect(screen.getByRole('radio', { name: 'Extreme' })).toBeChecked()
    expect(screen.getByText('Extreme', { selector: 'span' })).toBeVisible()
  })

  it('numbers the six steps, and marks each one done (specs/thesis-form-steps FS-08, FS-09)', async () => {
    renderEditor()
    expect(screen.getByRole('group', { name: 'Step 1 of 6, done: Asset' })).toBeInTheDocument()
    expect(claim()).toHaveAccessibleName('Step 5 of 6: Claim')
    expect(reasoning()).toHaveAccessibleName('Step 6 of 6: Reasoning')
    // The claim right above the reasoning, with what it is for beside its label (PO, 2026-11-05).
    expect(claim()).toHaveAccessibleDescription(/^The main reason, in one sentence/)
    expect(claim().compareDocumentPosition(reasoning())).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(price().compareDocumentPosition(claim())).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    await fill()
    expect(claim()).toHaveAccessibleName('Step 5 of 6, done: Claim')
    expect(price()).toHaveAccessibleName('Step 3 of 6, done: Target price')
    expect(screen.getByRole('radiogroup', { name: 'Step 2 of 6, done: Deadline' })).toBeVisible()
    expect(screen.getByRole('radiogroup', { name: 'Step 4 of 6, done: Conviction' })).toBeVisible()
    expect(reasoning()).toHaveAccessibleName('Step 6 of 6, done: Reasoning')
  })

  it('chooses the asset’s community, unless one was chosen by hand (TC-03)', async () => {
    const { onCommunityChange } = renderEditor({ community: null })
    expect(screen.getByRole('combobox', { name: /Asset$/ })).toHaveFocus()
    // A search (specs/thesis-form-steps FS-01): typing lists the matches.
    await userEvent.keyboard('btc')
    await userEvent.click(await screen.findByRole('option', { name: /BTC/ }))
    expect(onCommunityChange).toHaveBeenLastCalledWith(BTC)
    expect(screen.getByRole('combobox', { name: 'Publishing in' })).toHaveTextContent('$BTC')

    screen.getByRole('combobox', { name: 'Publishing in' }).focus()
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.click(await screen.findByRole('option', { name: /#macro/ }))
    // × changes it (FS-02): the search comes back, focused.
    await userEvent.click(screen.getByRole('button', { name: 'Change $BTC' }))
    expect(screen.getByRole('combobox', { name: /Asset$/ })).toHaveFocus()
    await userEvent.keyboard('nvda')
    await userEvent.click(await screen.findByRole('option', { name: /NVDA/ }))
    expect(screen.getByRole('combobox', { name: 'Publishing in' })).toHaveTextContent('#macro')
  })

  it('keeps the group it was started in when the asset is chosen (TC-03)', async () => {
    renderEditor({ community: MACRO })
    await userEvent.keyboard('btc')
    await userEvent.click(await screen.findByRole('option', { name: /BTC/ }))
    expect(screen.getByRole('combobox', { name: 'Publishing in' })).toHaveTextContent('#macro')
  })

  it('says Save draft is coming soon until the backend has thesis drafts (P-038)', async () => {
    renderEditor({ draftsReady: false })
    await userEvent.type(claim(), 'Kept in the browser')
    const save = screen.getByRole('button', { name: 'Save draft' })
    expect(save).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(save)
    expect(screen.getByText('Coming soon')).toHaveAttribute('role', 'status')
    expect(actions.saveDraft).not.toHaveBeenCalled()
  })

  it('counts the claim, and says what is missing when Publish is pressed early (TC-04, TC-09)', async () => {
    renderEditor()
    expect(publish()).toHaveAttribute('aria-disabled', 'true')
    await userEvent.type(claim(), 'abc')
    expect(screen.getByText('3/280')).toBeVisible()
    await userEvent.click(publish())
    expect(await screen.findByText('Enter a price above zero')).toBeVisible()
    expect(screen.getByText('Choose a day from tomorrow to 5 years from now')).toBeVisible()
    // The bars' name and the error say it.
    expect(screen.getAllByText('Choose your conviction')).toHaveLength(2)
    expect(screen.getByText('Explain the reasoning')).toBeVisible()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('offers the deadline from tomorrow to 5 years, and the four convictions (TC-06, TC-07, TC-33)', async () => {
    renderEditor()
    // The shortcuts, and "Other date" opens the calendar with the backend's range (TC-33).
    const shortcuts = screen.getByRole('radiogroup', { name: /Deadline$/ })
    for (const name of ['1 month', '3 months', '6 months', '1 year', 'Other date']) {
      expect(within(shortcuts).getByRole('radio', { name })).toBeInTheDocument()
    }
    await userEvent.click(within(shortcuts).getByRole('radio', { name: 'Other date' }))
    const { min, max } = thesisDeadlineRange(new Date())
    expect(deadline()).toHaveAttribute('min', min)
    expect(deadline()).toHaveAttribute('max', max)
    // A day typed there closes that day.
    fireEvent.change(deadline(), { target: { value: min } })
    expect(screen.getByText(/^Closes /)).toBeVisible()
    const convictions = screen.getByRole('radiogroup', { name: /Conviction$/ })
    for (const name of ['Low', 'Medium', 'High', 'Extreme']) {
      expect(within(convictions).getByRole('radio', { name })).not.toBeChecked()
    }
  })

  it('opens the calendar again after a shortcut, beside the "Other date" pill (TC-33)', async () => {
    renderEditor()
    const shortcuts = screen.getByRole('radiogroup', { name: /Deadline$/ })
    await userEvent.click(within(shortcuts).getByRole('radio', { name: 'Other date' }))
    expect(deadline()).toBeInTheDocument()
    await userEvent.click(within(shortcuts).getByRole('radio', { name: '3 months' }))
    expect(screen.queryByLabelText('Deadline date', { selector: 'input' })).not.toBeInTheDocument()
    // The shortcut's day is set, and "Other date" still opens the calendar (it did not, PO 2026-11-02).
    await userEvent.click(within(shortcuts).getByRole('radio', { name: 'Other date' }))
    expect(within(shortcuts).getByRole('radio', { name: 'Other date' })).toBeChecked()
    expect(deadline()).toBeInTheDocument()
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
    // The ticket as it will be published (TC-11, PO 2026-11-06).
    expect(dialog).toHaveTextContent(/Asset.*\$NVDA.*Conviction.*High.*Target/)
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

  it('saves the thesis as a draft of the account, and saving again updates it (specs/thesis-drafts TD-01)', async () => {
    actions.saveDraft.mockResolvedValue({
      ok: true,
      data: { id: '00000000-0000-4000-8000-000000042001' },
    })
    renderEditor()
    await screen.findByText('NVIDIA')
    await userEvent.type(claim(), 'NVDA above 200')
    await userEvent.type(price(), '200')
    await userEvent.click(screen.getByRole('button', { name: 'Save draft' }))
    expect(actions.saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'THESIS',
        communityId: NVDA.id,
        title: 'NVDA above 200',
        thesis: expect.objectContaining({
          assetSymbol: 'NVDA',
          targetPrice: 200,
          direction: 'ABOVE',
        }),
      }),
    )
    expect(await screen.findByRole('button', { name: 'Saved' })).toBeInTheDocument()
    await userEvent.type(claim(), '!')
    await userEvent.click(screen.getByRole('button', { name: 'Save draft' }))
    expect(actions.saveDraft).toHaveBeenLastCalledWith(
      expect.objectContaining({ draftId: '00000000-0000-4000-8000-000000042001' }),
    )
  })

  it('opens a thesis draft from its list, and publishes it with its id (TD-03, TD-04)', async () => {
    const draft = {
      id: '00000000-0000-4000-8000-000000042900',
      type: 'THESIS' as const,
      title: 'ETH closes the year above 5K',
      body: 'Staking yield.',
      url: '',
      imageUrl: null,
      imageAlt: '',
      tag: '',
      community: null,
      related: [],
      thesis: {
        assetSymbol: 'ETH',
        targetPrice: 5000,
        direction: 'ABOVE' as const,
        deadline: null,
        conviction: 'MEDIUM' as const,
      },
      updatedAt: new Date().toISOString(),
    }
    actions.listDrafts.mockResolvedValue({ ok: true, data: [draft] })
    actions.createThesis.mockResolvedValue({ ok: true, data: { username: 'demo' } })
    renderEditor({ community: null })
    await userEvent.click(screen.getByRole('button', { name: 'Drafts' }))
    await userEvent.click(await screen.findByRole('button', { name: /^ETH closes the year/ }))
    expect(claim()).toHaveValue('ETH closes the year above 5K')
    expect(price()).toHaveValue('5000')
    expect(screen.getByRole('group', { name: /Asset$/ })).toHaveTextContent('$ETH')
    expect(screen.getByRole('radio', { name: 'Medium' })).toBeChecked()

    await userEvent.click(screen.getByRole('radio', { name: '3 months' }))
    await userEvent.type(reasoning(), ' More.')
    // The asset's community is not in the draft: chosen by hand.
    screen.getByRole('combobox', { name: 'Publishing in' }).focus()
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.click(await screen.findByRole('option', { name: /BTC/ }))
    await userEvent.click(publish())
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('checkbox'))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Publish thesis' }))
    expect(actions.createThesis.mock.calls[0]?.[1]).toBe(draft.id)
  })

  it('hands a post’s draft to the post editor (TD-03)', async () => {
    const post = {
      ...{
        id: '00000000-0000-4000-8000-000000042900',
        type: 'THESIS' as const,
        title: 'ETH closes the year above 5K',
        body: 'Staking yield.',
        url: '',
        imageUrl: null,
        imageAlt: '',
        tag: '',
        community: null,
        related: [],
        thesis: {
          assetSymbol: 'ETH',
          targetPrice: 5000,
          direction: 'ABOVE' as const,
          deadline: null,
          conviction: 'MEDIUM' as const,
        },
        updatedAt: new Date().toISOString(),
      },
      id: 'p1',
      type: 'TEXT' as const,
      title: 'A post',
      thesis: null,
    }
    actions.listDrafts.mockResolvedValue({ ok: true, data: [post] })
    const onOpenPostDraft = vi.fn()
    renderWithIntl(
      <AuthGateProvider signedIn>
        <ThesisEditor
          community={NVDA}
          storageKey={KEY}
          draftRef={{ current: null }}
          onCancel={vi.fn()}
          onFormat={vi.fn()}
          onPublished={vi.fn()}
          onOpenPostDraft={onOpenPostDraft}
        />
      </AuthGateProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Drafts' }))
    await userEvent.click(await screen.findByRole('button', { name: /^A post/ }))
    expect(onOpenPostDraft).toHaveBeenCalledWith(post)
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
    // Without the price, the direction it kept shows in the pills.
    actions.getAssetQuote.mockResolvedValue(null)
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
    expect(screen.getByRole('group', { name: /Asset$/ })).toHaveTextContent('$BTC')
    expect(screen.getByRole('combobox', { name: 'Publishing in' })).toHaveTextContent('#macro')
  })
})
