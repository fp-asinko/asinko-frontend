/**
 * What the bytes say they are: the type the browser sends is not trusted (security.md § 6). Only
 * what prepareImage gives: WebP, or JPEG where the browser cannot write WebP.
 */
export function sniffImage(head: Uint8Array): 'image/webp' | 'image/jpeg' | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...head.subarray(from, to))
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp'
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return 'image/jpeg'
  return null
}
