import 'server-only'
import { LOGO_BASELINE, LOGO_DOT, LOGO_LETTERS, LOGO_OFFSET, LOGO_VIEWBOX } from './asinko-logo'

// Apart from the shapes: the page's logo (also in client components) never ships this.

/** The wordmark as an SVG document, with its colors written in (no theme outside the page). */
export function asinkoLogoSvg({ ink, dot }: { ink: string; dot: string }): string {
  const letters = LOGO_LETTERS.map(
    (letter) => `<path transform="translate(${letter.x} ${LOGO_BASELINE})" d="${letter.d}"/>`,
  ).join('')
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LOGO_VIEWBOX.width} ${LOGO_VIEWBOX.height}">` +
    `<g transform="translate(${LOGO_OFFSET.x} ${LOGO_OFFSET.y})">` +
    `<g fill="${ink}">${letters}</g>` +
    `<circle cx="${LOGO_DOT.cx}" cy="${LOGO_DOT.cy}" r="${LOGO_DOT.r}" fill="${dot}"/>` +
    '</g></svg>'
  )
}
