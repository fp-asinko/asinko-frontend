import { renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import en from '../../../../../../messages/en.json'
import { AddItem, ListError, ListItem, useWidgetError } from './form-parts'

describe('form parts of "Edit widgets" (specs/community-widgets CW-10)', () => {
  it('names a list item by its legend, with its ×', async () => {
    const onRemove = vi.fn()
    renderWithIntl(
      <ListItem legend="Rule 1" removeLabel="Remove rule 1" onRemove={onRemove}>
        <input aria-label="Rule" />
      </ListItem>,
    )
    expect(screen.getByRole('group', { name: 'Rule 1' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Remove rule 1' }))
    expect(onRemove).toHaveBeenCalled()
  })

  it('adds with a pill, and says what is wrong with a list', async () => {
    const onClick = vi.fn()
    renderWithIntl(
      <>
        <AddItem onClick={onClick}>Add rule</AddItem>
        <ListError message="Add at least one" />
        <ListError />
      </>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Add rule' }))
    expect(onClick).toHaveBeenCalled()
    expect(screen.getByText('Add at least one')).toBeInTheDocument()
  })

  it('translates only the widget keys', () => {
    const { result } = renderHook(() => useWidgetError(), {
      wrapper: ({ children }) => (
        <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
          {children}
        </NextIntlClientProvider>
      ),
    })
    expect(result.current('communities.widgets.errors.titleRequired')).toBe('Write a title')
    expect(result.current('api.errors.UNAVAILABLE')).toBeUndefined()
    expect(result.current(undefined)).toBeUndefined()
  })
})
