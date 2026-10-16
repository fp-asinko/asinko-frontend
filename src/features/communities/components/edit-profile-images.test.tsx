import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { ProfileImages } from './edit-profile-images'

function renderImages(images: { avatar?: string | null; banner?: string | null } = {}) {
  const onPick = vi.fn()
  const onRemove = vi.fn()
  const { container } = renderWithIntl(
    <ProfileImages
      idPrefix="images"
      username="demo"
      avatar={images.avatar ?? null}
      banner={images.banner ?? null}
      onPick={onPick}
      onRemove={onRemove}
    />,
  )
  const input = container.querySelector('input[type="file"]') as HTMLInputElement
  return { onPick, onRemove, input }
}

describe('ProfileImages (specs/profile-presentation PP-07)', () => {
  it('picks an image for the photo or the banner, only JPEG, PNG or WebP', async () => {
    const { onPick, input } = renderImages()
    expect(screen.getByRole('group', { name: 'Photo and banner' })).toBeInTheDocument()
    expect(input).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp')
    const photo = new File(['x'], 'me.png', { type: 'image/png' })

    await userEvent.click(screen.getByRole('button', { name: 'Change banner' }))
    await userEvent.upload(input, photo)
    expect(onPick).toHaveBeenLastCalledWith('banner', photo)
    await userEvent.click(screen.getByRole('button', { name: 'Change photo' }))
    await userEvent.upload(input, photo)
    expect(onPick).toHaveBeenLastCalledWith('avatar', photo)
  })

  it('offers Remove only for what there is', async () => {
    const { onRemove } = renderImages({ banner: '/mocks/banner-demo.svg' })
    expect(screen.queryByRole('button', { name: 'Remove photo' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Remove banner' }))
    expect(onRemove).toHaveBeenCalledWith('banner')
    // Remove goes away with the image: the focus goes to its Change (WCAG 2.4.3).
    await vi.waitFor(() =>
      expect(screen.getByRole('button', { name: 'Change banner' })).toHaveFocus(),
    )
  })
})
