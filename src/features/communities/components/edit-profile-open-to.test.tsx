import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { OpenToField } from './edit-profile-open-to'

function Form({ initial }: { initial: string[] }) {
  const { register } = useForm({ defaultValues: { openTo: initial } })
  return <OpenToField id="open-to" field={register('openTo')} />
}

describe('OpenToField (specs/profile-showcase PS-09)', () => {
  it("offers the list's options as checkboxes under their legend, any number at once", async () => {
    renderWithIntl(<Form initial={['AMAS']} />)
    const group = screen.getByRole('group', { name: 'Open to' })
    expect(within(group).getAllByRole('checkbox')).toHaveLength(5)
    expect(within(group).getByRole('checkbox', { name: 'AMAs' })).toBeChecked()

    await userEvent.click(within(group).getByRole('checkbox', { name: 'Collaborations' }))
    // What the form saves is checked in the dialog's test.
    expect(within(group).getByRole('checkbox', { name: 'Collaborations' })).toBeChecked()
    expect(within(group).getByRole('checkbox', { name: 'AMAs' })).toBeChecked()
  })
})
