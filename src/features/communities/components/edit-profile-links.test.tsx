import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import {
  editProfileSchema,
  type EditProfileForm,
  type EditProfileInput,
} from '../schemas/edit-profile.schema'
import { LinksField } from './edit-profile-links'

function Links({ links = [] as string[] }) {
  const form = useForm<EditProfileForm, unknown, EditProfileInput>({
    resolver: zodResolver(editProfileSchema),
    mode: 'onChange',
    defaultValues: {
      displayName: '',
      headline: '',
      countryCode: '',
      city: '',
      bio: '',
      links: links.map((url) => ({ url })),
      avatarUrl: null,
      bannerUrl: null,
    },
  })
  return (
    <LinksField
      control={form.control}
      register={form.register}
      errors={form.formState.errors.links}
    />
  )
}

const add = () => screen.getByRole('button', { name: 'Add link' })
const link = (number: number) => screen.getByRole('textbox', { name: `Link ${number}` })

describe('LinksField (specs/profile-presentation PP-06)', () => {
  it('adds up to five, the focus in each new one', async () => {
    renderWithIntl(<Links />)
    expect(screen.getByRole('group', { name: 'Links' })).toBeInTheDocument()
    for (let number = 1; number <= 5; number += 1) {
      await userEvent.click(add())
      expect(link(number)).toHaveFocus()
    }
    expect(screen.queryByRole('button', { name: 'Add link' })).toBeNull()
  })

  it("shows the site's mark as soon as the link is one", async () => {
    const { container } = renderWithIntl(<Links links={['https://example.com']} />)
    expect(container.querySelector('.lucide-globe')).not.toBeNull()
    await userEvent.clear(link(1))
    await userEvent.type(link(1), 'https://github.com/demo')
    expect(container.querySelector('.lucide-globe')).toBeNull()
  })

  it('says what is wrong with a link that is not http(s)', async () => {
    renderWithIntl(<Links links={['https://example.com']} />)
    await userEvent.clear(link(1))
    await userEvent.type(link(1), 'ftp://example.com')
    expect(link(1)).toHaveAttribute('aria-invalid', 'true')
    expect(link(1)).toHaveAccessibleDescription('Enter a link that starts with http:// or https://')
  })

  it('takes one out: the focus to the link in its place, the one before, or Add link', async () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      setTimeout(() => callback(0))
      return 0
    })
    renderWithIntl(<Links links={['https://a.com', 'https://b.com', 'https://c.com']} />)
    await userEvent.click(screen.getByRole('button', { name: 'Remove link 1' }))
    await vi.waitFor(() => expect(link(1)).toHaveFocus())
    expect(link(1)).toHaveValue('https://b.com')

    await userEvent.click(screen.getByRole('button', { name: 'Remove link 2' }))
    await vi.waitFor(() => expect(link(1)).toHaveFocus())

    await userEvent.click(screen.getByRole('button', { name: 'Remove link 1' }))
    await vi.waitFor(() => expect(add()).toHaveFocus())
    vi.restoreAllMocks()
  })
})
