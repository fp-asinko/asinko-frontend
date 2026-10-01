// Conventional Commits with the types allowed in docs/ai-guidelines/conventions.md.
export const COMMIT_TYPES = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'test',
  'chore',
  'perf',
  'ci',
]

const config = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': /** @type {const} */ ([2, 'always', COMMIT_TYPES]),
  },
}

export default config
