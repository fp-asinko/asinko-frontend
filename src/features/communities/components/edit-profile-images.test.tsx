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

async function openMenu(name: string) {
  await userEvent.click(screen.getByRole('button', { name }))
  return screen.findByRole('menu')
}

describe('ProfileImages (specs/profile-edit-flow EF-01)', () => {
  it('uploads an image for the banner or the photo from the camera over each, only JPEG, PNG or WebP', async () => {
    const { onPick, input } = renderImages()
    expect(screen.getByRole('group', { name: 'Photo and banner' })).toBeInTheDocument()
    expect(input).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp')
    const photo = new File(['x'], 'me.png', { type: 'image/png' })

    await openMenu('Change banner')
    await userEvent.click(screen.getByRole('menuitem', { name: 'Upload image' }))
    await userEvent.upload(input, photo)
    expect(onPick).toHaveBeenLastCalledWith('banner', photo)

    await openMenu('Change photo')
    await userEvent.click(screen.getByRole('menuitem', { name: 'Upload image' }))
    await userEvent.upload(input, photo)
    expect(onPick).toHaveBeenLastCalledWith('avatar', photo)
  })

  it('offers Remove only for what there is', async () => {
    const { onRemove } = renderImages({ banner: '/mocks/banner-demo.svg' })
    await openMenu('Change photo')
    expect(screen.queryByRole('menuitem', { name: 'Remove' })).toBeNull()
    await userEvent.keyboard('{Escape}')

    await openMenu('Change banner')
    await userEvent.click(screen.getByRole('menuitem', { name: 'Remove' }))
    expect(onRemove).toHaveBeenCalledWith('banner')
  })
})
