import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { RulesWidgetBody } from './rules-widget'
import { RULES } from './widgets.fixture'
vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

describe('RulesWidgetBody (specs/community-widgets CW-06)', () => {
  it('numbers the rules; one with a description unfolds it, one without is plain', async () => {
    renderWithIntl(<RulesWidgetBody widget={RULES} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    const first = screen.getByText('Data or it did not happen').closest('details')!
    await userEvent.click(screen.getByText('Data or it did not happen'))
    expect(first).toHaveAttribute('open')
    expect(within(first).getByText('Every claim with its source.')).toBeVisible()
    expect(screen.getByText('No paid signals').closest('details')).toBeNull()
  })
})
