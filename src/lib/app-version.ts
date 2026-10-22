import 'server-only'
import { version } from '../../package.json'

/**
 * The app's version, from package.json: the footer of the right column says which one is running
 * (PO, 2026-10-21). Server only, so package.json never reaches the browser.
 */
export const APP_VERSION: string = version
