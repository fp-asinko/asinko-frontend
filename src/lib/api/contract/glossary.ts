import { z } from 'zod'

// P-032 (proposal, docs/references/api/proposals.md, specs/glossary): a glossary term, the
// platform's own content, as it comes inside the Home's feeds (kind GLOSSARY).

export const glossaryTermSchema = z.object({
  id: z.uuid(),
  term: z.string().min(1),
  /** Its group: "Trading", "Macro and bonds". */
  category: z.string().min(1),
  definition: z.string().min(1),
  example: z.string().min(1).nullable(),
})

export type RawGlossaryTerm = z.infer<typeof glossaryTermSchema>
