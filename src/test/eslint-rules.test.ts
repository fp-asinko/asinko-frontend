// @vitest-environment node
import path from 'node:path'
import { ESLint } from 'eslint'
import { beforeAll, describe, expect, it } from 'vitest'

// Verifies the project-specific lint rules (F-03, F-04) against intentional violations in
// src/test/fixtures/boundaries/. Those files are globally ignored, so `ignore: false` lints them here.
const FIXTURES = path.resolve(import.meta.dirname, 'fixtures/boundaries/src')

type Finding = { file: string; ruleId: string | null }

let findings: Finding[] = []

function rulesFor(relativeFile: string) {
  return findings.filter((f) => f.file === relativeFile).map((f) => f.ruleId)
}

describe('project lint rules', () => {
  beforeAll(async () => {
    const eslint = new ESLint({ ignore: false })
    const results = await eslint.lintFiles([FIXTURES])
    findings = results.flatMap((result) =>
      result.messages.map((message) => ({
        file: path.relative(FIXTURES, result.filePath).split(path.sep).join('/'),
        ruleId: message.ruleId,
      })),
    )
  }, 60_000)

  it('forbids a feature importing another feature', () => {
    expect(rulesFor('features/profile/uses-home.ts')).toContain('boundaries/dependencies')
  })

  it('forbids components/ importing features/', () => {
    expect(rulesFor('components/organisms/uses-feature.tsx')).toContain('boundaries/dependencies')
  })

  it('forbids an atom importing a molecule', () => {
    expect(rulesFor('components/ui/uses-molecule.tsx')).toContain('boundaries/dependencies')
  })

  it('forbids next/link outside src/i18n/', () => {
    expect(rulesFor('components/molecules/uses-next-link.tsx')).toContain('no-restricted-imports')
  })

  it('forbids dangerouslySetInnerHTML', () => {
    expect(rulesFor('components/molecules/uses-danger.tsx')).toContain('react/no-danger')
  })

  it('forbids Radix imports', () => {
    expect(rulesFor('components/ui/uses-radix.tsx')).toContain('no-restricted-imports')
  })

  it('allows the dependencies the guides permit', () => {
    expect(rulesFor('features/home/internal.ts')).toEqual([])
    expect(rulesFor('components/molecules/search-field.tsx')).toEqual([])
    expect(rulesFor('components/ui/ok-atom.tsx')).toEqual([])
  })
})
