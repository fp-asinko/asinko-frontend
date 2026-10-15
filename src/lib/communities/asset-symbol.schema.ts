import { z } from 'zod'

/**
 * A symbol of the asset catalog (backend 2026-10-13): letters and digits, and inside it ".", "/" and
 * "-" (BRK.B, XAU/USD, SQM-B). Checked before the network; the API client encodes it in the path
 * (XAU%2FUSD).
 */
export const assetSymbolSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9./-]{0,31}$/)
