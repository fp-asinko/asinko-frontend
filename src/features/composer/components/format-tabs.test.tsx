import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Tabs } from '@/components/ui/tabs'
import { renderWithIntl } from '@/test/render-with-intl'
import { FormatTabs } from './format-tabs'

describe('FormatTabs (specs/thesis-create TC-01)', () => {
  it('offers the post formats and the thesis, last, in each language', async () => {
    const onValueChange = vi.fn()
    renderWithIntl(
      <Tabs value="TEXT" onValueChange={onValueChange}>
        <FormatTabs />
      </Tabs>,
      { locale: 'es' },
    )
    expect(screen.getByRole('tablist', { name: 'Tipo de post' })).toBeInTheDocument()
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Thought',
      'Texto',
      'Link',
      'Imagen',
      'Tesis',
    ])
    await userEvent.click(screen.getByRole('tab', { name: 'Tesis' }))
    expect(onValueChange.mock.calls[0]?.[0]).toBe('THESIS')
  })
})
