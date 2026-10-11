// The light theme's tokens for the share images (specs/share-preview SP-03): ImageResponse does not
// read CSS variables, so the values are copied here. colors.test.ts checks them against
// globals.css, so a token that changes there fails the tests until it changes here too.

export const SHARE_COLORS = {
  background: '#ffffff',
  foreground: '#17181a',
  mutedForeground: '#5c5d60',
  surface: '#f6f8f9',
  border: '#e5e8eb',
  brandDot: '#155de9',
  avatarForeground: '#ffffff',
} as const

/** --avatar-0 … --avatar-7 and their -to: the identity hues (design-system.md § Color). */
export const SHARE_IDENTITY = [
  ['#2378c2', '#0059a2'],
  ['#5d69cb', '#434baa'],
  ['#835cbe', '#663e9e'],
  ['#ab4b90', '#8b2d72'],
  ['#af5a21', '#8e3c00'],
  ['#9d6300', '#7e4600'],
  ['#007b76', '#005d59'],
  ['#007694', '#005976'],
] as const
