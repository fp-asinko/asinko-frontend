import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm, useWatch } from 'react-hook-form'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { CountedField, CountryField } from './edit-profile-fields'

function Counted({ max = 10, error }: { max?: number; error?: string }) {
  const { register, control } = useForm({ defaultValues: { text: '' } })
  const value = useWatch({ control, name: 'text' })
  return (
    <CountedField
      id="text"
      label="Headline"
      max={max}
      value={value}
      field={register('text')}
      error={error}
    />
  )
}

function Country() {
  const { register } = useForm({ defaultValues: { country: '' } })
  return <CountryField id="country" field={register('country')} />
}

describe('CountedField (specs/profile-presentation PP-05)', () => {
  it('counts from 80% of the limit, and says it past it', async () => {
    renderWithIntl(<Counted />)
    const field = screen.getByRole('textbox', { name: 'Headline' })
    await userEvent.type(field, '1234567')
    expect(screen.queryByText('7/10')).toBeNull()
    await userEvent.type(field, '8')
    expect(field).toHaveAccessibleDescription('8/10')
    expect(field).not.toHaveAttribute('aria-invalid')

    await userEvent.type(field, '901')
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(field).toHaveAccessibleDescription(/11\/10/)
    expect(field).toHaveAccessibleDescription(/Up to 10 characters/)
  })

  it('says the error it is given', () => {
    renderWithIntl(<Counted error="Up to 60 characters" />)
    const field = screen.getByRole('textbox', { name: 'Headline' })
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(field).toHaveAccessibleDescription('Up to 60 characters')
  })
})

describe('CountryField (specs/profile-presentation Q2)', () => {
  it("offers no country first, then every country in the page's language", async () => {
    renderWithIntl(<Country />, { locale: 'es' })
    const select = screen.getByRole('combobox', { name: 'País' })
    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveTextContent('Sin país')
    expect(screen.getByRole('option', { name: 'Alemania' })).toBeInTheDocument()
    await userEvent.selectOptions(select, 'BR')
    expect(select).toHaveValue('BR')
  })
})
